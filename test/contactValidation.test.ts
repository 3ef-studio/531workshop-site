import { describe, it, expect } from "vitest";
import {
  validateContactForm,
  messageHasNoWhitespace,
  MIN_MESSAGE_LENGTH,
  MAX_MESSAGE_LENGTH,
  type ContactFormValues,
} from "@/lib/contactValidation";
import { MAX_DIMENSIONS_LENGTH } from "@/lib/contactOptions";

const valid: ContactFormValues = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: "",
  message: "I would like a quote for a walnut dining table, roughly 72 by 36 inches.",
  projectType: "",
  dimensions: "",
  timeframe: "",
};

describe("validateContactForm", () => {
  it("returns no errors for a fully valid submission", () => {
    expect(validateContactForm(valid)).toEqual({});
  });

  it("requires first and last name", () => {
    const errors = validateContactForm({ ...valid, firstName: "  ", lastName: "" });
    expect(errors.firstName).toBeTruthy();
    expect(errors.lastName).toBeTruthy();
  });

  it("requires a syntactically valid email", () => {
    expect(validateContactForm({ ...valid, email: "" }).email).toBe(
      "Email is required.",
    );
    expect(validateContactForm({ ...valid, email: "not-an-email" }).email).toBe(
      "Please enter a valid email.",
    );
  });

  it("treats phone as optional but rejects short numbers when present", () => {
    expect(validateContactForm({ ...valid, phone: "" }).phone).toBeUndefined();
    expect(validateContactForm({ ...valid, phone: "(630) 555-1212" }).phone).toBeUndefined();
    expect(validateContactForm({ ...valid, phone: "12345" }).phone).toBeTruthy();
  });

  it("enforces the message length window (20–4000 chars)", () => {
    expect(validateContactForm({ ...valid, message: "" }).message).toBe(
      "Message is required.",
    );
    expect(validateContactForm({ ...valid, message: "too short" }).message).toContain(
      "at least 20",
    );
    expect(
      validateContactForm({ ...valid, message: "x".repeat(4001) }).message,
    ).toBe("Message is too long.");
  });

  it("treats project type, dimensions, and timeframe as fully optional", () => {
    expect(validateContactForm(valid)).toEqual({});
    expect(
      validateContactForm({ ...valid, projectType: "tables", dimensions: "6' x 3'", timeframe: "flexible" }),
    ).toEqual({});
  });

  it("bounds the free-text dimensions field", () => {
    expect(validateContactForm({ ...valid, dimensions: "6' long x 3' wide" }).dimensions).toBeUndefined();
    expect(
      validateContactForm({ ...valid, dimensions: "x".repeat(MAX_DIMENSIONS_LENGTH + 1) }).dimensions,
    ).toBeTruthy();
  });
});

describe("messageHasNoWhitespace (contact-spam content-shape check)", () => {
  it("flags the observed spam shape: a single run of characters with no whitespace, 20+ chars", () => {
    expect(messageHasNoWhitespace("Ab3kx91LmP02QwrT7zXa")).toBe(true); // 20 chars, no spaces
    expect(messageHasNoWhitespace("x".repeat(30))).toBe(true);
  });

  it("does not flag a short no-space string under the length floor", () => {
    // Below MIN_MESSAGE_LENGTH — the ordinary min-length check handles this
    // case; this rule only concerns itself with the observed 20+-char shape.
    expect(messageHasNoWhitespace("nospaceshort")).toBe(false);
  });

  it("accepts a normal multi-sentence inquiry", () => {
    expect(
      messageHasNoWhitespace(
        "I would like a quote for a walnut dining table, roughly 72 by 36 inches.",
      ),
    ).toBe(false);
  });

  it("accepts a relatively terse but legitimate message", () => {
    expect(messageHasNoWhitespace("Do you build custom tables?")).toBe(false);
  });

  it("accepts a message exactly at the 20-character boundary that contains whitespace", () => {
    const boundaryMessage = "Please build a table";
    expect(boundaryMessage.length).toBe(MIN_MESSAGE_LENGTH);
    expect(messageHasNoWhitespace(boundaryMessage)).toBe(false);
  });

  it("documents a known, accepted limitation: a single space defeats this narrow check", () => {
    // This rule only checks for the *presence* of whitespace — it is not a
    // general coherence/gibberish detector, by design (see
    // docs/CONTACT_SPAM_INVESTIGATION.md). A bot that appended one space to
    // an otherwise-random string would not be caught by this rule alone.
    expect(messageHasNoWhitespace("a".repeat(19) + " ")).toBe(false);
  });

  it("MAX_MESSAGE_LENGTH matches the existing client upper bound", () => {
    expect(MAX_MESSAGE_LENGTH).toBe(4000);
  });
});
