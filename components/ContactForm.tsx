"use client";

import { useMemo, useState } from "react";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormState): Errors {
  const e: Errors = {};

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

  return e;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium">{children}</div>;
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-xs text-muted-foreground">{children}</div>;
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-xs text-red-600">{children}</div>;
}

export default function ContactForm() {
  const [values, setValues] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => validate(values), [values]);

  const hasErrors = Object.keys(errors).length > 0;

  function onBlur(field: keyof FormState) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function setField(field: keyof FormState, v: string) {
    setValues((s) => ({ ...s, [field]: v }));
  }

  function showError(field: keyof FormState) {
    return Boolean(touched[field] || submitted) && Boolean(errors[field]);
  }

  function inputClass(field: keyof FormState) {
    const base =
      "mt-2 w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none transition";
    const normal = "border-border focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";
    const bad = "border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background";
    return `${base} ${showError(field) ? bad : normal}`;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    // Design-review mode: validate + show errors, but do not send
    if (hasErrors) return;

    // In Sprint “plumbing”, replace this with a POST to /api/contact
    alert("Form looks good (submission disabled for now).");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>First Name</FieldLabel>
          <input
            value={values.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            onBlur={() => onBlur("firstName")}
            className={inputClass("firstName")}
            autoComplete="given-name"
          />
          {showError("firstName") ? <FieldError>{errors.firstName}</FieldError> : null}
        </div>

        <div>
          <FieldLabel>Last Name</FieldLabel>
          <input
            value={values.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            onBlur={() => onBlur("lastName")}
            className={inputClass("lastName")}
            autoComplete="family-name"
          />
          {showError("lastName") ? <FieldError>{errors.lastName}</FieldError> : null}
        </div>
      </div>

      <div>
        <FieldLabel>Email</FieldLabel>
        <input
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          onBlur={() => onBlur("email")}
          className={inputClass("email")}
          autoComplete="email"
          inputMode="email"
        />
        {showError("email") ? <FieldError>{errors.email}</FieldError> : null}
      </div>

      <div>
        <FieldLabel>Phone (optional)</FieldLabel>
        <input
          value={values.phone}
          onChange={(e) => setField("phone", e.target.value)}
          onBlur={() => onBlur("phone")}
          className={inputClass("phone")}
          autoComplete="tel"
          inputMode="tel"
          placeholder="(555) 555-5555"
        />
        <FieldHint>Only if you’d like a call back.</FieldHint>
        {showError("phone") ? <FieldError>{errors.phone}</FieldError> : null}
      </div>

      <div>
        <FieldLabel>Message</FieldLabel>
        <textarea
          value={values.message}
          onChange={(e) => setField("message", e.target.value)}
          onBlur={() => onBlur("message")}
          className={inputClass("message")}
          rows={6}
          placeholder="Tell us what you’d like to build, rough dimensions, timeline, and any inspiration links."
        />
        <FieldHint>Minimum 20 characters.</FieldHint>
        {showError("message") ? <FieldError>{errors.message}</FieldError> : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          className="px-5 py-3 rounded-2xl text-sm font-medium bg-accent text-accent-foreground hover:opacity-90 transition disabled:opacity-60"
        >
          Send message
        </button>

        <span className="text-xs text-muted-foreground">
          Submission disabled (design review). Validation is live.
        </span>
      </div>
    </form>
  );
}
