import { describe, it, expect } from "vitest";
import {
  validateContactForm,
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
