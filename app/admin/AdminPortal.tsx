"use client";

/* eslint-disable @next/next/no-img-element -- The official KTAF SVG logo is served directly by the static export. */
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

type Registration = {
  id: string;
  created_at: string;
  full_name: string;
  position: string;
  city: string;
  phone_number: string | null;
  email: string;
  registration_code: string;
  email_status: "pending" | "sent" | "failed";
  email_sent_at: string | null;
  registration_status: "registered" | "cancelled";
  status_updated_at: string;
  cancellation_note: string | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  badge_printed_at: string | null;
  badge_print_count: number;
};

type RegistrationAction = {
  kind: "cancel" | "restore" | "delete";
  registration: Registration;
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

function registrationCodeFromScan(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const queryCode = url.searchParams.get("checkin");
    if (queryCode) return queryCode.trim().toUpperCase();
  } catch {
    // USB QR scanners may provide the reference directly instead of a URL.
  }

  const match = trimmed.toUpperCase().match(/KTAF-\d{4}-\d{6}/);
  return match?.[0] || "";
}

function BadgeArtwork({
  registration,
  className = "",
}: {
  registration: Registration;
  className?: string;
}) {
  const nameLength = registration.full_name.length;
  const nameClass =
    nameLength > 34
      ? "badge-name badge-name-long"
      : nameLength > 25
        ? "badge-name badge-name-medium"
        : "badge-name";

  return (
    <article className={`ktaf-name-badge ${className}`.trim()}>
      <div className="badge-brand">
        <img
          src="/brand/ktaf-horizontal.svg"
          alt="Kurdistan Thrombosis and Anticoagulation Forum — KTAF"
          width="1600"
          height="520"
        />
        <span>October 1, 2026 · Slemani Rotana</span>
      </div>
      <div className="badge-person">
        <p className={nameClass}>{registration.full_name}</p>
        <p className="badge-position">{registration.position}</p>
        <p className="badge-city">{registration.city}</p>
      </div>
      <div className="badge-reference">
        <span>{registration.registration_code}</span>
        <span>Checked in</span>
      </div>
      <div className="badge-delegate-band">
        <strong>Delegate</strong>
        <span>Advancing Science. Improving Outcomes.</span>
      </div>
    </article>
  );
}

