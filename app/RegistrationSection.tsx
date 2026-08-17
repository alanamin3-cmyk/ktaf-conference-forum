"use client";

/* eslint-disable @next/next/no-img-element -- The official KTAF vector motif is served directly by the static export. */
import { FormEvent, useEffect, useRef, useState } from "react";
import { getKtafRuntimeConfig } from "../lib/ktaf-runtime-config";

type RegistrationResult = {
  fullName: string;
  registrationCode: string;
  email: string;
  emailSent: boolean;
};

type FormStatus =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; result: RegistrationResult }
  | { state: "error"; message: string };

function valueFromForm(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

export default function RegistrationSection() {
  const [status, setStatus] = useState<FormStatus>({ state: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const config = getKtafRuntimeConfig();
    if (!config) {
      setStatus({
        state: "error",
        message:
          "Online registration is being connected. Please try again shortly or contact registration@ktaf.krd.",
      });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fullName = valueFromForm(formData, "fullName");
    const position = valueFromForm(formData, "position");
    const city = valueFromForm(formData, "city");
    const email = valueFromForm(formData, "email").toLowerCase();

    setStatus({ state: "submitting" });

    try {
      const response = await fetch(
        `${config.supabaseUrl}/functions/v1/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: config.supabasePublishableKey,
            Authorization: `Bearer ${config.supabasePublishableKey}`,
          },
          body: JSON.stringify({
            fullName,
            position,
            city,
            email,
            website: valueFromForm(formData, "website"),
            acceptedPrivacy: formData.get("acceptedPrivacy") === "on",
            formStartedAt: startedAt.current,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { registrationCode?: string; message?: string; emailSent?: boolean }
        | null;

      if (!response.ok || !payload?.registrationCode) {
        throw new Error(
          payload?.message ||
            "We could not complete your registration. Please try again.",
        );
      }

      setStatus({
        state: "success",
        result: {
          fullName,
          email,
          registrationCode: payload.registrationCode,
          emailSent: payload.emailSent !== false,
        },
      });
      form.reset();
    } catch (error) {
      setStatus({
        state: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not complete your registration. Please try again.",
      });
    }
  }

  return (
    <section
      className="registration-section"
      id="register"
      aria-labelledby="registration-title"
    >
      <img
        className="registration-flow"
        src="/brand/ktaf-flow-pattern.svg"
        alt=""
        width="1920"
        height="1080"
        aria-hidden="true"
      />

      <div className="shell registration-grid">
        <div className="registration-intro">
          <p className="section-label">Attend KTAF</p>
          <h2 id="registration-title">Reserve your place.</h2>
          <p className="registration-lead">
            Complete the form to register your interest in attending the
            Kurdistan Thrombosis &amp; Anticoagulation Forum — KTAF.
          </p>

          <ol className="registration-steps" aria-label="Registration process">
            <li>
              <span>01</span>
              <div>
                <strong>Submit your details</strong>
                <p>Provide your professional and contact information.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Receive confirmation</strong>
                <p>A personalized confirmation will be sent to your email.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Stay informed</strong>
                <p>Confirmed event details will be shared when announced.</p>
              </div>
            </li>
          </ol>
        </div>

        <div className="registration-card">
          {status.state === "success" ? (
            <div className="registration-success" role="status">
              <span className="success-mark" aria-hidden="true">
                ✓
              </span>
              <p className="form-kicker">Registration confirmed</p>
              <h3>Thank you, {status.result.fullName}.</h3>
              <p>
                {status.result.emailSent ? (
                  <>
                    Your place has been reserved. A confirmation email has been
                    sent to <strong>{status.result.email}</strong>.
                  </>
                ) : (
                  <>
                    Your place has been reserved. Your confirmation email is
                    delayed; please contact <strong>registration@ktaf.krd</strong>
                    if it does not arrive shortly.
                  </>
                )}
              </p>
              <div className="registration-reference">
                <span>Registration reference</span>
                <strong>{status.result.registrationCode}</strong>
              </div>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  startedAt.current = Date.now();
                  setStatus({ state: "idle" });
                  requestAnimationFrame(() => formRef.current?.focus());
                }}
              >
                Register another attendee
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={submitRegistration}>
              <div className="form-heading">
                <div>
                  <p className="form-kicker">Attendee registration</p>
                  <h3>Your details</h3>
                </div>
                <span>All fields are required</span>
              </div>

              <div className="form-fields">
                <label>
                  <span>Full name</span>
                  <input
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    maxLength={120}
                    placeholder="Enter your full name"
                    required
                  />
                </label>

                <label>
                  <span>Position</span>
                  <input
                    name="position"
                    type="text"
                    autoComplete="organization-title"
                    maxLength={120}
                    placeholder="e.g. Specialist Physician"
                    required
                  />
                </label>

                <label>
                  <span>City</span>
                  <input
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    maxLength={100}
                    placeholder="Enter your city"
                    required
                  />
                </label>

                <label>
                  <span>Email address</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={254}
                    placeholder="name@example.com"
                    required
                  />
                </label>
              </div>

              <label className="honeypot-field" aria-hidden="true">
                Website
                <input
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>

              <label className="consent-field">
                <input name="acceptedPrivacy" type="checkbox" required />
                <span>
                  I consent to KTAF storing these details to manage my
                  registration and send conference-related updates.
                </span>
              </label>

              {status.state === "error" ? (
                <p className="form-message form-error" role="alert">
                  {status.message}
                </p>
              ) : null}

              <button
                className="registration-submit"
                type="submit"
                disabled={status.state === "submitting"}
              >
                <span>
                  {status.state === "submitting"
                    ? "Confirming registration…"
                    : "Confirm registration"}
                </span>
                <span aria-hidden="true">→</span>
              </button>

              <p className="form-assurance">
                Your information is used only for KTAF attendance management
                and conference communication.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
