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

  // NEW UI state
  const [isSending, setIsSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    const normal =
      "border-border focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background";
    const bad =
      "border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background";
    return `${base} ${showError(field) ? bad : normal}`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setApiError(null);
    setSuccessMsg(null);

    if (hasErrors) return;

    try {
      setIsSending(true);

            const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      type ApiSuccess = { ok: true; message?: string };
      type ApiFail = { ok: false; error?: string };
      type ApiResponse = ApiSuccess | ApiFail;

      let data: ApiResponse | null = null;
      try {
        data = (await res.json()) as ApiResponse;
      } catch {
        data = null;
      }

      if (!res.ok || !data) {
        setApiError("Something went wrong. Please try again.");
        return;
      }

      if (!data.ok) {
        setApiError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Success: tell user to check email
      setSuccessMsg(data.message ?? "Submitted. Please check your email to confirm.");


      // Optional: clear form after successful submit
      setValues({ firstName: "", lastName: "", email: "", phone: "", message: "" });
      setTouched({});
      setSubmitted(false);
    } catch (err) {
      console.error("Contact submit failed:", err);
      setApiError("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {apiError ? (
        <div className="ui-card p-4 border border-red-500/40">
          <div className="text-sm font-medium text-red-600">Couldn’t send</div>
          <div className="mt-1 text-sm text-muted-foreground">{apiError}</div>
        </div>
      ) : null}

      {successMsg ? (
        <div className="ui-card p-4 border border-border">
          <div className="text-sm font-medium">Check your email</div>
          <div className="mt-1 text-sm text-muted-foreground">{successMsg}</div>
        </div>
      ) : null}

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
          disabled={isSending}
          className="px-5 py-3 rounded-2xl text-sm font-medium bg-accent text-accent-foreground hover:opacity-90 transition disabled:opacity-60"
        >
          {isSending ? "Sending..." : "Send message"}
        </button>

        <span className="text-xs text-muted-foreground">
          {isSending
            ? "Submitting your request…"
            : successMsg
            ? "Please confirm via the email link."
            : "We’ll reply after you confirm via email."}
        </span>
      </div>
    </form>
  );
}