export default function AdminPortal() {
  const [portal, setPortal] = useState<PortalState>({ kind: "loading" });
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "registered" | "cancelled"
  >("all");
  const [loginError, setLoginError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [dataError, setDataError] = useState("");
  const [dataMessage, setDataMessage] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [dataBusy, setDataBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [registrationAction, setRegistrationAction] =
    useState<RegistrationAction | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [scanBusy, setScanBusy] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [scanError, setScanError] = useState("");
  const [badgeRegistration, setBadgeRegistration] =
    useState<Registration | null>(null);
  const handledUrlCodeRef = useRef("");
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const dialogCloseButtonRef = useRef<HTMLButtonElement>(null);

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
        "id,created_at,full_name,position,city,phone_number,email,registration_code,email_status,email_sent_at,registration_status,status_updated_at,cancellation_note,checked_in_at,checked_in_by,badge_printed_at,badge_print_count",
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

  useEffect(() => {
    if (!registrationAction) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogCloseButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !actionBusy) {
        setActionError("");
        setRegistrationAction(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [actionBusy, registrationAction]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return registrations.filter((registration) => {
      if (
        statusFilter !== "all" &&
        registration.registration_status !== statusFilter
      ) {
        return false;
      }
      if (!normalized) return true;

      return [
        registration.full_name,
        registration.position,
        registration.city,
        registration.phone_number || "",
        registration.email,
        registration.registration_code,
        registration.registration_status === "registered"
          ? "registered"
          : "cancelled by attendee",
        registration.cancellation_note || "",
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [query, registrations, statusFilter]);

  const summary = useMemo(
    () => ({
      registered: registrations.filter(
        (registration) => registration.registration_status === "registered",
      ).length,
      cancelled: registrations.filter(
        (registration) => registration.registration_status === "cancelled",
      ).length,
      today: registrations.filter((registration) =>
        isToday(registration.created_at),
      ).length,
      checkedIn: registrations.filter(
        (registration) => registration.checked_in_at,
      ).length,
      cities: new Set(
        registrations
          .filter(
            (registration) =>
              registration.registration_status === "registered",
          )
          .map((registration) => registration.city.toLowerCase()),
      ).size,
    }),
    [registrations],
  );

  const processCheckIn = useCallback(
    async (rawValue: string) => {
      const client = getSupabaseBrowserClient();
      if (!client || portal.kind !== "ready" || scanBusy) return;

      const code = registrationCodeFromScan(rawValue);
      setScanError("");
      setScanMessage("");

      if (!code) {
        setScanError(
          "The scanner did not provide a valid KTAF registration reference.",
        );
        scannerInputRef.current?.focus();
        return;
      }

      const registration = registrations.find(
        (item) => item.registration_code.toUpperCase() === code,
      );
      if (!registration) {
        setScanError(
          `No attendee was found for ${code}. Refresh the list and try again.`,
        );
        setScanValue("");
        scannerInputRef.current?.focus();
        return;
      }

      if (registration.registration_status === "cancelled") {
        setScanError(
          `${registration.full_name} is marked “Cancelled by attendee”. The badge was not printed.`,
        );
        setScanValue("");
        setBadgeRegistration(registration);
        scannerInputRef.current?.focus();
        return;
      }

      setScanBusy(true);
      const printedAt = new Date().toISOString();
      const update: Record<string, string | number> = {
        badge_printed_at: printedAt,
        badge_print_count: (registration.badge_print_count || 0) + 1,
      };
      if (!registration.checked_in_at) {
        update.checked_in_at = printedAt;
        update.checked_in_by = portal.session.user.id;
      }

      const { data, error } = await client
        .from("registrations")
        .update(update)
        .eq("id", registration.id)
        .select(
          "id,created_at,full_name,position,city,phone_number,email,registration_code,email_status,email_sent_at,registration_status,status_updated_at,cancellation_note,checked_in_at,checked_in_by,badge_printed_at,badge_print_count",
        )
        .single();

      if (error || !data) {
        setScanError(
          "Check-in could not be saved, so printing was stopped. Please try again.",
        );
        setScanBusy(false);
        scannerInputRef.current?.focus();
        return;
      }

      const updated = data as Registration;
      setRegistrations((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setBadgeRegistration(updated);
      setScanValue("");
      setScanMessage(
        `${updated.full_name} checked in. Badge print ${updated.badge_print_count} is starting.`,
      );
      setScanBusy(false);

      requestAnimationFrame(() => {
        window.setTimeout(() => window.print(), 180);
      });
    },
    [portal, registrations, scanBusy],
  );

  useEffect(() => {
    if (portal.kind !== "ready" || dataBusy || !registrations.length) return;
    const urlCode = new URLSearchParams(window.location.search).get("checkin");
    if (!urlCode || handledUrlCodeRef.current === urlCode) return;

    handledUrlCodeRef.current = urlCode;
    void processCheckIn(urlCode);
    const url = new URL(window.location.href);
    url.searchParams.delete("checkin");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [dataBusy, portal.kind, processCheckIn, registrations.length]);

  useEffect(() => {
    const refocusScanner = () => scannerInputRef.current?.focus();
    window.addEventListener("afterprint", refocusScanner);
    return () => window.removeEventListener("afterprint", refocusScanner);
  }, []);

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

  function openRegistrationAction(
    kind: RegistrationAction["kind"],
    registration: Registration,
  ) {
    setActionError("");
    setRegistrationAction({ kind, registration });
  }

  function closeRegistrationAction() {
    if (actionBusy) return;
    setActionError("");
    setRegistrationAction(null);
  }

  async function completeRegistrationAction(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client || !registrationAction) return;

    const { kind, registration } = registrationAction;
    const formData = new FormData(event.currentTarget);
    setActionBusy(true);
    setActionError("");
    setDataError("");
    setDataMessage("");

    if (kind === "delete") {
      const confirmationCode = String(
        formData.get("confirmationCode") ?? "",
      ).trim();
      if (confirmationCode !== registration.registration_code) {
        setActionError("The registration reference does not match.");
        setActionBusy(false);
        return;
      }

      const { error } = await client
        .from("registrations")
        .delete()
        .eq("id", registration.id);

      if (error) {
        setActionError(
          "This registration could not be deleted. Please try again.",
        );
        setActionBusy(false);
        return;
      }

      await refreshRegistrations();
      setRegistrationAction(null);
      setDataMessage(
        `${registration.full_name}'s test or mistaken record was deleted.`,
      );
      setActionBusy(false);
      return;
    }

    const cancellationNote = String(
      formData.get("cancellationNote") ?? "",
    ).trim();
    const update =
      kind === "cancel"
        ? {
            registration_status: "cancelled" as const,
            cancellation_note:
              cancellationNote ||
              "Attendee notified KTAF that they can no longer attend.",
            status_updated_at: new Date().toISOString(),
          }
        : {
            registration_status: "registered" as const,
            cancellation_note: null,
            status_updated_at: new Date().toISOString(),
          };

    const { error } = await client
      .from("registrations")
      .update(update)
      .eq("id", registration.id);

    if (error) {
      setActionError(
        "The attendance status could not be updated. Please try again.",
      );
      setActionBusy(false);
      return;
    }

    await refreshRegistrations();
    setRegistrationAction(null);
    setDataMessage(
      kind === "cancel"
        ? `${registration.full_name} was marked “Cancelled by attendee”.`
        : `${registration.full_name}'s registration was restored.`,
    );
    setActionBusy(false);
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
        "Phone number",
        "Email address",
        "Registered at",
        "Attendance status",
        "Check-in status",
        "Checked in at",
        "Badge print count",
        "Status updated",
        "Cancellation note",
        "Confirmation email",
      ].map((value) => ({ value, ...headerStyle }));
      const rows = filtered.map((registration) => [
        { value: registration.registration_code },
        { value: registration.full_name },
        { value: registration.position },
        { value: registration.city },
        { value: registration.phone_number || "" },
        { value: registration.email },
        { value: new Date(registration.created_at), type: Date },
        {
          value:
            registration.registration_status === "registered"
              ? "Registered"
              : "Cancelled by attendee",
        },
        { value: registration.checked_in_at ? "Checked in" : "Not checked in" },
        {
          value: registration.checked_in_at
            ? new Date(registration.checked_in_at)
            : "",
          ...(registration.checked_in_at ? { type: Date } : {}),
        },
        { value: registration.badge_print_count || 0, type: Number },
        { value: new Date(registration.status_updated_at), type: Date },
        { value: registration.cancellation_note || "" },
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
          { width: 22 },
          { width: 32 },
          { width: 24 },
          { width: 24 },
          { width: 20 },
          { width: 24 },
          { width: 18 },
          { width: 24 },
          { width: 42 },
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
              <span>Registered attendees</span>
              <strong>{summary.registered}</strong>
            </article>
            <article>
              <span>Checked in</span>
              <strong>{summary.checkedIn}</strong>
            </article>
            <article>
              <span>Cancelled by attendee</span>
              <strong>{summary.cancelled}</strong>
            </article>
            <article>
              <span>Registrations today</span>
              <strong>{summary.today}</strong>
            </article>
            <article>
              <span>Cities represented</span>
              <strong>{summary.cities}</strong>
            </article>
          </section>

          <section className="checkin-panel" aria-labelledby="checkin-title">
            <div className="checkin-workspace">
              <p className="form-kicker">Conference entrance</p>
              <h2 id="checkin-title">QR check-in &amp; badge printing</h2>
              <p>
                Keep the scanner field focused. Scan the attendee’s email QR
                code, or enter the registration reference manually. A valid
                active registration is checked in before its badge print starts.
              </p>

              <form
                className="scanner-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void processCheckIn(scanValue);
                }}
              >
                <label htmlFor="registration-scanner">
                  Scanner input
                </label>
                <div>
                  <input
                    ref={scannerInputRef}
                    id="registration-scanner"
                    type="text"
                    value={scanValue}
                    onChange={(event) => setScanValue(event.target.value)}
                    placeholder="Scan QR or enter KTAF-2026-000000"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    disabled={scanBusy}
                  />
                  <button type="submit" disabled={scanBusy || !scanValue.trim()}>
                    {scanBusy ? "Checking…" : "Check in & print"}
                  </button>
                </div>
              </form>

              {scanError ? (
                <p className="form-message form-error checkin-message" role="alert">
                  {scanError}
                </p>
              ) : null}
              {scanMessage ? (
                <p className="form-message form-success checkin-message" role="status">
                  {scanMessage}
                </p>
              ) : null}

              <p className="checkin-kiosk-note">
                The portal opens the browser print command automatically. For
                completely silent printing, the event laptop must be launched
                once in Chrome kiosk-printing mode with the badge printer set as
                its default printer.
              </p>
            </div>

            <div className="badge-preview-panel">
              <span>90 × 120 mm badge preview</span>
              {badgeRegistration ? (
                <BadgeArtwork
                  registration={badgeRegistration}
                  className="badge-screen-preview"
                />
              ) : (
                <div className="badge-preview-empty">
                  <strong>Ready for first scan</strong>
                  <p>The attendee badge preview appears here before printing.</p>
                </div>
              )}
            </div>
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
                <label className="attendee-filter">
                  <span className="sr-only">Filter by attendance status</span>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as
                          | "all"
                          | "registered"
                          | "cancelled",
                      )
                    }
                    aria-label="Filter by attendance status"
                  >
                    <option value="all">All statuses</option>
                    <option value="registered">Registered</option>
                    <option value="cancelled">Cancelled by attendee</option>
                  </select>
                </label>
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

            {dataMessage ? (
              <p className="form-message form-success attendee-message" role="status">
                {dataMessage}
              </p>
            ) : null}

            <div className="attendee-table-wrap">
              <table className="attendee-table">
                <thead>
                  <tr>
                    <th>Attendee</th>
                    <th>Position</th>
                    <th>City</th>
                    <th>Check-in</th>
                    <th>Registration</th>
                    <th>Attendance status</th>
                    <th>Email status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((registration) => (
                    <tr
                      key={registration.id}
                      className={
                        registration.registration_status === "cancelled"
                          ? "attendee-row-cancelled"
                          : undefined
                      }
                    >
                      <td>
                        <strong>{registration.full_name}</strong>
                        <a href={`mailto:${registration.email}`}>
                          {registration.email}
                        </a>
                        {registration.phone_number ? (
                          <a href={`tel:${registration.phone_number}`}>
                            {registration.phone_number}
                          </a>
                        ) : (
                          <span className="attendee-contact-missing">
                            Phone not recorded
                          </span>
                        )}
                      </td>
                      <td>{registration.position}</td>
                      <td>{registration.city}</td>
                      <td>
                        <span
                          className={`checkin-state ${
                            registration.checked_in_at
                              ? "checkin-state-complete"
                              : "checkin-state-waiting"
                          }`}
                        >
                          {registration.checked_in_at
                            ? "Checked in"
                            : "Not checked in"}
                        </span>
                        {registration.checked_in_at ? (
                          <span className="checkin-time">
                            {formatDate(registration.checked_in_at)}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <strong>{registration.registration_code}</strong>
                        <span>{formatDate(registration.created_at)}</span>
                      </td>
                      <td>
                        <span
                          className={`attendance-state attendance-state-${registration.registration_status}`}
                        >
                          {registration.registration_status === "registered"
                            ? "Registered"
                            : "Cancelled by attendee"}
                        </span>
                        {registration.cancellation_note ? (
                          <span className="attendance-note">
                            {registration.cancellation_note}
                          </span>
                        ) : null}
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
                      <td>
                        <div className="attendee-row-actions">
                          <button
                            className="attendee-print-button"
                            type="button"
                            onClick={() =>
                              void processCheckIn(registration.registration_code)
                            }
                            disabled={
                              scanBusy ||
                              registration.registration_status === "cancelled"
                            }
                          >
                            {registration.checked_in_at
                              ? "Reprint badge"
                              : "Check in + print"}
                          </button>
                          {registration.registration_status === "registered" ? (
                            <button
                              type="button"
                              onClick={() =>
                                openRegistrationAction("cancel", registration)
                              }
                            >
                              Mark cancelled
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                openRegistrationAction("restore", registration)
                              }
                            >
                              Restore
                            </button>
                          )}
                          <button
                            className="attendee-delete-button"
                            type="button"
                            onClick={() =>
                              openRegistrationAction("delete", registration)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!dataBusy && !filtered.length ? (
                    <tr>
                      <td className="attendee-empty" colSpan={8}>
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

      {registrationAction ? (
        <div
          className="portal-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRegistrationAction();
          }}
        >
          <section
            className="portal-action-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registration-action-title"
            aria-describedby="registration-action-attendee"
          >
            <button
              className="portal-dialog-close"
              ref={dialogCloseButtonRef}
              type="button"
              onClick={closeRegistrationAction}
              aria-label="Close dialog"
              disabled={actionBusy}
            >
              ×
            </button>
            <p className="form-kicker">Registration management</p>
            <h2 id="registration-action-title">
              {registrationAction.kind === "cancel"
                ? "Record attendee cancellation"
                : registrationAction.kind === "restore"
                  ? "Restore registration"
                  : "Delete registration permanently"}
            </h2>
            <p
              className="portal-action-attendee"
              id="registration-action-attendee"
            >
              <strong>{registrationAction.registration.full_name}</strong>
              <span>{registrationAction.registration.registration_code}</span>
            </p>

            <form onSubmit={completeRegistrationAction}>
              {registrationAction.kind === "cancel" ? (
                <label>
                  <span>Internal cancellation note (optional)</span>
                  <textarea
                    name="cancellationNote"
                    maxLength={500}
                    rows={4}
                    placeholder="e.g. Attendee informed KTAF that they are unable to attend."
                  />
                </label>
              ) : null}

              {registrationAction.kind === "restore" ? (
                <p className="portal-action-explanation">
                  This attendee will return to the registered list, and the
                  cancellation note will be cleared.
                </p>
              ) : null}

              {registrationAction.kind === "delete" ? (
                <>
                  <p className="portal-action-warning">
                    Use permanent deletion only for tests, duplicates, or
                    mistaken records. A genuine attendee cancellation should
                    be recorded with the status above.
                  </p>
                  <label>
                    <span>
                      Type {registrationAction.registration.registration_code}
                      {" "}to confirm
                    </span>
                    <input
                      name="confirmationCode"
                      type="text"
                      autoComplete="off"
                      required
                    />
                  </label>
                </>
              ) : null}

              {actionError ? (
                <p className="form-message form-error" role="alert">
                  {actionError}
                </p>
              ) : null}

              <div className="portal-dialog-actions">
                <button
                  type="button"
                  onClick={closeRegistrationAction}
                  disabled={actionBusy}
                >
                  Keep unchanged
                </button>
                <button
                  className={
                    registrationAction.kind === "delete"
                      ? "portal-confirm-delete"
                      : "portal-confirm-action"
                  }
                  type="submit"
                  disabled={actionBusy}
                >
                  {actionBusy
                    ? "Saving…"
                    : registrationAction.kind === "cancel"
                      ? "Mark as cancelled"
                      : registrationAction.kind === "restore"
                        ? "Restore registration"
                        : "Delete permanently"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {badgeRegistration ? (
        <div className="badge-print-sheet" aria-hidden="true">
          <BadgeArtwork registration={badgeRegistration} />
        </div>
      ) : null}
    </div>
  );
}
