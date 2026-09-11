"use client";

import { useId, useMemo, useState } from "react";
import {
  validateContactForm,
  type ContactFormValues,
} from "@/lib/contactValidation";
import {
  PROJECT_TYPE_OPTIONS,
  TIMEFRAME_OPTIONS,
  MAX_DIMENSIONS_LENGTH,
  type ProjectType,
} from "@/lib/contactOptions";

type FormState = ContactFormValues;

type Props = {
  /** Gallery project slug from ?project=, if it resolved to a real item. */
  projectSlug?: string;
  /** Category of the resolved project, used to preselect Project Type. */
  initialProjectType?: ProjectType;
};

function FieldLabel({
  htmlFor,
  optional,
  children,
}: {
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
      {optional ? (
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">Optional</span>
      ) : null}
    </label>
  );
}

function FieldHint({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mt-1 text-xs text-muted-foreground">
      {children}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mt-1 text-xs text-red-600" role="alert">
      {children}
    </div>
  );
}

export default function ContactForm({ projectSlug, initialProjectType }: Props) {
  const uid = useId();
  const fieldId = (name: keyof FormState) => `${uid}-${name}`;
  const hintId = (name: keyof FormState) => `${uid}-${name}-hint`;
  const errorId = (name: keyof FormState) => `${uid}-${name}-error`;

  const emptyValues = useMemo<FormState>(
    () => ({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: "",
      projectType: initialProjectType ?? "",
      dimensions: "",
      timeframe: "",
    }),
    [initialProjectType],
  );

  const [values, setValues] = useState<FormState>(emptyValues);

  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  // NEW UI state
  const [isSending, setIsSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const errors = useMemo(() => validateContactForm(values), [values]);
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

  /** aria-describedby lists whichever of hint/error currently render. */
  function describedBy(field: keyof FormState, hasHint: boolean) {
    const ids: string[] = [];
    if (hasHint) ids.push(hintId(field));
    if (showError(field)) ids.push(errorId(field));
    return ids.length ? ids.join(" ") : undefined;
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
        // Only the slug travels to the server — title/category are re-derived
        // there from the trusted Gallery data, never trusted from the client.
        body: JSON.stringify({ ...values, projectSlug }),
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
      setValues(emptyValues);
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
        <div className="ui-card p-4 border border-red-500/40" role="alert">
          <div className="text-sm font-medium text-red-600">Couldn’t send</div>
          <div className="mt-1 text-sm text-muted-foreground">{apiError}</div>
        </div>
      ) : null}

      {successMsg ? (
        <div className="ui-card p-4 border border-border" role="status">
          <div className="text-sm font-medium">Check your email</div>
          <div className="mt-1 text-sm text-muted-foreground">{successMsg}</div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={fieldId("firstName")}>First name</FieldLabel>
          <input
            id={fieldId("firstName")}
            value={values.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            onBlur={() => onBlur("firstName")}
            className={inputClass("firstName")}
            autoComplete="given-name"
            aria-invalid={showError("firstName") || undefined}
            aria-describedby={describedBy("firstName", false)}
          />
          {showError("firstName") ? (
            <FieldError id={errorId("firstName")}>{errors.firstName}</FieldError>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor={fieldId("lastName")}>Last name</FieldLabel>
          <input
            id={fieldId("lastName")}
            value={values.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            onBlur={() => onBlur("lastName")}
            className={inputClass("lastName")}
            autoComplete="family-name"
            aria-invalid={showError("lastName") || undefined}
            aria-describedby={describedBy("lastName", false)}
          />
          {showError("lastName") ? (
            <FieldError id={errorId("lastName")}>{errors.lastName}</FieldError>
          ) : null}
        </div>
      </div>

      <div>
        <FieldLabel htmlFor={fieldId("email")}>Email</FieldLabel>
        <input
          id={fieldId("email")}
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          onBlur={() => onBlur("email")}
          className={inputClass("email")}
          autoComplete="email"
          inputMode="email"
          aria-invalid={showError("email") || undefined}
          aria-describedby={describedBy("email", false)}
        />
        {showError("email") ? <FieldError id={errorId("email")}>{errors.email}</FieldError> : null}
      </div>

      <div>
        <FieldLabel htmlFor={fieldId("phone")} optional>
          Phone
        </FieldLabel>
        <input
          id={fieldId("phone")}
          value={values.phone}
          onChange={(e) => setField("phone", e.target.value)}
          onBlur={() => onBlur("phone")}
          className={inputClass("phone")}
          autoComplete="tel"
          inputMode="tel"
          placeholder="(555) 555-5555"
          aria-invalid={showError("phone") || undefined}
          aria-describedby={describedBy("phone", false)}
        />
        {showError("phone") ? <FieldError id={errorId("phone")}>{errors.phone}</FieldError> : null}
      </div>

      <div>
        <FieldLabel htmlFor={fieldId("projectType")} optional>
          Project type
        </FieldLabel>
        <select
          id={fieldId("projectType")}
          value={values.projectType}
          onChange={(e) => setField("projectType", e.target.value)}
          onBlur={() => onBlur("projectType")}
          className={inputClass("projectType")}
        >
          <option value="">Select one…</option>
          {PROJECT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={fieldId("dimensions")} optional>
            Approximate size
          </FieldLabel>
          <input
            id={fieldId("dimensions")}
            value={values.dimensions}
            onChange={(e) => setField("dimensions", e.target.value)}
            onBlur={() => onBlur("dimensions")}
            className={inputClass("dimensions")}
            maxLength={MAX_DIMENSIONS_LENGTH}
            placeholder={`6' long × 3' wide`}
            aria-invalid={showError("dimensions") || undefined}
            aria-describedby={describedBy("dimensions", false)}
          />
          {showError("dimensions") ? (
            <FieldError id={errorId("dimensions")}>{errors.dimensions}</FieldError>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor={fieldId("timeframe")} optional>
            Timeframe
          </FieldLabel>
          <select
            id={fieldId("timeframe")}
            value={values.timeframe}
            onChange={(e) => setField("timeframe", e.target.value)}
            onBlur={() => onBlur("timeframe")}
            className={inputClass("timeframe")}
          >
            <option value="">Select one…</option>
            {TIMEFRAME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor={fieldId("message")}>Tell us about your project</FieldLabel>
        <textarea
          id={fieldId("message")}
          value={values.message}
          onChange={(e) => setField("message", e.target.value)}
          onBlur={() => onBlur("message")}
          className={inputClass("message")}
          rows={6}
          placeholder="What you’d like to build, where it’ll be used, and any inspiration links."
          aria-invalid={showError("message") || undefined}
          aria-describedby={describedBy("message", true)}
        />
        <FieldHint id={hintId("message")}>
          A few sentences is plenty — minimum 20 characters.
        </FieldHint>
        {showError("message") ? (
          <FieldError id={errorId("message")}>{errors.message}</FieldError>
        ) : null}
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
