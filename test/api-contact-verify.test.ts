import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => {
  const query = vi.fn();
  const release = vi.fn();
  const connect = vi.fn();
  const send = vi.fn();
  return { query, release, connect, send };
});

vi.mock("pg", () => ({ Pool: vi.fn(() => ({ connect: h.connect })) }));
vi.mock("resend", () => ({ Resend: vi.fn(() => ({ emails: { send: h.send } })) }));

import { GET } from "@/app/api/contact/verify/route";

function get(qs: string) {
  return GET(new Request(`http://localhost:3000/api/contact/verify${qs}`));
}

const dbRow = {
  token_id: "tok-1",
  lead_id: "lead-1",
  email: "jane@example.com",
  expires_at: new Date(Date.now() + 3600_000).toISOString(),
  used_at: null,
  first_name: "Jane",
  last_name: "Doe",
  phone: null,
  message: "Quote please",
  created_at: new Date().toISOString(),
  verified: false,
  project_context: null,
};

/** Program client.query: SELECT returns `selectRows`, everything else returns []. */
function programQuery(selectRows: unknown[]) {
  h.query.mockImplementation(async (sql: string) => {
    if (/SELECT/i.test(sql) && /email_verification_tokens/i.test(sql)) {
      return { rows: selectRows };
    }
    return { rows: [] };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.connect.mockResolvedValue({ query: h.query, release: h.release });
  h.send.mockResolvedValue({ data: { id: "email-1" }, error: null });
  programQuery([dbRow]);
});

describe("GET /api/contact/verify", () => {
  it("returns 400 when the token is missing (no DB call)", async () => {
    const res = await get("");
    expect(res.status).toBe(400);
    expect(h.connect).not.toHaveBeenCalled();
  });

  it("returns 400 and rolls back for an unknown/expired token", async () => {
    programQuery([]);
    const res = await get("?token=whatever");
    expect(res.status).toBe(400);
    expect(h.query.mock.calls.map((c) => String(c[0])).some((s) => /ROLLBACK/i.test(s))).toBe(true);
    expect(h.send).not.toHaveBeenCalled();
  });

  it("verifies an unverified lead, marks the token used, notifies the owner, and redirects", async () => {
    const res = await get("?token=validtoken");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/contact?confirmed=1");

    const sql = h.query.mock.calls.map((c) => String(c[0]));
    expect(sql.some((s) => /UPDATE app\.leads\s+SET verified/i.test(s))).toBe(true);
    expect(sql.some((s) => /UPDATE app\.email_verification_tokens\s+SET used_at/i.test(s))).toBe(true);
    expect(sql.some((s) => /COMMIT/i.test(s))).toBe(true);

    expect(h.send).toHaveBeenCalledTimes(1);
    expect(h.send.mock.calls[0][0]).toMatchObject({ to: "owner@example.test" });
  });

  it("does NOT re-verify an already-verified lead but still consumes the token and redirects", async () => {
    programQuery([{ ...dbRow, verified: true }]);
    const res = await get("?token=validtoken");
    expect(res.status).toBe(302);

    const sql = h.query.mock.calls.map((c) => String(c[0]));
    expect(sql.some((s) => /UPDATE app\.leads\s+SET verified/i.test(s))).toBe(false);
    expect(sql.some((s) => /UPDATE app\.email_verification_tokens\s+SET used_at/i.test(s))).toBe(true);
  });

  it("returns 500 when a query throws", async () => {
    h.query.mockRejectedValueOnce(new Error("db exploded"));
    const res = await get("?token=validtoken");
    expect(res.status).toBe(500);
  });
});

describe("GET /api/contact/verify — project context in the internal email", () => {
  it("includes gallery/project details in the notification email when present", async () => {
    programQuery([
      {
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
    ]);

    await get("?token=validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).toContain("Inspired by:");
    expect(html).toContain("Puzzle Dining Table");
    expect(html).toContain("Category:");
    expect(html).toContain("Specialty Projects");
    expect(html).toContain("Project type:");
    expect(html).toContain("Approx. dimensions:");
    expect(html).toContain("6&#39; long x 3&#39; wide"); // apostrophes are HTML-escaped
    expect(html).toContain("Timeframe:");
    expect(html).toContain("Within 3");
  });

  it("omits the project context block entirely for a normal, non-Gallery inquiry", async () => {
    programQuery([{ ...dbRow, project_context: null }]);
    await get("?token=validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).not.toContain("Inspired by:");
    expect(html).not.toContain("Approx. dimensions:");
  });

  it("only renders the fields that are actually present", async () => {
    programQuery([{ ...dbRow, project_context: { dimensions: "6ft x 3ft" } }]);
    await get("?token=validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).toContain("Approx. dimensions:");
    expect(html).not.toContain("Inspired by:");
    expect(html).not.toContain("Timeframe:");
  });

  it("escapes HTML in the free-text dimensions field before emailing it", async () => {
    programQuery([
      { ...dbRow, project_context: { dimensions: `<img src=x onerror=alert(1)>` } },
    ]);
    await get("?token=validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });
});

describe("GET /api/contact/verify — Category vs Project Type redundancy", () => {
  it("suppresses Category when it matches Project Type", async () => {
    programQuery([
      {
        ...dbRow,
        project_context: {
          galleryTitle: "Live Edge Coffee Table",
          galleryCategory: "tables",
          projectType: "tables",
        },
      },
    ]);
    await get("?token=validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).toContain("Inspired by:");
    expect(html).toContain("Live Edge Coffee Table");
    expect(html).not.toContain("Category:");
    expect(html).toContain("Project type:");
  });

  it("shows both Category and Project Type when they differ", async () => {
    programQuery([
      {
        ...dbRow,
        project_context: {
          galleryTitle: "Keepsake Boxes",
          galleryCategory: "specialty-projects",
          projectType: "tables",
        },
      },
    ]);
    await get("?token=validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).toContain("Category:");
    expect(html).toContain("Specialty Projects");
    expect(html).toContain("Project type:");
    expect(html).toContain("Tables");
  });

  it("shows Category alone when there's Gallery context but no selected Project Type", async () => {
    programQuery([
      {
        ...dbRow,
        project_context: { galleryTitle: "Garage Bar", galleryCategory: "specialty-projects" },
      },
    ]);
    await get("?token=validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).toContain("Category:");
    expect(html).toContain("Specialty Projects");
    expect(html).not.toContain("Project type:");
  });

  it("shows Project Type alone for a generic (non-Gallery) inquiry", async () => {
    programQuery([{ ...dbRow, project_context: { projectType: "cabinets" } }]);
    await get("?token=validtoken");

    const html = h.send.mock.calls[0][0].html as string;
    expect(html).not.toContain("Category:");
    expect(html).not.toContain("Inspired by:");
    expect(html).toContain("Project type:");
    expect(html).toContain("Cabinets");
  });
});

describe("GET /api/contact/verify — phone formatting (presentation only)", () => {
  it("formats a plain 10-digit US number", async () => {
    programQuery([{ ...dbRow, phone: "3123637064" }]);
    await get("?token=validtoken");
    expect(h.send.mock.calls[0][0].html).toContain("(312) 363-7064");
  });

  it("formats an 11-digit number with a leading US country code", async () => {
    programQuery([{ ...dbRow, phone: "13123637064" }]);
    await get("?token=validtoken");
    expect(h.send.mock.calls[0][0].html).toContain("(312) 363-7064");
  });

  it("leaves an unrecognized format as entered rather than mangling it", async () => {
    programQuery([{ ...dbRow, phone: "+44 20 7946 0958" }]);
    await get("?token=validtoken");
    expect(h.send.mock.calls[0][0].html).toContain("+44 20 7946 0958");
  });

  it("shows an em dash when no phone was provided", async () => {
    programQuery([{ ...dbRow, phone: null }]);
    await get("?token=validtoken");
    expect(h.send.mock.calls[0][0].html).toContain("<strong>Phone:</strong> —");
  });
});

describe("GET /api/contact/verify — message rendering and escaping", () => {
  it("trims leading/trailing whitespace but preserves internal line breaks", async () => {
    programQuery([{ ...dbRow, message: "   Line one.\nLine two.   " }]);
    await get("?token=validtoken");
    const html = h.send.mock.calls[0][0].html as string;
    // No stray whitespace between the container tag and the trimmed content.
    expect(html).toContain(">Line one.\nLine two.<");
  });

  it("escapes HTML in the customer message rather than interpreting it", async () => {
    programQuery([{ ...dbRow, message: `<script>alert("x")</script>` }]);
    await get("?token=validtoken");
    const html = h.send.mock.calls[0][0].html as string;
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes name and phone consistently with the other fields", async () => {
    programQuery([
      { ...dbRow, first_name: "<b>Jane</b>", last_name: "O'Brien", phone: "<b>911</b>" },
    ]);
    await get("?token=validtoken");
    const html = h.send.mock.calls[0][0].html as string;
    expect(html).not.toContain("<b>Jane</b>");
    expect(html).toContain("&lt;b&gt;Jane&lt;/b&gt;");
    expect(html).toContain("O&#39;Brien");
    expect(html).not.toContain("<b>911</b>");
  });
});

describe("GET /api/contact/verify — submitted timestamp", () => {
  it("formats the timestamp in America/Chicago regardless of server timezone", async () => {
    // September is Central Daylight Time (UTC-5) — 02:39 UTC -> 9:39 PM the previous day.
    programQuery([{ ...dbRow, created_at: "2026-09-10T02:39:00.000Z" }]);
    await get("?token=validtoken");
    const html = h.send.mock.calls[0][0].html as string;
    expect(html).toContain("September 9, 2026");
    expect(html).toContain("9:39 PM");
    expect(html).toContain("CDT");
    // Not a raw/ambiguous UTC-looking timestamp.
    expect(html).not.toContain("2026-09-10T02:39");
  });
});
