"use client";

import { useEffect, useRef } from "react";

export default function CityBreakdown({ cities, onClose }: {
  cities: { city: string; count: number }[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const total = cities.reduce((sum, city) => sum + city.count, 0);
  const maximum = Math.max(1, ...cities.map(city => city.count));

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="portal-city-dialog" onClose={onClose}
      aria-labelledby="city-chart-title" aria-describedby="city-chart-description">
      <button className="portal-dialog-close" type="button" aria-label="Close city chart" onClick={onClose}>×</button>
      <p className="form-kicker">Cities represented</p>
      <h2 id="city-chart-title">Registered attendees by city</h2>
      <p className="city-chart-summary"><strong>{total}</strong> registered attendees · <strong>{cities.length}</strong> cities</p>
      <p id="city-chart-description" className="city-chart-description">All active registrations, using standardized city names. Cancelled registrations and test records are excluded. Counts may include duplicates until reviewed.</p>
      {cities.length ? (
        <figure className="city-chart">
          <figcaption>Number of registered attendees · highest to lowest</figcaption>
          <ol className="city-chart-bars" aria-label="Attendee counts by city">
            {cities.map(({ city, count }) => (
              <li key={city} className="city-chart-row">
                <span className="city-chart-label">{city}</span>
                <span className="city-chart-track" aria-hidden="true"><span className="city-chart-bar" style={{ width: `${count / maximum * 100}%` }} /></span>
                <strong className="city-chart-count">{count}</strong>
              </li>
            ))}
          </ol>
        </figure>
      ) : <p className="city-chart-empty">No active registrations to display yet.</p>}
    </dialog>
  );
}
