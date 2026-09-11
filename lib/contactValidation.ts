// lib/contactValidation.ts
//
// Client-side validation rules for the contact form. Extracted verbatim from
// components/ContactForm.tsx so the rules can be unit-tested. Behavior is unchanged.

import { MAX_DIMENSIONS_LENGTH } from "./contactOptions";

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
  else if (msg.length < 20) e.message = "Please share a few details (at least 20 characters).";
  else if (msg.length > 4000) e.message = "Message is too long.";

  // dimensions optional — just bounded, no format requirement
  if (values.dimensions.trim().length > MAX_DIMENSIONS_LENGTH) {
    e.dimensions = `Please keep this under ${MAX_DIMENSIONS_LENGTH} characters.`;
  }

  return e;
}
