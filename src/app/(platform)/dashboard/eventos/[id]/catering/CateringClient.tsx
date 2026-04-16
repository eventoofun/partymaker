"use client";

import { useState } from "react";
import Link from "next/link";
import { UtensilsCrossed, Plus, Pencil, Trash2, Download, X, ArrowLeft } from "lucide-react";

type MenuType = "adult" | "child" | "vegan" | "vegetarian" | "gluten_free" | "other";

interface MenuWithCount {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  type: MenuType | null;
  isDefault: boolean;
  sortOrder: number;
  rsvpCount: number;
}

interface RsvpRow {
  guestName: string;
  guestEmail: string | null;
  menuChoiceId: string | null;
  dietaryNotes: string | null;
  allergies: string[] | null;
}

interface Props {
  eventId: string;
  celebrantName: string;
  menus: MenuWithCount[];
  rsvpData: RsvpRow[];
  canEdit: boolean;
}

const TYPE_LABELS: Record<MenuType, string> = {
  adult: "Adulto",
  child: "Niños",
  vegan: "Vegano",
  vegetarian: "Vegetariano",
  gluten_free: "Sin gluten",
  other: "Otro",
};

const TYPE_COLORS: Record<MenuType, string> = {
  adult: "#3b82f6",
  child: "#f59e0b",
  vegan: "#10b981",
  vegetarian: "#84cc16",
  gluten_free: "#8b5cf6",
  other: "#6b7280",
};

const EMPTY_FORM = { name: "", description: "", type: "" as MenuType | "", isDefault: false };

