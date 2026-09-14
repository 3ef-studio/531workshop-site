// lib/contactValidation.ts
//
// Client-side validation rules for the contact form. Extracted verbatim from
// components/ContactForm.tsx so the rules can be unit-tested. Behavior is unchanged.
//
// MIN_MESSAGE_LENGTH, MAX_MESSAGE_LENGTH, and messageHasNoWhitespace are also
// imported by app/api/contact/route.ts so the client and server enforce the
// same message rules from one place — see docs/CONTACT_SPAM_INVESTIGATION.md.

import { MAX_DIMENSIONS_LENGTH } from "./contactOptions";

export const MIN_MESSAGE_LENGTH = 20;
export const MAX_MESSAGE_LENGTH = 4000;

export type ContactFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  /** Optional project context — see lib/contactOptions.ts for valid values. */
  projectType: string;
  dimensions: string;
  timeframe: string;
};

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Every submission in the 2026-09 automated spam wave (see
 * docs/CONTACT_SPAM_INVESTIGATION.md) used a single unbroken run of random
 * characters — no whitespace anywhere — as the message, always at or just
 * above 20 characters. A real inquiry, however short, always contains at
 * least one space. This is a narrow, evidence-based check against that one
 * observed shape — not a general gibberish/entropy/language detector — and
 * intentionally applies only to the message field.
 */
export function messageHasNoWhitespace(message: string): boolean {
  return message.length >= MIN_MESSAGE_LENGTH && !/\s/.test(message);
}

export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const e: ContactFormErrors = {};

  if (!values.firstName.trim()) e.firstName = "First name is required.";
  if (!values.lastName.trim()) e.lastName = "Last name is required.";

  const email = values.email.trim();
  if (!email) e.email = "Email is required.";
  else if (!emailRegex.test(email)) e.email = "Please enter a valid email.";

  // phone optional — if present, lightly validate
  const phone = values.phone.trim();
  if (phone) {
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 10) e.phone = "Please enter a valid phone number (10+ digits).";
  }

  const msg = values.message.trim();
  if (!msg) e.message = "Message is required.";
  else if (msg.length < MIN_MESSAGE_LENGTH)
    e.message = `Please share a few details (at least ${MIN_MESSAGE_LENGTH} characters).`;
  else if (msg.length > MAX_MESSAGE_LENGTH) e.message = "Message is too long.";

  // dimensions optional — just bounded, no format requirement
  if (values.dimensions.trim().length > MAX_DIMENSIONS_LENGTH) {
    e.dimensions = `Please keep this under ${MAX_DIMENSIONS_LENGTH} characters.`;
  }

  return e;
}
