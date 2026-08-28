import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Mocks: no real Postgres, no real Resend, no network ----
const h = vi.hoisted(() => {
  const query = vi.fn();
  const release = vi.fn();
  const connect = vi.fn();
  const send = vi.fn();
  return { query, release, connect, send };
});

vi.mock("pg", () => ({
  Pool: vi.fn(() => ({ connect: h.connect })),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({ emails: { send: h.send } })),
}));

import { POST } from "@/app/api/contact/route";

const validBody = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: "",
  message: "Please quote a walnut console table about 48 inches wide.",
};

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  h.connect.mockResolvedValue({ query: h.query, release: h.release });
  h.query.mockImplementation(async (sql: string) => {
    if (/RETURNING id/i.test(sql)) return { rows: [{ id: "lead-1" }] };
    return { rows: [] };
  });
  h.send.mockResolvedValue({ data: { id: "email-1" }, error: null });
});

describe("POST /api/contact — validation", () => {
  it("rejects an invalid email before touching the database", async () => {
    const res = await post({ ...validBody, email: "nope" });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false });
    expect(h.connect).not.toHaveBeenCalled();
  });

  it("rejects a too-short message", async () => {
    const res = await post({ ...validBody, message: "hi" });
    expect(res.status).toBe(400);
    expect(h.connect).not.toHaveBeenCalled();
  });
});

describe("POST /api/contact — success path (mocked DB + Resend)", () => {
  it("inserts the lead + token, commits, sends the confirmation, returns ok", async () => {
    const res = await post(validBody);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true });

    const sql = h.query.mock.calls.map((c) => String(c[0]));
    expect(sql.some((s) => /BEGIN/i.test(s))).toBe(true);
    expect(sql.some((s) => /INSERT INTO app\.leads/i.test(s))).toBe(true);
    expect(sql.some((s) => /INSERT INTO app\.email_verification_tokens/i.test(s))).toBe(true);
    expect(sql.some((s) => /COMMIT/i.test(s))).toBe(true);

    expect(h.send).toHaveBeenCalledTimes(1);
    expect(h.send.mock.calls[0][0]).toMatchObject({ to: "jane@example.com" });
    expect(h.release).toHaveBeenCalled();
  });

  it("normalizes the email to lowercase before storing", async () => {
    await post({ ...validBody, email: "Jane@EXAMPLE.com" });
    const leadInsert = h.query.mock.calls.find((c) =>
      /INSERT INTO app\.leads/i.test(String(c[0])),
    );
    expect(leadInsert?.[1]?.[2]).toBe("jane@example.com");
  });
});

describe("POST /api/contact — failure behavior", () => {
  it("still returns ok:true when EMAIL_FROM is missing and does NOT call Resend (documents TECHNICAL_DEBT A4)", async () => {
    vi.stubEnv("EMAIL_FROM", "");
    const res = await post(validBody);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true });
    expect(h.send).not.toHaveBeenCalled();
  });

  it("returns 500 and rolls back when Resend throws", async () => {
    h.send.mockRejectedValueOnce(new Error("resend unreachable"));
    const res = await post(validBody);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ ok: false });
    expect(h.query.mock.calls.map((c) => String(c[0])).some((s) => /ROLLBACK/i.test(s))).toBe(true);
  });

  it("returns 500 when the database connection fails", async () => {
    h.connect.mockRejectedValueOnce(new Error("no db"));
    const res = await post(validBody);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ ok: false });
    expect(h.send).not.toHaveBeenCalled();
  });
});
