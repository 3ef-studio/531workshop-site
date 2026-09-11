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
          gallerySlug: "puzzle-dining-table",
          galleryTitle: "Puzzle Dining Table",
          galleryCategory: "tables",
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
    expect(html).toContain("Tables");
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
