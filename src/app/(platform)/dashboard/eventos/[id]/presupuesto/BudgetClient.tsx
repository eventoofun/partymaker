"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, CheckCircle2, Circle, TrendingUp, TrendingDown, Minus } from "lucide-react";

type Category =
  | "venue" | "catering" | "decoration" | "entertainment"
  | "photography" | "music" | "cake" | "invitations"
  | "transport" | "clothing" | "flowers" | "other";

interface BudgetItem {
  id: string;
  category: string;
  name: string;
  vendor: string | null;
  estimatedCost: string | null;
  actualCost: string | null;
  notes: string | null;
  isPaid: boolean;
  sortOrder: number;
}

interface Props {
  eventId: string;
  initialItems: BudgetItem[];
}

const CATEGORIES: { value: Category; label: string; emoji: string; color: string }[] = [
  { value: "venue",         label: "Lugar/Salón",    emoji: "🏛️", color: "#8338ec" },
  { value: "catering",      label: "Catering",       emoji: "🍽️", color: "#ff3366" },
  { value: "decoration",    label: "Decoración",     emoji: "🎀", color: "#f59e0b" },
  { value: "entertainment", label: "Animación",      emoji: "🎪", color: "#06b6d4" },
  { value: "photography",   label: "Foto/Vídeo",     emoji: "📸", color: "#8b5cf6" },
  { value: "music",         label: "Música/DJ",      emoji: "🎵", color: "#ec4899" },
  { value: "cake",          label: "Tarta",          emoji: "🎂", color: "#f97316" },
  { value: "invitations",   label: "Invitaciones",   emoji: "✉️", color: "#14b8a6" },
  { value: "transport",     label: "Transporte",     emoji: "🚌", color: "#64748b" },
  { value: "clothing",      label: "Vestuario",      emoji: "👗", color: "#a855f7" },
  { value: "flowers",       label: "Flores",         emoji: "💐", color: "#22c55e" },
  { value: "other",         label: "Otro",           emoji: "⭐", color: "#6b7280" },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

const EMPTY_FORM = {
  category: "other" as Category,
  name: "",
  vendor: "",
  estimatedCost: "",
  actualCost: "",
  notes: "",
  isPaid: false,
};

function fmt(val: string | null | undefined): string {
  if (!val) return "—";
  const n = parseFloat(val);
  return isNaN(n) ? "—" : `${n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function toNum(val: string | null | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

export default function BudgetClient({ eventId, initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<BudgetItem[]>(initialItems);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BudgetItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "categories">("list");

  // ── Computed totals ──
  const totalEstimated = items.reduce((s, i) => s + toNum(i.estimatedCost), 0);
  const totalActual    = items.reduce((s, i) => s + toNum(i.actualCost), 0);
  const totalPaid      = items.filter((i) => i.isPaid).reduce((s, i) => s + toNum(i.actualCost || i.estimatedCost), 0);
  const totalPending   = items.filter((i) => !i.isPaid).reduce((s, i) => s + toNum(i.actualCost || i.estimatedCost), 0);
  const variance       = totalActual - totalEstimated;
  const progress       = totalEstimated > 0 ? Math.min((totalActual / totalEstimated) * 100, 100) : 0;

  // ── Category breakdown ──
  const byCategory = CATEGORIES.map((cat) => {
    const catItems = items.filter((i) => i.category === cat.value);
    return {
      ...cat,
      count:     catItems.length,
      estimated: catItems.reduce((s, i) => s + toNum(i.estimatedCost), 0),
      actual:    catItems.reduce((s, i) => s + toNum(i.actualCost), 0),
      paid:      catItems.filter((i) => i.isPaid).length,
    };
  }).filter((c) => c.count > 0);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(item: BudgetItem) {
    setEditing(item);
    setForm({
      category:      item.category as Category,
      name:          item.name,
      vendor:        item.vendor ?? "",
      estimatedCost: item.estimatedCost ?? "",
      actualCost:    item.actualCost ?? "",
      notes:         item.notes ?? "",
      isPaid:        item.isPaid,
    });
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setError("");
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setError("");

    const payload = {
      category:      form.category,
      name:          form.name.trim(),
      vendor:        form.vendor.trim() || null,
      estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : null,
      actualCost:    form.actualCost ? parseFloat(form.actualCost) : null,
      notes:         form.notes.trim() || null,
      isPaid:        form.isPaid,
      sortOrder:     editing ? editing.sortOrder : items.length,
    };

    const url    = editing ? `/api/eventos/${eventId}/presupuesto/${editing.id}` : `/api/eventos/${eventId}/presupuesto`;
    const method = editing ? "PATCH" : "POST";

    startTransition(async () => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Error al guardar. Inténtalo de nuevo.";
        try { const e = await res.json(); msg = e.error ? JSON.stringify(e.error) : msg; } catch {}
        setError(msg);
        return;
      }

      const saved: BudgetItem = await res.json();
      setItems((prev) =>
        editing ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved]
      );
      closeModal();
      router.refresh();
    });
  }

  async function handleDelete(item: BudgetItem) {
    setDeletingId(item.id);
    const res = await fetch(`/api/eventos/${eventId}/presupuesto/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      router.refresh();
    }
    setDeletingId(null);
  }

  async function togglePaid(item: BudgetItem) {
    const res = await fetch(`/api/eventos/${eventId}/presupuesto/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid: !item.isPaid }),
    });
    if (res.ok) {
      const updated: BudgetItem = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    }
  }

  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      {/* ── Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Presupuestado",  value: totalEstimated, color: "#8338ec", sub: `${items.length} partidas` },
          { label: "Gasto real",     value: totalActual,    color: variance > 0 ? "#ff3366" : "#06ffa5", sub: variance === 0 ? "Sin variación" : `${variance > 0 ? "+" : ""}${variance.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € vs presupuesto` },
          { label: "Pagado",         value: totalPaid,      color: "#06ffa5", sub: `${items.filter(i => i.isPaid).length} de ${items.length} pagados` },
          { label: "Pendiente",      value: totalPending,   color: "#f59e0b", sub: `${items.filter(i => !i.isPaid).length} sin pagar` },
        ].map((s) => (
          <div key={s.label} className="pm-card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--neutral-500)", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {s.label}
            </div>
            <div style={{ fontSize: "1.45rem", fontWeight: 800, color: s.color, fontFamily: "var(--font-display)" }}>
              {s.value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--neutral-600)", marginTop: "4px" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Progress bar ── */}
      {totalEstimated > 0 && (
        <div className="pm-card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--neutral-400)" }}>
              Ejecución del presupuesto
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
              {variance > 0
                ? <TrendingUp size={14} style={{ color: "#ff3366" }} />
                : variance < 0
                  ? <TrendingDown size={14} style={{ color: "#06ffa5" }} />
                  : <Minus size={14} style={{ color: "var(--neutral-500)" }} />
              }
              <span style={{ color: variance > 0 ? "#ff3366" : variance < 0 ? "#06ffa5" : "var(--neutral-500)", fontWeight: 700 }}>
                {progress.toFixed(0)}% ejecutado
              </span>
            </div>
          </div>
          <div style={{ height: "8px", borderRadius: "999px", background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: "999px",
              background: variance > 0
                ? "linear-gradient(90deg, #ff3366, #ff6b6b)"
                : "linear-gradient(90deg, #8338ec, #06ffa5)",
              transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "0.72rem", color: "var(--neutral-600)" }}>
            <span>0 €</span>
            <span>{totalEstimated.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €</span>
          </div>
        </div>
      )}

      {/* ── Tabs + Add button ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "4px", background: "rgba(0,0,0,0.05)", borderRadius: "var(--radius-md)", padding: "3px" }}>
          {(["list", "categories"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 600,
                background: activeTab === tab ? "var(--surface-card)" : "transparent",
                color: activeTab === tab ? "#1C1C1E" : "var(--neutral-500)",
                transition: "all 0.15s",
              }}
            >
              {tab === "list" ? "Partidas" : "Por categoría"}
            </button>
          ))}
        </div>
        <button
          onClick={openAdd}
          className="btn btn--primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
        >
          <Plus size={15} /> Añadir partida
        </button>
      </div>

      {/* ── Empty state ── */}
      {items.length === 0 && (
        <div className="pm-card" style={{ padding: "64px 32px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>💰</div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "10px" }}>Sin partidas presupuestarias</h2>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem", maxWidth: "360px", margin: "0 auto 24px", lineHeight: 1.6 }}>
            Añade los gastos planificados para tu evento. Controla el presupuesto vs el gasto real en un solo lugar.
          </p>
          <button
            onClick={openAdd}
            className="btn btn--primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Añadir primera partida
          </button>
        </div>
      )}

      {/* ── List view ── */}
      {items.length > 0 && activeTab === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sorted.map((item) => {
            const cat = CAT_MAP[item.category] ?? CAT_MAP["other"];
            return (
              <div key={item.id} className="pm-card" style={{
                padding: "14px 18px",
                borderLeft: `3px solid ${cat.color}22`,
                opacity: deletingId === item.id ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Paid toggle */}
                  <button
                    onClick={() => togglePaid(item)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, display: "flex" }}
                    title={item.isPaid ? "Marcar como pendiente" : "Marcar como pagado"}
                  >
                    {item.isPaid
                      ? <CheckCircle2 size={20} style={{ color: "#06ffa5" }} />
                      : <Circle size={20} style={{ color: "var(--neutral-600)" }} />
                    }
                  </button>

                  {/* Category emoji */}
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "var(--radius-sm)",
                    background: `${cat.color}18`, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "1rem", flexShrink: 0,
                  }}>
                    {cat.emoji}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: item.isPaid ? "var(--neutral-500)" : "#1C1C1E" }}>
                        {item.name}
                      </span>
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 600,
                        padding: "1px 7px", borderRadius: "999px",
                        background: `${cat.color}18`, color: cat.color,
                        border: `1px solid ${cat.color}30`,
                      }}>
                        {cat.label}
                      </span>
                      {item.isPaid && (
                        <span style={{
                          fontSize: "0.65rem", fontWeight: 700,
                          padding: "1px 7px", borderRadius: "999px",
                          background: "rgba(6,255,165,0.1)", color: "#06ffa5",
                          border: "1px solid rgba(6,255,165,0.2)",
                        }}>
                          PAGADO
                        </span>
                      )}
                    </div>
                    {item.vendor && (
                      <div style={{ fontSize: "0.74rem", color: "var(--neutral-500)", marginTop: "2px" }}>
                        {item.vendor}
                      </div>
                    )}
                  </div>

                  {/* Costs */}
                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: "120px" }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center", justifyContent: "flex-end" }}>
                      {item.estimatedCost && (
                        <div>
                          <div style={{ fontSize: "0.65rem", color: "var(--neutral-600)", marginBottom: "1px" }}>Presup.</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--neutral-400)", fontWeight: 600 }}>
                            {fmt(item.estimatedCost)}
                          </div>
                        </div>
                      )}
                      {item.actualCost && (
                        <div>
                          <div style={{ fontSize: "0.65rem", color: "var(--neutral-600)", marginBottom: "1px" }}>Real</div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: (() => {
                            const e = toNum(item.estimatedCost); const a = toNum(item.actualCost);
                            return !item.estimatedCost ? "#1C1C1E" : a > e ? "#ff3366" : a < e ? "#06ffa5" : "#1C1C1E";
                          })() }}>
                            {fmt(item.actualCost)}
                          </div>
                        </div>
                      )}
                      {!item.estimatedCost && !item.actualCost && (
                        <div style={{ fontSize: "0.8rem", color: "var(--neutral-600)" }}>Sin importe</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                    <button
                      onClick={() => openEdit(item)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", borderRadius: "var(--radius-sm)", color: "var(--neutral-500)", display: "flex", alignItems: "center" }}
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", borderRadius: "var(--radius-sm)", color: "var(--neutral-500)", display: "flex", alignItems: "center" }}
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {item.notes && (
                  <div style={{ fontSize: "0.75rem", color: "var(--neutral-600)", marginTop: "8px", paddingLeft: "44px", lineHeight: 1.5 }}>
                    {item.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Category view ── */}
      {items.length > 0 && activeTab === "categories" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {byCategory.map((cat) => {
            const catVariance = cat.actual - cat.estimated;
            return (
              <div key={cat.value} className="pm-card" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "var(--radius-md)",
                    background: `${cat.color}18`, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "1.1rem", flexShrink: 0,
                  }}>
                    {cat.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{cat.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginTop: "2px" }}>
                      {cat.count} {cat.count === 1 ? "partida" : "partidas"} · {cat.paid} pagadas
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {cat.actual > 0 && (
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: catVariance > 0 ? "#ff3366" : "#06ffa5" }}>
                        {cat.actual.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </div>
                    )}
                    {cat.estimated > 0 && (
                      <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)", marginTop: "2px" }}>
                        Presup. {cat.estimated.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </div>
                    )}
                    {cat.actual === 0 && cat.estimated === 0 && (
                      <div style={{ fontSize: "0.8rem", color: "var(--neutral-600)" }}>Sin importes</div>
                    )}
                  </div>
                </div>
                {/* Mini bar */}
                {cat.estimated > 0 && cat.actual > 0 && (
                  <div style={{ marginTop: "10px", height: "4px", borderRadius: "999px", background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min((cat.actual / cat.estimated) * 100, 100)}%`,
                      borderRadius: "999px",
                      background: catVariance > 0 ? "#ff3366" : "#06ffa5",
                      transition: "width 0.3s",
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
        }} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={{
            background: "var(--surface-card)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid rgba(0,0,0,0.08)",
            padding: "28px",
            width: "100%",
            maxWidth: "520px",
            maxHeight: "90vh",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                {editing ? "Editar partida" : "Nueva partida"}
              </h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neutral-500)" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Category */}
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--neutral-400)", display: "block", marginBottom: "8px" }}>
                  Categoría
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setForm((f) => ({ ...f, category: c.value }))}
                      style={{
                        padding: "8px 4px",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${form.category === c.value ? c.color + "80" : "rgba(0,0,0,0.08)"}`,
                        background: form.category === c.value ? `${c.color}18` : "#FAFAFA",
                        cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                        fontSize: "0.63rem", color: form.category === c.value ? "#1C1C1E" : "var(--neutral-500)",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: "1rem" }}>{c.emoji}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--neutral-400)", display: "block", marginBottom: "6px" }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Salón de celebraciones Jardín Verde"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="pm-input"
                  style={{ width: "100%" }}
                  maxLength={150}
                />
              </div>

              {/* Vendor */}
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--neutral-400)", display: "block", marginBottom: "6px" }}>
                  Proveedor (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Nombre del proveedor o empresa"
                  value={form.vendor}
                  onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                  className="pm-input"
                  style={{ width: "100%" }}
                  maxLength={150}
                />
              </div>

              {/* Costs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--neutral-400)", display: "block", marginBottom: "6px" }}>
                    Coste estimado (€)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={form.estimatedCost}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))}
                    className="pm-input"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--neutral-400)", display: "block", marginBottom: "6px" }}>
                    Coste real (€)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={form.actualCost}
                    onChange={(e) => setForm((f) => ({ ...f, actualCost: e.target.value }))}
                    className="pm-input"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Paid toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => setForm((f) => ({ ...f, isPaid: !f.isPaid }))}
                  style={{
                    width: "40px", height: "22px",
                    borderRadius: "999px",
                    border: "none",
                    background: form.isPaid ? "#06ffa5" : "rgba(0,0,0,0.12)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: "3px",
                    left: form.isPaid ? "21px" : "3px",
                    width: "16px", height: "16px",
                    borderRadius: "50%",
                    background: form.isPaid ? "#0a0a0a" : "var(--neutral-500)",
                    transition: "left 0.2s",
                  }} />
                </button>
                <label style={{ fontSize: "0.85rem", color: "var(--neutral-300)", cursor: "pointer" }}
                  onClick={() => setForm((f) => ({ ...f, isPaid: !f.isPaid }))}>
                  Marcar como pagado
                </label>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--neutral-400)", display: "block", marginBottom: "6px" }}>
                  Notas (opcional)
                </label>
                <textarea
                  placeholder="Detalles adicionales, condiciones, plazos de pago..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="pm-input"
                  style={{ width: "100%", minHeight: "80px", resize: "vertical" }}
                  maxLength={500}
                />
              </div>

              {error && (
                <p style={{ color: "#ff3366", fontSize: "0.82rem" }}>{error}</p>
              )}

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button onClick={closeModal} className="btn btn--ghost" style={{ fontSize: "0.85rem" }}>
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="btn btn--primary"
                  style={{ fontSize: "0.85rem", opacity: isPending ? 0.6 : 1 }}
                >
                  {isPending ? "Guardando..." : editing ? "Guardar cambios" : "Añadir partida"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
