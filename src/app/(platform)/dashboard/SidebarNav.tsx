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
    <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
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
              padding: "9px 12px",
              borderRadius: "10px",
              color: active ? "#1C1C1E" : "#8E8E93",
              background: active ? "rgba(0,0,0,0.06)" : "transparent",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: active ? 600 : 400,
              transition: "background 0.15s, color 0.15s",
              letterSpacing: "-0.01em",
            }}
          >
            <Icon
              size={17}
              style={{ color: active ? "#00C2D1" : "#AEAEB2", flexShrink: 0 }}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
