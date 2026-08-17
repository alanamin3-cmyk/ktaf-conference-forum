"use client";

import { useState } from "react";

const links = [
  { href: "#purpose", label: "Purpose" },
  { href: "#focus", label: "Scientific focus" },
  { href: "#updates", label: "Conference updates" },
  { href: "#register", label: "Register" },
  { href: "#sponsor", label: "Sponsor" },
];

export default function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <details
      className="mobile-nav"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        <span>Menu</span>
        <span className="mobile-nav-status" aria-hidden="true">
          {open ? "Close" : "Explore"}
        </span>
      </summary>

      <nav aria-label="Mobile navigation">
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
      </nav>
    </details>
  );
}
