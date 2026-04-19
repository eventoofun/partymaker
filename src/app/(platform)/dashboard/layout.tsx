export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Plus } from "lucide-react";
import SidebarNav from "./SidebarNav";
import DashboardGenio from "./DashboardGenio";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="dashboard-layout">
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="dashboard-sidebar">
        {/* Logo */}
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "1.5rem",
          background: "var(--gradient-brand)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          padding: "8px 12px",
          marginBottom: "32px",
        }}>
          Cumplefy ✨
        </div>

        {/* Quick create button */}
        <Link
          href="/dashboard/eventos/nuevo"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--gradient-brand)",
            color: "white",
            textDecoration: "none",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontWeight: 600,
            fontSize: "0.9rem",
            marginBottom: "32px",
            boxShadow: "var(--glow-brand)",
          }}
        >
          <Plus size={18} /> Nuevo evento
        </Link>

        {/* Nav links */}
        <SidebarNav />

        {/* User */}
        <div style={{
          marginTop: "auto",
          padding: "12px",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <UserButton appearance={{
            elements: { avatarBox: { width: "36px", height: "36px" } },
          }} />
          <div style={{ fontSize: "0.8rem", color: "#8E8E93" }}>Mi cuenta</div>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header className="dashboard-mobile-header">
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "1.2rem",
          background: "var(--gradient-brand)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Cumplefy ✨
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href="/dashboard/eventos/nuevo"
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              background: "var(--gradient-brand)", color: "white",
              textDecoration: "none",
              padding: "8px 14px",
              borderRadius: "var(--radius-md)",
              fontWeight: 600, fontSize: "0.8rem",
            }}
          >
            <Plus size={15} /> Nuevo
          </Link>
          <UserButton appearance={{ elements: { avatarBox: { width: "32px", height: "32px" } } }} />
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="dashboard-main">
        {children}
      </main>

      {/* ── GENIO CHATBOT ── */}
      <DashboardGenio />
    </div>
  );
}
