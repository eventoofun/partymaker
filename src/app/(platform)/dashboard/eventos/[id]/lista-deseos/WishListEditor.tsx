"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Link2, ExternalLink, Trash2, Gift, Star, ShoppingBag, Check } from "lucide-react";
import { formatEuros, fundingPercent } from "@/lib/utils";
import type { Event, WishList, WishItem } from "@/db/schema";

type WishListWithItems = WishList & { items: WishItem[] };
type EventWithWishList = Event & { wishList: WishListWithItems | null };

interface Props {
  event: EventWithWishList;
  wishList: WishListWithItems;
}

const CATEGORIES = [
  { value: "juguete", label: "Juguete" },
  { value: "ropa", label: "Ropa" },
  { value: "libro", label: "Libro" },
  { value: "tecnologia", label: "Tecnología" },
  { value: "experiencia", label: "Experiencia" },
  { value: "deporte", label: "Deporte" },
  { value: "otro", label: "Otro" },
];

const PRIORITIES = [
  { value: "alta", label: "⭐ Alta" },
  { value: "media", label: "Normal" },
  { value: "baja", label: "Baja" },
];

const STATUS_DOT: Record<string, string> = {
  available: "#06ffa5",
  partially_funded: "#f59e0b",
  funded: "#f59e0b",
  purchased: "#94a3b8",
  reserved: "#94a3b8",
};

