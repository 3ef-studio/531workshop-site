import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => {
  const query = vi.fn();
  const release = vi.fn();
  const connect = vi.fn();
  const send = vi.fn();
  return { query, release, connect, send };
});

vi.mock("pg", () => ({
  // `query` is exposed directly on the Pool (used by GET's read-only lookup,
  // which doesn't need a transaction) alongside `connect` (used by POST's
  // real confirm transaction) — both resolve through the same mock.
  Pool: vi.fn(() => ({ connect: h.connect, query: h.query })),
}));
vi.mock("resend", () => ({ Resend: vi.fn(() => ({ emails: { send: h.send } })) }));

import { GET, POST } from "@/app/api/contact/verify/route";

function get(qs: string) {
  return GET(new Request(`http://localhost:3000/api/contact/verify${qs}`));
}

function post(token?: string) {
  const body = new URLSearchParams();
  if (token !== undefined) body.set("token", token);
  return POST(
    new Request("http://localhost:3000/api/contact/verify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }),
  );
}

const dbRow = {
  email: "jane@example.com",
  first_name: "Jane",
  last_name: "Doe",
  phone: null,
  message: "Quote please",
  created_at: new Date().toISOString(),
  verified: false,
  project_context: null,
};

const validClaim = { token_id: "tok-1", lead_id: "lead-1" };

/**
 * Programs the mocked `pg` client for the three query shapes this route
 * actually makes:
 *  - GET's read-only `SELECT 1 ... WHERE used_at IS NULL AND expires_at > now()`
 *  - POST's atomic claim `UPDATE ... SET used_at = now() ... RETURNING`
 *  - POST's follow-up `SELECT ... FROM app.leads WHERE id = $1`
 */
function programQuery(opts: {
  tokenLookupValid?: boolean;
  claimRow?: typeof validClaim | null;
  leadRow?: Partial<typeof dbRow> | null;
} = {}) {
  const { tokenLookupValid = true, claimRow = validClaim, leadRow = dbRow } = opts;
  h.query.mockImplementation(async (sql: string) => {
    if (/SELECT 1 FROM app\.email_verification_tokens/i.test(sql)) {
      return { rows: tokenLookupValid ? [{}] : [] };
    }
    if (/UPDATE app\.email_verification_tokens/i.test(sql) && /RETURNING/i.test(sql)) {
      return { rows: claimRow ? [claimRow] : [] };
    }
    if (/FROM app\.leads/i.test(sql)) {
      return { rows: leadRow ? [leadRow] : [] };
    }
    return { rows: [] };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.connect.mockResolvedValue({ query: h.query, release: h.release });
  h.send.mockResolvedValue({ data: { id: "email-1" }, error: null });
  programQuery();
});

describe("GET /api/contact/verify — read-only lookup, no side effects", () => {
  it("returns 400 when the token is missing (no DB call)", async () => {
    const res = await get("");
    expect(res.status).toBe(400);
    expect(h.query).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown/expired/already-used token", async () => {
    programQuery({ tokenLookupValid: false });
    const res = await get("?token=whatever");
    expect(res.status).toBe(400);
    expect(h.send).not.toHaveBeenCalled();
  });

  it("returns a confirm page with the token embedded, for a valid token", async () => {
    const res = await get("?token=validtoken");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const html = await res.text();
    expect(html).toContain('method="post"');
    expect(html).toContain('action="/api/contact/verify"');
    expect(html).toContain('name="token"');
    expect(html).toContain('value="validtoken"');
  });

  it("performs no write and sends no email — purely a read, regardless of token validity", async () => {
    await get("?token=validtoken");
    const sql = h.query.mock.calls.map((c) => String(c[0]));
    expect(sql.every((s) => /^\s*SELECT/i.test(s))).toBe(true);
    expect(h.send).not.toHaveBeenCalled();
    expect(h.connect).not.toHaveBeenCalled();
  });

  it("returns 500 when the lookup query throws", async () => {
    h.query.mockRejectedValueOnce(new Error("db exploded"));
    const res = await get("?token=validtoken");
    expect(res.status).toBe(500);
  });
});

describe("POST /api/contact/verify — the actual confirmation", () => {
  it("returns 400 when the token is missing from the form body (no DB call)", async () => {
    const res = await post();
    expect(res.status).toBe(400);
    expect(h.connect).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown/expired/already-used token and sends no email", async () => {
    programQuery({ claimRow: null });
    const res = await post("whatever");
    expect(res.status).toBe(400);
    expect(h.send).not.toHaveBeenCalled();
  });

  it("claims the token, verifies the lead, notifies the owner, and redirects", async () => {
    const res = await post("validtoken");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/contact?confirmed=1");

    const sql = h.query.mock.calls.map((c) => String(c[0]));
    expect(sql.some((s) => /UPDATE app\.email_verification_tokens\s+SET used_at/i.test(s))).toBe(true);
    expect(sql.some((s) => /UPDATE app\.leads\s+SET verified/i.test(s))).toBe(true);
    expect(sql.some((s) => /COMMIT/i.test(s))).toBe(true);

    expect(h.send).toHaveBeenCalledTimes(1);
    expect(h.send.mock.calls[0][0]).toMatchObject({ to: "owner@example.test", replyTo: "jane@example.com" });
  });

  it("does NOT re-verify an already-verified lead but still claims the token and redirects", async () => {
    programQuery({ leadRow: { ...dbRow, verified: true } });
    const res = await post("validtoken");
    expect(res.status).toBe(303);

    const sql = h.query.mock.calls.map((c) => String(c[0]));
    expect(sql.some((s) => /UPDATE app\.leads\s+SET verified/i.test(s))).toBe(false);
    expect(sql.some((s) => /UPDATE app\.email_verification_tokens\s+SET used_at/i.test(s))).toBe(true);
  });

  it("a second, overlapping confirm request for the same token claims nothing and sends no second email", async () => {
    // Models the exact race the atomic claim exists to prevent: two
    // requests for one token, only the first can ever win.
    let claimCalls = 0;
    h.query.mockImplementation(async (sql: string) => {
      if (/UPDATE app\.email_verification_tokens/i.test(sql) && /RETURNING/i.test(sql)) {
        claimCalls += 1;
        return { rows: claimCalls === 1 ? [validClaim] : [] };
      }
      if (/FROM app\.leads/i.test(sql)) return { rows: [dbRow] };
      return { rows: [] };
    });

    const first = await post("validtoken");
    const second = await post("validtoken");

    expect(first.status).toBe(303);
    expect(second.status).toBe(400);
    expect(h.send).toHaveBeenCalledTimes(1);
  });

  it("returns 500 and rolls back when a query throws mid-transaction", async () => {
    h.query.mockImplementation(async (sql: string) => {
      if (/UPDATE app\.email_verification_tokens/i.test(sql) && /RETURNING/i.test(sql)) {
        return { rows: [validClaim] };
      }
      throw new Error("db exploded");
    });
    const res = await post("validtoken");
    expect(res.status).toBe(500);
  });
});

describe("POST /api/contact/verify — project context in the internal email", () => {
  it("includes gallery/project details in the notification email when present", async () => {
    programQuery({
      leadRow: {
        ...dbRow,
        project_context: {
          gallerySlug: "keepsake-boxes",
          galleryTitle: "Puzzle Dining Table",
          galleryCategory: "specialty-projects",
          projectType: "tables",
          dimensions: "6' long x 3' wide",
          timeframe: "3-6-months",
        },
      },
    });

    await post("validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    const text = h.send.mock.calls[0][0].text as string;
    expect(html).toContain("Inspired by:");
    expect(html).toContain("Puzzle Dining Table");
    expect(html).toContain("Category:");
    expect(html).toContain("Specialty Projects");
    expect(html).toContain("Project type:");
    expect(html).toContain("Approx. dimensions:");
    expect(html).toContain("6&#39; long x 3&#39; wide"); // apostrophes are HTML-escaped
    expect(html).toContain("Timeframe:");
    expect(html).toContain("Within 3");

    // Plain-text alternative carries the same information, unescaped.
    expect(text).toContain("Inspired by: Puzzle Dining Table");
    expect(text).toContain("6' long x 3' wide");
  });

  it("omits the project context block entirely for a normal, non-Gallery inquiry", async () => {
    programQuery({ leadRow: { ...dbRow, project_context: null } });
    await post("validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).not.toContain("Inspired by:");
    expect(html).not.toContain("Approx. dimensions:");
  });

  it("only renders the fields that are actually present", async () => {
    programQuery({ leadRow: { ...dbRow, project_context: { dimensions: "6ft x 3ft" } } });
    await post("validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).toContain("Approx. dimensions:");
    expect(html).not.toContain("Inspired by:");
    expect(html).not.toContain("Timeframe:");
  });

  it("escapes HTML in the free-text dimensions field before emailing it", async () => {
    programQuery({
      leadRow: { ...dbRow, project_context: { dimensions: `<img src=x onerror=alert(1)>` } },
    });
    await post("validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });
});

describe("POST /api/contact/verify — Category vs Project Type redundancy", () => {
  it("suppresses Category when it matches Project Type", async () => {
    programQuery({
      leadRow: {
        ...dbRow,
        project_context: {
          galleryTitle: "Live Edge Coffee Table",
          galleryCategory: "tables",
          projectType: "tables",
        },
      },
    });
    await post("validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).toContain("Inspired by:");
    expect(html).toContain("Live Edge Coffee Table");
    expect(html).not.toContain("Category:");
    expect(html).toContain("Project type:");
  });

  it("shows both Category and Project Type when they differ", async () => {
    programQuery({
      leadRow: {
        ...dbRow,
        project_context: {
          galleryTitle: "Keepsake Boxes",
          galleryCategory: "specialty-projects",
          projectType: "tables",
        },
      },
    });
    await post("validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).toContain("Category:");
    expect(html).toContain("Specialty Projects");
    expect(html).toContain("Project type:");
    expect(html).toContain("Tables");
  });

  it("shows Category alone when there's Gallery context but no selected Project Type", async () => {
    programQuery({
      leadRow: { ...dbRow, project_context: { galleryTitle: "Garage Bar", galleryCategory: "specialty-projects" } },
    });
    await post("validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).toContain("Category:");
    expect(html).toContain("Specialty Projects");
    expect(html).not.toContain("Project type:");
  });

  it("shows Project Type alone for a generic (non-Gallery) inquiry", async () => {
    programQuery({ leadRow: { ...dbRow, project_context: { projectType: "cabinets" } } });
    await post("validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).not.toContain("Category:");
    expect(html).not.toContain("Inspired by:");
    expect(html).toContain("Project type:");
    expect(html).toContain("Cabinets");
  });
});

describe("POST /api/contact/verify — phone formatting (presentation only)", () => {
  it("formats a plain 10-digit US number", async () => {
    programQuery({ leadRow: { ...dbRow, phone: "3123637064" } });
    await post("validtoken");
    expect(h.send.mock.calls[0][0].html).toContain("(312) 363-7064");
  });

  it("formats an 11-digit number with a leading US country code", async () => {
    programQuery({ leadRow: { ...dbRow, phone: "13123637064" } });
    await post("validtoken");
    expect(h.send.mock.calls[0][0].html).toContain("(312) 363-7064");
  });

  it("leaves an unrecognized format as entered rather than mangling it", async () => {
    programQuery({ leadRow: { ...dbRow, phone: "+44 20 7946 0958" } });
    await post("validtoken");
    expect(h.send.mock.calls[0][0].html).toContain("+44 20 7946 0958");
  });

  it("shows an em dash when no phone was provided", async () => {
    programQuery({ leadRow: { ...dbRow, phone: null } });
    await post("validtoken");
    expect(h.send.mock.calls[0][0].html).toContain("<strong>Phone:</strong> —");
  });
});

describe("POST /api/contact/verify — message rendering and escaping", () => {
  it("trims leading/trailing whitespace but preserves internal line breaks", async () => {
    programQuery({ leadRow: { ...dbRow, message: "   Line one.\nLine two.   " } });
    await post("validtoken");
    const html = h.send.mock.calls[0][0].html as string;
    expect(html).toContain(">Line one.\nLine two.<");
  });

  it("escapes HTML in the customer message rather than interpreting it", async () => {
    programQuery({ leadRow: { ...dbRow, message: `<script>alert("x")</script>` } });
    await post("validtoken");
    const html = h.send.mock.calls[0][0].html as string;
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes name and phone consistently with the other fields", async () => {
    programQuery({
      leadRow: { ...dbRow, first_name: "<b>Jane</b>", last_name: "O'Brien", phone: "<b>911</b>" },
    });
    await post("validtoken");
    const html = h.send.mock.calls[0][0].html as string;
    expect(html).not.toContain("<b>Jane</b>");
    expect(html).toContain("&lt;b&gt;Jane&lt;/b&gt;");
    expect(html).toContain("O&#39;Brien");
    expect(html).not.toContain("<b>911</b>");
  });
});

describe("POST /api/contact/verify — submitted timestamp", () => {
  it("formats the timestamp in America/Chicago regardless of server timezone", async () => {
    programQuery({ leadRow: { ...dbRow, created_at: "2026-09-10T02:39:00.000Z" } });
    await post("validtoken");
    const html = h.send.mock.calls[0][0].html as string;
    expect(html).toContain("September 9, 2026");
    expect(html).toContain("9:39 PM");
    expect(html).toContain("CDT");
    expect(html).not.toContain("2026-09-10T02:39");
  });
});

describe("POST /api/contact/verify — email document structure", () => {
  it("wraps the notification in a full HTML document with a plain-text alternative", async () => {
    await post("validtoken");
    const call = h.send.mock.calls[0][0];
    expect(call.html).toContain("<!doctype html>");
    expect(call.html).toContain("<title>");
    expect(call.text).toBeTruthy();
    expect(call.text).toContain("New verified inquiry");
  });
});