export default function CateringClient({ eventId, celebrantName, menus: initialMenus, rsvpData, canEdit }: Props) {
  const [menus, setMenus] = useState<MenuWithCount[]>(initialMenus);
  const [showCreate, setShowCreate] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuWithCount | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<MenuType | "all">("all");

  const menuMap = Object.fromEntries(menus.map((m) => [m.id, m]));
  const totalSelections = menus.reduce((acc, m) => acc + m.rsvpCount, 0);
  const totalRsvp = rsvpData.length;
  const totalRsvpWithMenu = rsvpData.filter((r) => r.menuChoiceId).length;
  const hasAnalytics = totalSelections > 0;

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/eventos/${eventId}/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          type: form.type || null,
          isDefault: form.isDefault,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al crear menú");
      }
      const created: MenuWithCount = { ...(await res.json()), rsvpCount: 0 };
      setMenus((prev) => [
        ...(form.isDefault ? prev.map((m) => ({ ...m, isDefault: false })) : prev),
        created,
      ]);
      setShowCreate(false);
      setForm(EMPTY_FORM);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit() {
    if (!editingMenu) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/eventos/${eventId}/menus/${editingMenu.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          type: form.type || null,
          isDefault: form.isDefault,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al editar menú");
      }
      const updated = await res.json();
      setMenus((prev) =>
        prev.map((m) => {
          if (m.id === editingMenu.id) return { ...m, ...updated };
          if (form.isDefault) return { ...m, isDefault: false };
          return m;
        }),
      );
      setEditingMenu(null);
      setForm(EMPTY_FORM);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(menuId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/eventos/${eventId}/menus/${menuId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al eliminar menú");
      }
      setMenus((prev) => prev.filter((m) => m.id !== menuId));
      setDeletingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    const rows = rsvpData
      .filter((r) => r.menuChoiceId && menuMap[r.menuChoiceId])
      .map((r) => {
        const menu = menuMap[r.menuChoiceId!];
        return [
          r.guestName,
          r.guestEmail ?? "",
          menu.name,
          (r.allergies ?? []).join("; "),
          r.dietaryNotes ?? "",
        ];
      });

    const csv = [
      ["Nombre invitado", "Email", "Menú elegido", "Alergias", "Notas dietéticas"],
      ...rows,
    ]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catering.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setShowCreate(true);
  }

  function openEdit(menu: MenuWithCount) {
    setForm({
      name: menu.name,
      description: menu.description ?? "",
      type: menu.type ?? "",
      isDefault: menu.isDefault,
    });
    setError(null);
    setEditingMenu(menu);
  }

  function closeModal() {
    setShowCreate(false);
    setEditingMenu(null);
    setError(null);
  }

  const filteredMenus =
    typeFilter === "all" ? menus : menus.filter((m) => m.type === typeFilter);

  const menuTypes = [...new Set(menus.map((m) => m.type).filter((t): t is MenuType => t !== null))];

  return (
    <div style={{ maxWidth: "760px" }}>
      <Link href={`/dashboard/eventos/${eventId}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--neutral-500)", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", marginBottom: "20px" }}>
        <ArrowLeft size={14} /> {celebrantName}
      </Link>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "4px" }}>Catering</h1>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.9rem" }}>
            Gestiona los menús y preferencias alimentarias de tus invitados
          </p>
        </div>
        {canEdit && (
          <button
            className="btn btn--primary"
            onClick={openCreate}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem" }}
          >
            <Plus size={16} /> Nuevo menú
          </button>
        )}
      </div>

      {/* Global error */}
      {error && !showCreate && !editingMenu && (
        <div
          className="pm-card"
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            color: "#dc2626",
            background: "rgba(239,68,68,0.08)",
            borderColor: "rgba(239,68,68,0.3)",
          }}
        >
          {error}
        </div>
      )}

      {/* Section 1: Menu list */}
      {menus.length === 0 ? (
        <div className="pm-card" style={{ padding: "64px 32px", textAlign: "center" }}>
          <UtensilsCrossed
            size={48}
            style={{ color: "var(--neutral-600)", margin: "0 auto 20px" }}
          />
          <h2 style={{ fontSize: "1.1rem", marginBottom: "10px" }}>Sin menús configurados</h2>
          <p
            style={{
              color: "var(--neutral-500)",
              fontSize: "0.88rem",
              maxWidth: "380px",
              margin: "0 auto 24px",
            }}
          >
            Crea opciones de menú (estándar, vegetariano, sin gluten…) y los invitados elegirán en
            el RSVP.
          </p>
          {canEdit && (
            <button
              className="btn btn--primary"
              onClick={openCreate}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Crear primer menú
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          {menus.map((menu) => (
            <div
              key={menu.id}
              className="pm-card"
              style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px" }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "var(--radius-md)",
                  background: menu.type
                    ? `${TYPE_COLORS[menu.type]}22`
                    : "rgba(255,51,102,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <UtensilsCrossed
                  size={20}
                  style={{
                    color: menu.type ? TYPE_COLORS[menu.type] : "var(--brand-primary)",
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  {menu.name}
                  {menu.isDefault && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: "rgba(255,51,102,0.12)",
                        color: "var(--brand-primary)",
                        fontWeight: 600,
                      }}
                    >
                      Por defecto
                    </span>
                  )}
                  {menu.type && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: `${TYPE_COLORS[menu.type]}22`,
                        color: TYPE_COLORS[menu.type],
                        fontWeight: 600,
                      }}
                    >
                      {TYPE_LABELS[menu.type]}
                    </span>
                  )}
                </div>
                {menu.description && (
                  <div
                    style={{ fontSize: "0.8rem", color: "var(--neutral-500)", marginTop: "3px" }}
                  >
                    {menu.description}
                  </div>
                )}
                <div
                  style={{ fontSize: "0.78rem", color: "var(--neutral-400)", marginTop: "4px" }}
                >
                  {menu.rsvpCount} selección{menu.rsvpCount !== 1 ? "es" : ""}
                </div>
              </div>

              {canEdit && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <button
                    className="btn btn--ghost"
                    style={{ padding: "6px 10px" }}
                    onClick={() => openEdit(menu)}
                    title="Editar"
                  >
                    <Pencil size={15} />
                  </button>

                  {deletingId === menu.id ? (
                    <span
                      style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}
                    >
                      <span style={{ color: "var(--neutral-500)" }}>¿Eliminar?</span>
                      <button
                        className="btn btn--primary"
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.78rem",
                          background: "#dc2626",
                          borderColor: "#dc2626",
                        }}
                        onClick={() => handleDelete(menu.id)}
                        disabled={loading}
                      >
                        Sí
                      </button>
                      <button
                        className="btn btn--ghost"
                        style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                        onClick={() => setDeletingId(null)}
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      className="btn btn--ghost"
                      style={{ padding: "6px 10px", opacity: menu.rsvpCount > 0 ? 0.4 : 1 }}
                      onClick={() => setDeletingId(menu.id)}
                      disabled={menu.rsvpCount > 0}
                      title={
                        menu.rsvpCount > 0
                          ? "No se puede eliminar: tiene selecciones de invitados"
                          : "Eliminar"
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Section 2: Analytics */}
      {hasAnalytics && (
        <div className="pm-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "4px" }}>
            Análisis de preferencias
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--neutral-500)", marginBottom: "16px" }}>
            {totalRsvpWithMenu} de {totalRsvp} invitados han elegido menú
          </p>

          {menuTypes.length > 0 && (
            <div
              style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}
            >
              <button
                onClick={() => setTypeFilter("all")}
                style={{
                  padding: "4px 12px",
                  borderRadius: "999px",
                  border: "1px solid",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  borderColor: typeFilter === "all" ? "var(--brand-primary)" : "var(--neutral-200)",
                  background: typeFilter === "all" ? "rgba(255,51,102,0.1)" : "transparent",
                  color: typeFilter === "all" ? "var(--brand-primary)" : "var(--neutral-500)",
                  fontWeight: typeFilter === "all" ? 600 : 400,
                }}
              >
                Todos
              </button>
              {menuTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    border: "1px solid",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    borderColor: typeFilter === t ? TYPE_COLORS[t] : "var(--neutral-200)",
                    background: typeFilter === t ? `${TYPE_COLORS[t]}18` : "transparent",
                    color: typeFilter === t ? TYPE_COLORS[t] : "var(--neutral-500)",
                    fontWeight: typeFilter === t ? 600 : 400,
                  }}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--neutral-100)" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 0",
                    fontWeight: 600,
                    color: "var(--neutral-600)",
                  }}
                >
                  Menú
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "6px 0",
                    fontWeight: 600,
                    color: "var(--neutral-600)",
                  }}
                >
                  Sel.
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "6px 0",
                    fontWeight: 600,
                    color: "var(--neutral-600)",
                  }}
                >
                  %
                </th>
                <th style={{ padding: "6px 0 6px 12px", width: "120px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredMenus.map((menu) => {
                const pct =
                  totalSelections > 0
                    ? Math.round((menu.rsvpCount / totalSelections) * 100)
                    : 0;
                return (
                  <tr key={menu.id} style={{ borderBottom: "1px solid var(--neutral-50)" }}>
                    <td style={{ padding: "8px 0" }}>{menu.name}</td>
                    <td style={{ textAlign: "right", padding: "8px 0" }}>{menu.rsvpCount}</td>
                    <td style={{ textAlign: "right", padding: "8px 0" }}>{pct}%</td>
                    <td style={{ padding: "8px 0 8px 12px" }}>
                      <div
                        style={{
                          height: "6px",
                          background: "var(--neutral-100)",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: menu.type
                              ? TYPE_COLORS[menu.type]
                              : "var(--brand-primary)",
                            borderRadius: "3px",
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Section 3: CSV Export */}
      {totalSelections > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="btn btn--outline"
            onClick={handleExport}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem" }}
          >
            <Download size={15} /> Descargar CSV
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreate || editingMenu) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
          }}
        >
          <div className="pm-card" style={{ width: "100%", maxWidth: "480px", padding: "28px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {editingMenu ? "Editar menú" : "Nuevo menú"}
              </h2>
              <button
                className="btn btn--ghost"
                style={{ padding: "4px 8px" }}
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(239,68,68,0.08)",
                  color: "#dc2626",
                  fontSize: "0.85rem",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Nombre <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  className="pm-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Menú vegetariano"
                  maxLength={120}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Descripción
                </label>
                <textarea
                  className="pm-input"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción opcional…"
                  maxLength={500}
                  rows={2}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Tipo
                </label>
                <select
                  className="pm-input"
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value as MenuType | "" }))
                  }
                >
                  <option value="">Sin tipo</option>
                  {(Object.entries(TYPE_LABELS) as [MenuType, string][]).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                />
                <span>Menú por defecto</span>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "24px",
              }}
            >
              <button className="btn btn--ghost" onClick={closeModal}>
                Cancelar
              </button>
              <button
                className="btn btn--primary"
                onClick={editingMenu ? handleEdit : handleCreate}
                disabled={loading || !form.name.trim()}
              >
                {loading ? "Guardando…" : editingMenu ? "Guardar cambios" : "Crear menú"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
