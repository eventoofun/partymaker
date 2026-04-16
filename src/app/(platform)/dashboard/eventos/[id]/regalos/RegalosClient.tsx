"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Gift, ExternalLink, Pencil, Trash2, Loader2, X, ToggleLeft, ToggleRight, Sparkles, ArrowLeft } from "lucide-react";
import GiftSearchModal from "./GiftSearchModal";

interface GiftItem {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  url: string | null;
  imageUrl: string | null;
  quantityWanted: number;
  quantityTaken: number;
  isAvailable: boolean;
  sortOrder: number;
}

interface Props {
  eventId: string;
  eventSlug: string;
  celebrantName: string;
  giftListId: string;
  initialItems: GiftItem[];
}

type FormData = {
  title: string;
  description: string;
  price: string;
  url: string;
  imageUrl: string;
  quantityWanted: string;
};

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  price: "",
  url: "",
  imageUrl: "",
  quantityWanted: "1",
};

export default function RegalosClient({ eventId, eventSlug, celebrantName, giftListId, initialItems }: Props) {
  const [items, setItems] = useState<GiftItem[]>(initialItems);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GiftItem | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const totalItems = items.length;
  const totalAmount = items.reduce((acc, i) => acc + (i.price ?? 0), 0);

  function openAdd() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  }

  function openFromSearch(item: { title: string; price: number; url: string; imageUrl: string | null }) {
    setEditingItem(null);
    setForm({
      title: item.title,
      description: "",
      price: item.price ? (item.price / 100).toFixed(2) : "",
      url: item.url,
      imageUrl: item.imageUrl ?? "",
      quantityWanted: "1",
    });
    setError(null);
    setShowModal(true);
  }

  function openEdit(item: GiftItem) {
    setEditingItem(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      price: item.price ? (item.price / 100).toFixed(2) : "",
      url: item.url ?? "",
      imageUrl: item.imageUrl ?? "",
      quantityWanted: String(item.quantityWanted),
    });
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingItem(null);
    setError(null);
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    setError(null);

    const priceInCents = form.price ? Math.round(parseFloat(form.price) * 100) : null;
    const quantityWanted = parseInt(form.quantityWanted) || 1;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      url: form.url.trim() || null,
      price: priceInCents && priceInCents > 0 ? priceInCents : null,
      imageUrl: form.imageUrl.trim() || null,
      quantityWanted,
    };

    try {
      if (editingItem) {
        // PUT
        const res = await fetch(`/api/wish-items/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Error al guardar");
        const { item } = await res.json();
        setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      } else {
        // POST
        const res = await fetch("/api/wish-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, giftListId, sortOrder: items.length }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Error al crear");
        const { item } = await res.json();
        setItems((prev) => [...prev, item]);
      }
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: GiftItem) {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return;
    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/wish-items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      alert("No se pudo eliminar el regalo");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleAvailability(item: GiftItem) {
    setTogglingId(item.id);
    try {
      const res = await fetch(`/api/wish-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      if (!res.ok) throw new Error();
      const { item: updated } = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch {
      alert("No se pudo cambiar el estado");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      <div style={{ maxWidth: "760px" }}>
        <Link href={`/dashboard/eventos/${eventId}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--neutral-500)", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none", marginBottom: "20px" }}>
          <ArrowLeft size={14} /> {celebrantName}
        </Link>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "4px" }}>Lista de regalos</h1>
            <p style={{ color: "var(--neutral-500)", fontSize: "0.9rem" }}>
              {totalItems} {totalItems === 1 ? "regalo" : "regalos"} · €{(totalAmount / 100).toFixed(0)} en total
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <a
              href={`/e/${eventSlug}#regalos`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
            >
              <ExternalLink size={14} /> Ver pública
            </a>
            <button
              onClick={() => setShowSearch(true)}
              className="btn btn--ghost"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#ff3366", borderColor: "rgba(255,51,102,0.3)" }}
            >
              <Sparkles size={14} /> Buscar con IA
            </button>
            <button
              onClick={openAdd}
              className="btn btn--primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
            >
              <Plus size={15} /> Añadir regalo
            </button>
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="pm-card" style={{ padding: "64px 32px", textAlign: "center" }}>
            <Gift size={48} style={{ color: "var(--neutral-600)", margin: "0 auto 20px" }} />
            <h2 style={{ fontSize: "1.1rem", marginBottom: "10px" }}>Sin regalos todavía</h2>
            <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem", maxWidth: "380px", margin: "0 auto 24px", lineHeight: 1.6 }}>
              Añade los regalos que te gustaría recibir. Tus invitados podrán aportar
              la cantidad que quieran directamente desde la invitación.
            </p>
            <button onClick={openAdd} className="btn btn--primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Plus size={16} /> Añadir primer regalo
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {items.map((item) => {
              const taken = item.quantityTaken ?? 0;
              const wanted = item.quantityWanted ?? 1;
              const isFulfilled = taken >= wanted;
              const percent = wanted > 0 ? Math.min(100, Math.round((taken / wanted) * 100)) : 0;
              const statusColor = isFulfilled
                ? "#06ffa5"
                : taken > 0 ? "#f59e0b"
                : item.isAvailable ? "var(--neutral-500)"
                : "var(--neutral-600)";
              const statusLabel = isFulfilled ? "Completado" : taken > 0 ? "Parcial" : item.isAvailable ? "Disponible" : "No disponible";
              const isDeleting = deletingId === item.id;
              const isToggling = togglingId === item.id;

              return (
                <div key={item.id} className="pm-card" style={{ padding: "18px 20px", opacity: isDeleting ? 0.4 : 1, transition: "opacity 0.2s" }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    {/* Thumbnail */}
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{ width: "56px", height: "56px", borderRadius: "var(--radius-md)", objectFit: "cover", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: "56px", height: "56px", borderRadius: "var(--radius-md)",
                        background: "rgba(255,51,102,0.10)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Gift size={22} style={{ color: "var(--brand-primary)" }} />
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{item.title}</div>
                        <span style={{
                          fontSize: "0.72rem", fontWeight: 700,
                          color: statusColor,
                          background: `${statusColor}18`,
                          padding: "2px 9px", borderRadius: "999px",
                          border: `1px solid ${statusColor}30`,
                        }}>
                          {statusLabel}
                        </span>
                      </div>
                      {item.description && (
                        <div style={{ fontSize: "0.8rem", color: "var(--neutral-500)", marginTop: "4px" }}>
                          {item.description}
                        </div>
                      )}
                      {item.price && item.price > 0 && (
                        <div style={{ marginTop: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--neutral-500)" }}>
                              {taken}/{wanted} · €{(item.price / 100).toFixed(0)} por unidad
                            </span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: statusColor }}>{percent}%</span>
                          </div>
                          <div style={{ background: "rgba(0,0,0,0.06)", borderRadius: "999px", height: "5px" }}>
                            <div style={{
                              background: "var(--gradient-brand)",
                              borderRadius: "999px", height: "100%",
                              width: `${percent}%`,
                              transition: "width 0.5s ease",
                            }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0, alignItems: "center" }}>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver producto"
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: "30px", height: "30px", borderRadius: "var(--radius-sm)",
                            color: "var(--neutral-500)", textDecoration: "none",
                            border: "1px solid rgba(0,0,0,0.07)",
                          }}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        disabled={isToggling || isFulfilled}
                        title={item.isAvailable ? "Marcar no disponible" : "Marcar disponible"}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: "30px", height: "30px", borderRadius: "var(--radius-sm)",
                          color: item.isAvailable ? "#06ffa5" : "var(--neutral-600)",
                          background: "none", border: "1px solid rgba(0,0,0,0.07)",
                          cursor: isFulfilled ? "not-allowed" : "pointer",
                          opacity: isFulfilled ? 0.4 : 1,
                        }}
                      >
                        {isToggling
                          ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
                          : item.isAvailable ? <ToggleRight size={15} /> : <ToggleLeft size={15} />
                        }
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        title="Editar"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: "30px", height: "30px", borderRadius: "var(--radius-sm)",
                          color: "var(--neutral-500)", background: "none",
                          border: "1px solid rgba(0,0,0,0.07)", cursor: "pointer",
                        }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={isDeleting}
                        title="Eliminar"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: "30px", height: "30px", borderRadius: "var(--radius-sm)",
                          color: isDeleting ? "var(--neutral-600)" : "#ff3366",
                          background: "none", border: "1px solid rgba(255,51,102,0.2)",
                          cursor: isDeleting ? "not-allowed" : "pointer",
                        }}
                      >
                        {isDeleting
                          ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
                          : <Trash2 size={13} />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px",
          }}
        >
          <div style={{
            background: "var(--surface-card)",
            borderRadius: "var(--radius-xl)",
            padding: "28px",
            width: "100%", maxWidth: "480px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
          }}>
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {editingItem ? "Editar regalo" : "Añadir regalo"}
              </h2>
              <button
                onClick={closeModal}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neutral-500)", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Title */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--neutral-400)", marginBottom: "6px" }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="ej. AirPods Pro"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  style={{ width: "100%" }}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--neutral-400)", marginBottom: "6px" }}>
                  Descripción
                </label>
                <textarea
                  className="input"
                  placeholder="Detalles, talla, color..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              {/* Price + Quantity */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--neutral-400)", marginBottom: "6px" }}>
                    Precio (€)
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--neutral-400)", marginBottom: "6px" }}>
                    Unidades deseadas
                  </label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={form.quantityWanted}
                    onChange={(e) => setForm((f) => ({ ...f, quantityWanted: e.target.value }))}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* URL */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--neutral-400)", marginBottom: "6px" }}>
                  Enlace al producto
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://amazon.es/..."
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Image URL */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--neutral-400)", marginBottom: "6px" }}>
                  URL de imagen
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Error */}
              {error && (
                <p style={{ color: "#ff3366", fontSize: "0.82rem", margin: 0 }}>{error}</p>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button onClick={closeModal} className="btn btn--ghost" disabled={saving}>
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn--primary"
                  disabled={saving}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", minWidth: "110px", justifyContent: "center" }}
                >
                  {saving
                    ? <><Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Guardando…</>
                    : editingItem ? "Guardar cambios" : "Añadir regalo"
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Search modal */}
      {showSearch && (
        <GiftSearchModal
          onClose={() => setShowSearch(false)}
          onSelect={(item) => {
            setShowSearch(false);
            openFromSearch(item);
          }}
        />
      )}
    </>
  );
}
