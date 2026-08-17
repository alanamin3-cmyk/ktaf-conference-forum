import type { Metadata } from "next";
import AdminPortal from "./AdminPortal";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Team registration portal | KTAF",
  description: "Protected KTAF attendee registration management portal.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminPortal />;
}
