"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { attendeeDirectoryEditError, validateAttendeeDirectoryEdit } from "../../lib/attendee-directory-edit";
import { formatAttendeeName } from "../../lib/attendee-presentation";
import { withPortalTimeout } from "../../lib/portal-request";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

type DirectoryAttendee = {
  id: string;
  full_name: string;
  position: string;
};

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
  const [editing, setEditing] = useState<DirectoryAttendee | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    setBusy(true);
    setError("");
    try {
      const { data, error: requestError } = await withPortalTimeout(
        client.rpc("get_ktaf_attendee_directory"),
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
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return attendees;
    return attendees.filter((attendee) =>
      [attendee.full_name, formatAttendeeName(attendee.full_name), attendee.position]
        .some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [attendees, query]);

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
        current.map((attendee) => attendee.id === updated.id ? updated : attendee),
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
          <h1>Name and position only</h1>
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
          This account receives only attendee names and positions. Email addresses,
          phone numbers, registration references, city, status, check-in information,
          backups and Excel export are not available.
        </p>
      </section>

      <section className="restricted-directory-panel" aria-labelledby="directory-title">
        <div className="restricted-directory-toolbar">
          <div>
            <p className="form-kicker">Active attendees</p>
            <h2 id="directory-title">Attendee directory</h2>
            <p>Showing {filtered.length} of {attendees.length}</p>
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

        {error ? <p className="form-message form-error restricted-directory-message" role="alert">{error}</p> : null}
        {message ? <p className="form-message form-success restricted-directory-message" role="status">{message}</p> : null}

        <div className="restricted-directory-table-wrap">
          <table className="restricted-directory-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((attendee) => (
                <tr key={attendee.id}>
                  <td><strong>{formatAttendeeName(attendee.full_name)}</strong></td>
                  <td>{attendee.position}</td>
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
                <tr><td className="attendee-empty" colSpan={3}>No attendees match your search.</td></tr>
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
