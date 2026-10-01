"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";
import { withPortalTimeout } from "../../lib/portal-request";

export default function RestrictedRegistrationForm({ onClose, onRegistered }: {
  onClose: () => void;
  onRegistered: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const startedAt = useRef(0);
  const submitting = useRef(false);
  useEffect(() => { startedAt.current = Date.now(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const form = new FormData(event.currentTarget);
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const { data, error: requestError } = await withPortalTimeout(client.functions.invoke("resend-registration", {
        body: {
          action: "register",
          attendee: {
            fullName: form.get("fullName"), position: form.get("position"),
            city: form.get("city"), phoneNumber: form.get("phoneNumber"), email: form.get("email"),
            acceptedPrivacy: form.get("consent") === "on", formStartedAt: startedAt.current,
          },
        },
      }), 35_000);
      const result = requestError?.context instanceof Response
        ? await requestError.context.json().catch(() => null) : data;
      if (result?.registrationSaved) {
        onRegistered(result.emailSent
          ? "Attendee registered. The confirmation email and QR pass were sent."
          : `Attendee registered. ${result.message || "Email sending could not be confirmed. Use Send registration email from the list after two minutes."}`);
        return;
      }
      setError(result?.message || "Registration could not be confirmed. Refresh the attendee list before submitting again.");
    } catch {
      setError("Registration could not be confirmed. Close this form and refresh the attendee list before submitting again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="portal-dialog-backdrop" role="presentation">
      <section className="portal-action-dialog" role="dialog" aria-modal="true" aria-labelledby="team-registration-title">
        <button className="portal-dialog-close" type="button" onClick={onClose} disabled={busy} aria-label="Close registration form">×</button>
        <p className="form-kicker">New attendee</p>
        <h2 id="team-registration-title">Register an attendee</h2>
        <p>The attendee will receive their registration confirmation and QR pass by email.</p>
        <form onSubmit={submit}>
          <fieldset className="attendee-edit-fields" disabled={busy}>
            <legend className="sr-only">New attendee details</legend>
            <label><span>Full name</span><input name="fullName" minLength={2} maxLength={120} autoComplete="off" required /></label>
            <label><span>Position / professional title</span><input name="position" minLength={2} maxLength={120} autoComplete="off" required /></label>
            <label><span>City</span><input name="city" minLength={2} maxLength={100} autoComplete="off" required /></label>
            <label><span>Phone number</span><input name="phoneNumber" type="tel" minLength={7} maxLength={25} autoComplete="off" required /></label>
            <label><span>Email address for the confirmation</span><input name="email" type="email" maxLength={254} autoComplete="off" required /></label>
            <label className="team-registration-consent"><input name="consent" type="checkbox" required /><span>The attendee agrees to share these details with KTAF for registration and receive their confirmation email.</span></label>
          </fieldset>
          {error ? <p className="form-message form-error" role="alert">{error}</p> : null}
          <div className="portal-dialog-actions">
            <button type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="portal-confirm-action" type="submit" disabled={busy}>{busy ? "Registering and sending…" : "Register and send email"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
