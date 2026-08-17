"use client";

/* eslint-disable @next/next/no-img-element -- The official KTAF SVG logo is served directly by the static export. */
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

type Registration = {
  id: string;
  created_at: string;
  full_name: string;
  position: string;
  city: string;
  email: string;
  registration_code: string;
  email_status: "pending" | "sent" | "failed";
  email_sent_at: string | null;
};

type PortalState =
  | { kind: "loading" }
  | { kind: "configuration" }
  | { kind: "signed-out" }
  | { kind: "set-password"; session: Session }
  | { kind: "unauthorized"; email: string }
  | { kind: "ready"; session: Session };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function AdminPortal() {
  const [portal, setPortal] = useState<PortalState>({ kind: "loading" });
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [query, setQuery] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [dataError, setDataError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [dataBusy, setDataBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  const loadPortal = useCallback(async (session: Session | null) => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      queueMicrotask(() => setPortal({ kind: "configuration" }));
      return;
    }

    if (!session) {
      setPortal({ kind: "signed-out" });
      setRegistrations([]);
      return;
    }

    const { data: membership, error: membershipError } = await client
      .from("admin_users")
      .select("email")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      setPortal({
        kind: "unauthorized",
        email: session.user.email || "this account",
      });
      setRegistrations([]);
      return;
    }

    setPortal({ kind: "ready", session });
  }, []);

  const refreshRegistrations = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    setDataBusy(true);
    setDataError("");
    const { data, error } = await client
      .from("registrations")
      .select(
        "id,created_at,full_name,position,city,email,registration_code,email_status,email_sent_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      setDataError("The attendee list could not be loaded. Please try again.");
    } else {
      setRegistrations((data as Registration[]) || []);
    }
    setDataBusy(false);
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      queueMicrotask(() => setPortal({ kind: "configuration" }));
      return;
    }

    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      const hash = window.location.hash;
      if (
        data.session &&
        (hash.includes("type=invite") || hash.includes("type=recovery"))
      ) {
        setPortal({ kind: "set-password", session: data.session });
        return;
      }
      void loadPortal(data.session);
    });

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      const hash = window.location.hash;
      if (
        session &&
        (event === "PASSWORD_RECOVERY" ||
          hash.includes("type=invite") ||
          hash.includes("type=recovery"))
      ) {
        setPortal({ kind: "set-password", session });
        return;
      }
      void loadPortal(session);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadPortal]);

  useEffect(() => {
    if (portal.kind === "ready") {
      queueMicrotask(() => void refreshRegistrations());
    }
  }, [portal.kind, refreshRegistrations]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return registrations;

    return registrations.filter((registration) =>
      [
        registration.full_name,
        registration.position,
        registration.city,
        registration.email,
        registration.registration_code,
      ].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query, registrations]);

  const summary = useMemo(
    () => ({
      total: registrations.length,
      today: registrations.filter((registration) =>
        isToday(registration.created_at),
      ).length,
      cities: new Set(
        registrations.map((registration) => registration.city.toLowerCase()),
      ).size,
      emailSent: registrations.filter(
        (registration) => registration.email_status === "sent",
      ).length,
    }),
    [registrations],
  );

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client) return;

    const formData = new FormData(event.currentTarget);
    setLoginBusy(true);
    setLoginError("");
    setLoginMessage("");

    const { error } = await client.auth.signInWithPassword({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    });

    if (error) {
      setLoginError("The email address or password is incorrect.");
    }
    setLoginBusy(false);
  }

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    setLoginBusy(true);
    setLoginError("");
    setLoginMessage("");

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: "https://ktaf.krd/admin.html",
    });

    if (error) {
      setLoginError("The password email could not be sent. Please try again.");
    } else {
      setLoginMessage(
        "A secure password link has been sent. Please check the inbox and spam folder.",
      );
    }
    setLoginBusy(false);
  }

  async function setPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client || portal.kind !== "set-password") return;

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("passwordConfirmation") ?? "");
    setLoginError("");
    setLoginMessage("");

    if (password.length < 10) {
      setLoginError("Use a password with at least 10 characters.");
      return;
    }
    if (password !== confirmation) {
      setLoginError("The two passwords do not match.");
      return;
    }

    setLoginBusy(true);
    const { error } = await client.auth.updateUser({ password });
    if (error) {
      setLoginError("The password could not be saved. Please request a new link.");
      setLoginBusy(false);
      return;
    }

    window.history.replaceState(null, "", window.location.pathname);
    setLoginMessage("Your password has been saved securely.");
    await loadPortal(portal.session);
    setLoginBusy(false);
  }

  async function signOut() {
    const client = getSupabaseBrowserClient();
    if (client) await client.auth.signOut();
  }

  async function exportToExcel() {
    if (!filtered.length) return;

    setExportBusy(true);
    try {
      const { default: writeXlsxFile } = await import(
        "write-excel-file/browser"
      );
      const headerStyle = {
        backgroundColor: "#0D2B45",
        color: "#FFFFFF",
        fontWeight: "bold" as const,
        align: "center" as const,
        height: 32,
      };
      const header = [
        "Registration reference",
        "Full name",
        "Position",
        "City",
        "Email address",
        "Registered at",
        "Confirmation email",
      ].map((value) => ({ value, ...headerStyle }));
      const rows = filtered.map((registration) => [
        { value: registration.registration_code },
        { value: registration.full_name },
        { value: registration.position },
        { value: registration.city },
        { value: registration.email },
        { value: new Date(registration.created_at), type: Date },
        {
          value:
            registration.email_status === "sent"
              ? "Sent"
              : registration.email_status === "failed"
                ? "Needs attention"
                : "Pending",
        },
      ]);
      const date = new Date().toISOString().slice(0, 10);

      await writeXlsxFile([header, ...rows], {
        fileName: `KTAF_Attendees_${date}.xlsx`,
        columns: [
          { width: 22 },
          { width: 28 },
          { width: 28 },
          { width: 18 },
          { width: 32 },
          { width: 24 },
          { width: 22 },
        ],
        dateFormat: "dd mmm yyyy hh:mm",
        stickyRowsCount: 1,
      });
    } finally {
      setExportBusy(false);
    }
  }

  return (
    <div className="portal-page">
      <header className="portal-header">
        <Link href="/" aria-label="Return to KTAF website">
          <img
            src="/brand/ktaf-horizontal.svg"
            alt="Kurdistan Thrombosis and Anticoagulation Forum — KTAF"
            width="1600"
            height="520"
          />
        </Link>
        <div>
          <span>Protected team area</span>
          <Link href="/">Return to website</Link>
        </div>
      </header>

      {portal.kind === "loading" ? (
        <main className="portal-centered">
          <div className="portal-loader" aria-label="Loading portal" />
        </main>
      ) : null}

      {portal.kind === "configuration" ? (
        <main className="portal-centered">
          <section className="portal-notice">
            <p className="section-label">Configuration required</p>
            <h1>The secure portal is being connected.</h1>
            <p>
              The registration database has not yet been linked to this
              website. Please contact the KTAF website administrator.
            </p>
            <Link className="button button-primary" href="/">
              Return to KTAF
            </Link>
          </section>
        </main>
      ) : null}

      {portal.kind === "set-password" ? (
        <main className="portal-login-layout">
          <section className="portal-login-intro">
            <p className="section-label section-label-light">Secure account setup</p>
            <h1>Create your KTAF portal password.</h1>
            <p>
              Set a private password for {portal.session.user.email || "your account"}.
              It will be used whenever you return to the attendee dashboard.
            </p>
          </section>

          <section className="portal-login-card" aria-labelledby="password-title">
            <p className="form-kicker">Protected team access</p>
            <h2 id="password-title">Set your password</h2>
            <form onSubmit={setPassword}>
              <label>
                <span>New password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 10 characters"
                  minLength={10}
                  required
                />
              </label>
              <label>
                <span>Confirm password</span>
                <input
                  name="passwordConfirmation"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter the same password again"
                  minLength={10}
                  required
                />
              </label>
              {loginError ? (
                <p className="form-message form-error" role="alert">
                  {loginError}
                </p>
              ) : null}
              <button
                className="registration-submit"
                type="submit"
                disabled={loginBusy}
              >
                <span>{loginBusy ? "Saving password…" : "Save password"}</span>
                <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>
        </main>
      ) : null}

      {portal.kind === "signed-out" ? (
        <main className="portal-login-layout">
          <section className="portal-login-intro">
            <p className="section-label section-label-light">KTAF team portal</p>
            <h1>Attendee registration management.</h1>
            <p>
              Securely review registrations, monitor confirmation delivery,
              search attendees, and export the current list to Excel.
            </p>
          </section>

          <section className="portal-login-card" aria-labelledby="login-title">
            <p className="form-kicker">Authorized access only</p>
            <h2 id="login-title">
              {showPasswordReset ? "Reset your password" : "Sign in to continue"}
            </h2>
            <form onSubmit={showPasswordReset ? requestPasswordReset : signIn}>
              <label>
                <span>Email address</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="name@company.com"
                  required
                />
              </label>
              {!showPasswordReset ? (
                <label>
                  <span>Password</span>
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    minLength={8}
                    required
                  />
                </label>
              ) : null}
              {loginError ? (
                <p className="form-message form-error" role="alert">
                  {loginError}
                </p>
              ) : null}
              {loginMessage ? (
                <p className="form-message form-success" role="status">
                  {loginMessage}
                </p>
              ) : null}
              <button
                className="registration-submit"
                type="submit"
                disabled={loginBusy}
              >
                <span>
                  {loginBusy
                    ? showPasswordReset
                      ? "Sending secure link…"
                      : "Signing in…"
                    : showPasswordReset
                      ? "Send password link"
                      : "Sign in securely"}
                </span>
                <span aria-hidden="true">→</span>
              </button>
            </form>
            <button
              className="portal-secondary-action"
              type="button"
              onClick={() => {
                setShowPasswordReset((current) => !current);
                setLoginError("");
                setLoginMessage("");
              }}
            >
              {showPasswordReset ? "Return to sign in" : "Forgot your password?"}
            </button>
            <p className="portal-login-help">
              Access is limited to approved KTAF team accounts.
            </p>
          </section>
        </main>
      ) : null}

      {portal.kind === "unauthorized" ? (
        <main className="portal-centered">
          <section className="portal-notice">
            <p className="section-label">Access not approved</p>
            <h1>This account is not a KTAF portal administrator.</h1>
            <p>
              <strong>{portal.email}</strong> is signed in, but it has not been
              added to the approved team list.
            </p>
            <button className="button button-primary" type="button" onClick={signOut}>
              Sign out
            </button>
          </section>
        </main>
      ) : null}

      {portal.kind === "ready" ? (
        <main className="portal-dashboard">
          <div className="portal-title-row">
            <div>
              <p className="section-label">Registration dashboard</p>
              <h1>Attendee overview</h1>
              <p>
                Signed in as {portal.session.user.email || "KTAF team member"}
              </p>
            </div>
            <div className="portal-title-actions">
              <button type="button" onClick={refreshRegistrations} disabled={dataBusy}>
                {dataBusy ? "Refreshing…" : "Refresh"}
              </button>
              <button type="button" onClick={signOut}>
                Sign out
              </button>
            </div>
          </div>

          <section className="portal-stats" aria-label="Registration summary">
            <article>
              <span>Total registrations</span>
              <strong>{summary.total}</strong>
            </article>
            <article>
              <span>Registered today</span>
              <strong>{summary.today}</strong>
            </article>
            <article>
              <span>Cities represented</span>
              <strong>{summary.cities}</strong>
            </article>
            <article>
              <span>Emails confirmed</span>
              <strong>{summary.emailSent}</strong>
            </article>
          </section>

          <section className="attendee-panel" aria-labelledby="attendee-table-title">
            <div className="attendee-toolbar">
              <div>
                <p className="form-kicker">Live registration list</p>
                <h2 id="attendee-table-title">Attendees</h2>
                <p>
                  Showing {filtered.length} of {registrations.length}
                </p>
              </div>
              <div className="attendee-actions">
                <label className="attendee-search">
                  <span className="sr-only">Search attendees</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search name, city, email…"
                  />
                </label>
                <button
                  className="excel-button"
                  type="button"
                  onClick={exportToExcel}
                  disabled={!filtered.length || exportBusy}
                >
                  {exportBusy ? "Preparing Excel…" : "Download Excel"}
                </button>
              </div>
            </div>

            {dataError ? (
              <p className="form-message form-error" role="alert">
                {dataError}
              </p>
            ) : null}

            <div className="attendee-table-wrap">
              <table className="attendee-table">
                <thead>
                  <tr>
                    <th>Attendee</th>
                    <th>Position</th>
                    <th>City</th>
                    <th>Registration</th>
                    <th>Email status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((registration) => (
                    <tr key={registration.id}>
                      <td>
                        <strong>{registration.full_name}</strong>
                        <a href={`mailto:${registration.email}`}>
                          {registration.email}
                        </a>
                      </td>
                      <td>{registration.position}</td>
                      <td>{registration.city}</td>
                      <td>
                        <strong>{registration.registration_code}</strong>
                        <span>{formatDate(registration.created_at)}</span>
                      </td>
                      <td>
                        <span
                          className={`email-state email-state-${registration.email_status}`}
                        >
                          {registration.email_status === "sent"
                            ? "Sent"
                            : registration.email_status === "failed"
                              ? "Needs attention"
                              : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!dataBusy && !filtered.length ? (
                    <tr>
                      <td className="attendee-empty" colSpan={5}>
                        {registrations.length
                          ? "No attendees match your search."
                          : "No registrations have been received yet."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      ) : null}
    </div>
  );
}