export default function WishListEditor({ event, wishList }: Props) {
  const [items, setItems] = useState<WishItem[]>(wishList.items);
  const [showForm, setShowForm] = useState(items.length === 0);
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    url: "",
    title: "",
    description: "",
    price: "",
    category: "juguete",
    priority: "media",
    isCollective: false,
    targetAmount: "",
  });

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/e/${event.slug}`;

  async function handleImportUrl() {
    if (!form.url) return;
    setImporting(true);
    try {
      const res = await fetch(`/api/wish-items/fetch-url?url=${encodeURIComponent(form.url)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm((f) => ({
        ...f,
        title: data.title ?? f.title,
        price: data.price ? String(data.price) : f.price,
        description: data.description ?? f.description,
      }));
      toast.success("Producto importado");
    } catch {
      toast.error("No se pudo importar el producto. Rellena los datos manualmente.");
    } finally {
      setImporting(false);
    }
  }

  async function handleAddItem() {
    if (!form.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const body = {
        wishListId: wishList.id,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        url: form.url.trim() || undefined,
        price: form.price ? Math.round(parseFloat(form.price) * 100) : undefined,
        category: form.category,
        priority: form.priority,
        isCollective: form.isCollective,
        targetAmount: form.isCollective && form.targetAmount
          ? Math.round(parseFloat(form.targetAmount) * 100)
          : undefined,
        position: items.length,
      };

      const res = await fetch("/api/wish-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const { item } = await res.json();
      setItems((prev) => [...prev, item]);
      setForm({ url: "", title: "", description: "", price: "", category: "juguete", priority: "media", isCollective: false, targetAmount: "" });
      setShowForm(false);
      toast.success("¡Regalo añadido!");
    } catch {
      toast.error("Error al añadir el regalo");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/wish-items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Regalo eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--surface-bg)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "var(--radius-md)",
    padding: "10px 14px",
    color: "white",
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "var(--font-body)",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "6px",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--neutral-400)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div style={{ maxWidth: "720px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "var(--text-3xl)", marginBottom: "6px" }}>
          Lista de regalos
        </h1>
        <p style={{ color: "var(--neutral-400)", marginBottom: "20px" }}>
          {event.celebrantName} · {items.length} {items.length === 1 ? "regalo" : "regalos"}
        </p>

        {/* Share bar */}
        <div style={{
          display: "flex",
          gap: "10px",
          padding: "14px 18px",
          background: "var(--surface-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(255,255,255,0.06)",
          alignItems: "center",
        }}>
          <div style={{ flex: 1, fontSize: "0.82rem", color: "var(--neutral-500)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {publicUrl}
          </div>
          <button
            onClick={handleCopy}
            className="btn btn--ghost"
            style={{ flexShrink: 0, fontSize: "0.82rem", padding: "8px 14px", gap: "6px" }}
          >
            {copied ? <Check size={14} style={{ color: "var(--color-success)" }} /> : <Link2 size={14} />}
            {copied ? "Copiado" : "Copiar"}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--ghost"
            style={{ flexShrink: 0, fontSize: "0.82rem", padding: "8px 14px", gap: "6px", textDecoration: "none" }}
          >
            <ExternalLink size={14} /> Ver
          </a>
        </div>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          {items.map((item) => {
            const pct = item.isCollective && item.targetAmount
              ? fundingPercent(item.collectedAmount ?? 0, item.targetAmount)
              : null;

            return (
              <div
                key={item.id}
                className="pm-card"
                style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: "14px" }}
              >
                {/* Status dot */}
                <div style={{
                  width: "10px", height: "10px",
                  borderRadius: "50%",
                  background: STATUS_DOT[item.status] ?? "#94a3b8",
                  flexShrink: 0,
                  marginTop: "5px",
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{item.title}</span>
                    {item.priority === "alta" && (
                      <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600 }}>★ Alta prioridad</span>
                    )}
                    <span style={{ fontSize: "0.75rem", color: "var(--neutral-600)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "999px" }}>
                      {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                    </span>
                  </div>

                  {item.price && (
                    <div style={{ fontSize: "0.88rem", color: "var(--neutral-400)", marginTop: "4px" }}>
                      {formatEuros(item.price)}
                    </div>
                  )}

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "0.78rem", color: "var(--brand-primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "4px" }}
                    >
                      <ExternalLink size={11} /> Ver producto
                    </a>
                  )}

                  {/* Collective funding bar */}
                  {item.isCollective && item.targetAmount && pct !== null && (
                    <div style={{ marginTop: "10px" }}>
                      <div className="funding-bar">
                        <div className="funding-bar__fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", marginTop: "4px" }}>
                        {formatEuros(item.collectedAmount ?? 0)} de {formatEuros(item.targetAmount)} · {pct}%
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--neutral-600)",
                    padding: "4px",
                    flexShrink: 0,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--neutral-600)")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showForm && (
        <div style={{
          textAlign: "center",
          padding: "60px 40px",
          background: "var(--surface-card)",
          border: "2px dashed rgba(255,255,255,0.08)",
          borderRadius: "var(--radius-xl)",
          marginBottom: "24px",
        }}>
          <Gift size={40} style={{ margin: "0 auto 16px", color: "var(--neutral-600)" }} />
          <h3 style={{ marginBottom: "8px", color: "var(--neutral-300)" }}>Sin regalos todavía</h3>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.9rem", marginBottom: "24px" }}>
            Añade los primeros regalos para que tus invitados puedan elegir.
          </p>
          <button className="btn btn--primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Añadir regalo
          </button>
        </div>
      )}

      {/* Add button */}
      {items.length > 0 && !showForm && (
        <button
          className="btn btn--ghost"
          onClick={() => setShowForm(true)}
          style={{ marginBottom: "24px" }}
        >
          <Plus size={18} /> Añadir regalo
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <div style={{
          background: "var(--surface-card)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "var(--radius-xl)",
          padding: "28px",
        }}>
          <h3 style={{ marginBottom: "24px", fontSize: "1rem", fontWeight: 700 }}>
            Nuevo regalo
          </h3>

          {/* URL import */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>URL del producto (opcional)</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://www.amazon.es/..."
                style={{ ...inputStyle, flex: 1 }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleImportUrl(); } }}
              />
              <button
                type="button"
                onClick={handleImportUrl}
                disabled={importing || !form.url}
                className="btn btn--ghost"
                style={{ flexShrink: 0, fontSize: "0.82rem" }}
              >
                {importing ? "..." : "Importar"}
              </button>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--neutral-600)", marginTop: "4px" }}>
              Pega el enlace de Amazon, El Corte Inglés, Zara... y rellenaremos los datos automáticamente.
            </p>
          </div>

          {/* Title */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Nombre del regalo *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="ej. LEGO City 60375"
              style={inputStyle}
            />
          </div>

          {/* Price + Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={labelStyle}>Precio (€)</label>
              <input
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                type="number"
                min={0}
                step={0.01}
                placeholder="29.99"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Prioridad</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, priority: p.value }))}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-md)",
                    border: form.priority === p.value
                      ? "2px solid var(--brand-primary)"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: form.priority === p.value
                      ? "rgba(255,51,102,0.12)"
                      : "var(--surface-bg)",
                    color: form.priority === p.value ? "white" : "var(--neutral-400)",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    fontWeight: form.priority === p.value ? 600 : 400,
                    transition: "all 0.2s",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Collective toggle */}
          <div style={{ marginBottom: form.isCollective ? "16px" : "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isCollective: !f.isCollective }))}
                style={{
                  width: "44px",
                  height: "24px",
                  borderRadius: "999px",
                  background: form.isCollective ? "var(--brand-primary)" : "rgba(255,255,255,0.1)",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute",
                  top: "3px",
                  left: form.isCollective ? "23px" : "3px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "white",
                  transition: "left 0.2s",
                }} />
              </button>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Regalo colectivo</div>
                <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)" }}>
                  Varios invitados pueden contribuir juntos
                </div>
              </div>
            </div>
          </div>

          {form.isCollective && (
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Importe objetivo (€)</label>
              <input
                value={form.targetAmount}
                onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                type="number"
                min={0}
                step={0.01}
                placeholder="150.00"
                style={{ ...inputStyle, width: "180px" }}
              />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={saving}
              className="btn btn--primary"
            >
              {saving ? "Guardando..." : "Añadir regalo"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm({ url: "", title: "", description: "", price: "", category: "juguete", priority: "media", isCollective: false, targetAmount: "" });
              }}
              className="btn btn--ghost"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
