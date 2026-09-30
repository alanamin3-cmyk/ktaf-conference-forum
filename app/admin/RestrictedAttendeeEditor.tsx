"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { attendeeDirectoryEditError, validateAttendeeDirectoryEdit } from "../../lib/attendee-directory-edit";
import { formatAttendeeName } from "../../lib/attendee-presentation";
import { withPortalTimeout } from "../../lib/portal-request";
import { registrationCodeFromRestrictedScan, restrictedCheckInError } from "../../lib/restricted-checkin";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

type DirectoryAttendee = {
  id: string;
  full_name: string;
  position: string;
  checked_in_at: string | null;
};

type CheckInResult = DirectoryAttendee & {
  already_checked_in: boolean;
};

type AttendanceFilter = "all" | "checked-in" | "waiting";

function formatCheckInTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function stopRestrictedTransfer(event: {
  preventDefault: () => void;
  stopPropagation: () => void;
}) {
  event.preventDefault();
  event.stopPropagation();
}
export default function RestrictedAttendeeEditor({
  username,
  onSignOut,
}: {
  username: string;
  onSignOut: () => Promise<void>;
}) {
  const [attendees, setAttendees] = useState<DirectoryAttendee[]>([]);
  const [query, setQuery] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>("all");
  const [editing, setEditing] = useState<DirectoryAttendee | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [scanBusy, setScanBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const handledUrlCodeRef = useRef("");

  const refresh = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    setBusy(true);
    setError("");
    try {
      const { data, error: requestError } = await withPortalTimeout(
        client.rpc("get_ktaf_attendee_checkin_directory"),
      );
      if (requestError) throw requestError;
      setAttendees((data as DirectoryAttendee[] | null) || []);
    } catch {
      setError("The restricted attendee list could not be loaded. Please try Refresh again.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), 20_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const summary = useMemo(() => {
    const checkedIn = attendees.filter((attendee) => attendee.checked_in_at).length;
    return {
      total: attendees.length,
      checkedIn,
      waiting: attendees.length - checkedIn,
    };
  }, [attendees]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return attendees.filter((attendee) => {
      if (attendanceFilter === "checked-in" && !attendee.checked_in_at) return false;
      if (attendanceFilter === "waiting" && attendee.checked_in_at) return false;
      if (!normalized) return true;
      return [attendee.full_name, formatAttendeeName(attendee.full_name), attendee.position]
        .some((value) => value.toLowerCase().includes(normalized));
    });
  }, [attendanceFilter, attendees, query]);

  const processCheckIn = useCallback(async (rawValue: string) => {
    if (scanBusy) return;

    const code = registrationCodeFromRestrictedScan(rawValue);
    setError("");
    setMessage("");

    if (!code) {
      setError("The scanner did not provide a valid KTAF registration reference.");
      scannerInputRef.current?.focus();
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) return;
    setScanBusy(true);

    try {
      const { data, error: requestError } = await withPortalTimeout(
        client.rpc("check_in_ktaf_attendee", { p_registration_code: code }),
      );
      if (requestError) throw requestError;

      const result = (Array.isArray(data) ? data[0] : data) as CheckInResult | null;
      if (!result) throw { code: "P0002" };

      const updated: DirectoryAttendee = {
        id: result.id,
        full_name: result.full_name,
        position: result.position,
        checked_in_at: result.checked_in_at,
      };
      setAttendees((current) => {
        const present = current.some((attendee) => attendee.id === updated.id);
        if (!present) return [updated, ...current];
        return current.map((attendee) => attendee.id === updated.id ? updated : attendee);
      });
      setScanValue("");
      setMessage(
        result.already_checked_in
          ? `${formatAttendeeName(result.full_name)} is already checked in.`
          : `${formatAttendeeName(result.full_name)} checked in successfully.`,
      );
    } catch (requestError) {
      setError(restrictedCheckInError(requestError as { code?: string; message?: string }));
    } finally {
      setScanBusy(false);
      window.requestAnimationFrame(() => scannerInputRef.current?.focus());
    }
  }, [scanBusy]);

  useEffect(() => {
    const urlCode = new URLSearchParams(window.location.search).get("checkin");
    if (!urlCode || handledUrlCodeRef.current === urlCode) return;

    handledUrlCodeRef.current = urlCode;
    void processCheckIn(urlCode);
    const url = new URL(window.location.href);
    url.searchParams.delete("checkin");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [processCheckIn]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving) return;

    const validation = validateAttendeeDirectoryEdit(
      Object.fromEntries(new FormData(event.currentTarget).entries()),
    );
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    if (
      validation.value.full_name === editing.full_name &&
      validation.value.position === editing.position
    ) {
      setEditing(null);
      setMessage("No changes were needed.");
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) return;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { data, error: requestError } = await withPortalTimeout(
        client.rpc("update_ktaf_attendee_directory_entry", {
          p_id: editing.id,
          p_full_name: validation.value.full_name,
          p_position: validation.value.position,
          p_expected_full_name: editing.full_name,
          p_expected_position: editing.position,
        }),
      );
      if (requestError) throw requestError;
      const updated = (Array.isArray(data) ? data[0] : data) as DirectoryAttendee | null;
      if (!updated) throw { code: "P0002" };

      setAttendees((current) =>
        current.map((attendee) => attendee.id === updated.id
          ? { ...attendee, ...updated }
          : attendee),
      );
      setEditing(null);
      setMessage(`${formatAttendeeName(updated.full_name)} was updated.`);
    } catch (requestError) {
      setError(attendeeDirectoryEditError(requestError as { code?: string; message?: string }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className="portal-dashboard restricted-directory"
      onCopy={stopRestrictedTransfer}
      onCut={stopRestrictedTransfer}
      onPaste={stopRestrictedTransfer}
      onContextMenu={stopRestrictedTransfer}
      onDragStart={stopRestrictedTransfer}
      onKeyDownCapture={(event) => {
        if ((event.ctrlKey || event.metaKey) && ["c", "x", "v", "p", "s"].includes(event.key.toLowerCase())) {
          stopRestrictedTransfer(event);
        }
      }}
    >
      <div className="portal-title-row">
        <div>
          <p className="section-label">Restricted attendee editor</p>
          <h1>Attendance check-in</h1>
          <p>Signed in as {username}</p>
        </div>
        <div className="portal-title-actions">
          <button type="button" onClick={refresh} disabled={busy || saving}>
            {busy ? "Refreshing…" : "Refresh"}
          </button>
          <button type="button" onClick={() => void onSignOut()}>Sign out</button>
        </div>
      </div>

      <section className="restricted-directory-notice" aria-label="Account restrictions">
        <strong>Restricted account</strong>
        <p>
          This account receives only attendee names, positions and check-in times.
          QR references are processed one at a time and are not included in the attendee list.
          Email addresses, phone numbers, city, backups and Excel export remain unavailable.
        </p>
      </section>

      <section className="restricted-checkin-stats" aria-label="Attendance totals">
        <article>
          <span>Registered attendees</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="restricted-stat-complete">
          <span>Checked in</span>
          <strong>{summary.checkedIn}</strong>
        </article>
        <article>
          <span>Waiting</span>
          <strong>{summary.waiting}</strong>
        </article>
      </section>

      <section className="restricted-checkin-panel" aria-labelledby="restricted-checkin-title">
        <div>
          <p className="form-kicker">Conference entrance</p>
          <h2 id="restricted-checkin-title">QR scanner check-in</h2>
          <p>
            Keep this field focused and scan the attendee’s KTAF QR pass. You can also
            type the registration reference manually when a scanner is unavailable.
          </p>
        </div>
        <form
          className="scanner-form"
          onSubmit={(event) => {
            event.preventDefault();
            void processCheckIn(scanValue);
          }}
        >
          <label htmlFor="restricted-registration-scanner">Scanner input</label>
          <div>
            <input
              ref={scannerInputRef}
              id="restricted-registration-scanner"
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
              {scanBusy ? "Checking…" : "Check in"}
            </button>
          </div>
        </form>
        <p className="checkin-kiosk-note">
          Totals and attendee status refresh every 20 seconds across team devices.
        </p>
      </section>

      <section className="restricted-directory-panel" aria-labelledby="directory-title">
        <div className="restricted-directory-toolbar">
          <div>
            <p className="form-kicker">Active attendees</p>
            <h2 id="directory-title">Attendance list</h2>
            <p>Showing {filtered.length} of {attendees.length}</p>
          </div>
          <div className="restricted-directory-controls">
            <div className="restricted-attendance-filters" aria-label="Filter attendance list">
              <button type="button" aria-pressed={attendanceFilter === "all"} onClick={() => setAttendanceFilter("all")}>All</button>
              <button type="button" aria-pressed={attendanceFilter === "checked-in"} onClick={() => setAttendanceFilter("checked-in")}>Checked in</button>
              <button type="button" aria-pressed={attendanceFilter === "waiting"} onClick={() => setAttendanceFilter("waiting")}>Waiting</button>
            </div>
            <label className="attendee-search">
              <span className="sr-only">Search by name or position</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or position…"
                autoComplete="off"
              />
            </label>
          </div>
        </div>

        {error ? <p className="form-message form-error restricted-directory-message" role="alert">{error}</p> : null}
        {message ? <p className="form-message form-success restricted-directory-message" role="status">{message}</p> : null}

        <div className="restricted-directory-table-wrap">
          <table className="restricted-directory-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Check-in</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((attendee) => (
                <tr key={attendee.id}>
                  <td><strong>{formatAttendeeName(attendee.full_name)}</strong></td>
                  <td>{attendee.position}</td>
                  <td>
                    <span className={`restricted-checkin-state ${attendee.checked_in_at ? "restricted-checkin-complete" : "restricted-checkin-waiting"}`}>
                      {attendee.checked_in_at ? "Checked in" : "Waiting"}
                    </span>
                    {attendee.checked_in_at ? <small>{formatCheckInTime(attendee.checked_in_at)}</small> : null}
                  </td>
                  <td>
                    <button
                      className="restricted-directory-edit"
                      type="button"
                      onClick={() => {
                        setEditing(attendee);
                        setError("");
                        setMessage("");
                      }}
                    >
                      Edit name and position
                    </button>
                  </td>
                </tr>
              ))}
              {!busy && !filtered.length ? (
                <tr><td className="attendee-empty" colSpan={4}>No attendees match your search or attendance filter.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {editing ? (
        <div className="portal-dialog-backdrop" role="presentation">
          <section className="portal-action-dialog" role="dialog" aria-modal="true" aria-labelledby="restricted-edit-title">
            <button
              className="portal-dialog-close"
              type="button"
              onClick={() => setEditing(null)}
              aria-label="Close dialog"
              disabled={saving}
            >×</button>
            <p className="form-kicker">Restricted editing</p>
            <h2 id="restricted-edit-title">Edit name and position</h2>
            <form onSubmit={save}>
              <fieldset className="attendee-edit-fields" disabled={saving}>
                <legend className="sr-only">Editable attendee fields</legend>
                <label>
                  <span>Full name</span>
                  <input name="full_name" type="text" defaultValue={editing.full_name} minLength={2} maxLength={120} autoComplete="off" spellCheck={false} required />
                </label>
                <label>
                  <span>Position / professional title</span>
                  <input name="position" type="text" defaultValue={editing.position} minLength={2} maxLength={120} autoComplete="off" spellCheck={false} required />
                </label>
              </fieldset>
              {error ? <p className="form-message form-error" role="alert">{error}</p> : null}
              <div className="portal-dialog-actions">
                <button type="button" onClick={() => setEditing(null)} disabled={saving}>Keep unchanged</button>
                <button className="portal-confirm-action" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save name and position"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
