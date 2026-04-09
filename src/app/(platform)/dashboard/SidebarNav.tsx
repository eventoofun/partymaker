"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/eventos", label: "Mis eventos", icon: CalendarDays, exact: false },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              color: active ? "white" : "var(--neutral-400)",
              background: active ? "rgba(255,255,255,0.07)" : "transparent",
              textDecoration: "none",
              fontSize: "0.9rem",
              fontWeight: active ? 600 : 500,
              transition: "all 0.2s",
              borderLeft: active ? "2px solid var(--brand-primary)" : "2px solid transparent",
            }}
          >
            <Icon size={18} style={{ color: active ? "var(--brand-primary)" : "inherit" }} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
