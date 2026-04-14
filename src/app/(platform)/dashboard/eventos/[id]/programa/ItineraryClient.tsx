"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Clock, X, GripVertical } from "lucide-react";

type ItemType = "ceremony"|"reception"|"dinner"|"dance"|"speech"|"cake"|"games"|"photo"|"transport"|"other";

interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  description: string | null;
  type: ItemType;
  icon: string | null;
  sortOrder: number;
}

interface Props {
  eventId: string;
  initialItems: ItineraryItem[];
}

const TYPE_OPTIONS: { value: ItemType; label: string; emoji: string }[] = [
  { value: "ceremony",   label: "Ceremonia",   emoji: "💒" },
  { value: "reception",  label: "Recepción",   emoji: "🥂" },
  { value: "dinner",     label: "Cena",        emoji: "🍽️" },
  { value: "dance",      label: "Baile",       emoji: "💃" },
  { value: "speech",     label: "Discurso",    emoji: "🎤" },
  { value: "cake",       label: "Tarta",       emoji: "🎂" },
  { value: "games",      label: "Juegos",      emoji: "🎮" },
  { value: "photo",      label: "Fotos",       emoji: "📸" },
  { value: "transport",  label: "Transporte",  emoji: "🚌" },
  { value: "other",      label: "Otro",        emoji: "⭐" },
];

const EMPTY_FORM = { time: "", title: "", description: "", type: "other" as ItemType, icon: "" };

export default function ItineraryClient({ eventId, initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<ItineraryItem[]>(initialItems);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ItineraryItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEdit(item: ItineraryItem) {
    setEditing(item);
    setForm({
      time:        item.time,
      title:       item.title,
      description: item.description ?? "",
      type:        item.type,
      icon:        item.icon ?? "",
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
    if (!form.time.trim() || !form.title.trim()) {
      setError("La hora y el título son obligatorios.");
      return;
    }
    setError("");

    const url = editing
      ? `/api/eventos/${eventId}/itinerary/${editing.id}`
      : `/api/eventos/${eventId}/itinerary`;
    const method = editing ? "PATCH" : "POST";

    startTransition(async () => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time:        form.time.trim(),
          title:       form.title.trim(),
          description: form.description.trim() || null,
          type:        form.type,
          icon:        form.icon.trim() || null,
          sortOrder:   editing ? editing.sortOrder : items.length,
        }),
      });

      if (!res.ok) {
        setError("Error al guardar. Inténtalo de nuevo.");
        return;
      }

      const saved: ItineraryItem = await res.json();
      setItems((prev) =>
        editing
          ? prev.map((i) => (i.id === saved.id ? saved : i))
          : [...prev, saved]
      );
      closeModal();
      router.refresh();
    });
  }

  async function handleDelete(item: ItineraryItem) {
    setDeletingId(item.id);
    const res = await fetch(`/api/eventos/${eventId}/itinerary/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      router.refresh();
    }
    setDeletingId(null);
  }

  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.time.localeCompare(b.time));
  const typeMap = Object.fromEntries(TYPE_OPTIONS.map((t) => [t.value, t]));

  return (
    <>
      {/* Add button */}
      <button
        onClick={openAdd}
        className="btn btn--primary"
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
      >
        <Plus size={15} /> Añadir momento
      </button>

      {/* Empty state */}
      {sorted.length === 0 ? (
        <div className="pm-card" style={{ padding: "64px 32px", textAlign: "center", marginTop: "24px" }}>
          <Clock size={48} style={{ color: "var(--neutral-600)", margin: "0 auto 20px" }} />
          <h2 style={{ fontSize: "1.1rem", marginBottom: "10px" }}>Sin programa todavía</h2>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.88rem", maxWidth: "360px", margin: "0 auto 24px", lineHeight: 1.6 }}>
            Añade los momentos de tu celebración. Tus invitados podrán verlo en la página del evento.
          </p>
          <button
            onClick={openAdd}
            className="btn btn--primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Añadir primer momento
          </button>
        </div>
      ) : (
        <div style={{ marginTop: "24px", position: "relative" }}>
          {/* Timeline line */}
          <div style={{
            position: "absolute",
            left: "28px",
            top: "24px",
            bottom: "24px",
            width: "2px",
            background: "rgba(255,51,102,0.15)",
            zIndex: 0,
          }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {sorted.map((item) => {
              const t = typeMap[item.type];
              const emoji = item.icon || t?.emoji || "⭐";
              return (
                <div key={item.id} className="pm-card" style={{
                  padding: "16px 18px 16px 64px",
                  position: "relative",
                  zIndex: 1,
                }}>
                  {/* Timeline dot */}
                  <div style={{
                    position: "absolute",
                    left: "18px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "20px", height: "20px",
                    borderRadius: "50%",
                    background: "var(--surface-card)",
                    border: "2px solid rgba(255,51,102,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px",
                    zIndex: 2,
                  }}>
                    {emoji}
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--brand-primary)", fontFamily: "monospace" }}>
                          {item.time}
                        </span>
                        <span style={{
                          fontSize: "0.68rem", fontWeight: 600,
                          color: "var(--neutral-500)",
                          background: "rgba(0,0,0,0.05)",
                          padding: "1px 7px", borderRadius: "999px",
                          border: "1px solid rgba(0,0,0,0.08)",
                        }}>
                          {t?.label ?? item.type}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "0.92rem", marginTop: "3px" }}>{item.title}</div>
                      {item.description && (
                        <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)", marginTop: "3px", lineHeight: 1.5 }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button
                        onClick={() => openEdit(item)}
                        style={{
                          background: "transparent", border: "none", cursor: "pointer",
                          padding: "6px", borderRadius: "var(--radius-sm)",
                          color: "var(--neutral-500)",
                          display: "flex", alignItems: "center",
                        }}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        style={{
                          background: "transparent", border: "none", cursor: "pointer",
                          padding: "6px", borderRadius: "var(--radius-sm)",
                          color: deletingId === item.id ? "var(--neutral-600)" : "var(--neutral-500)",
                          display: "flex", alignItems: "center",
                        }}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px",
        }} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={{
            background: "var(--surface-card)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid rgba(0,0,0,0.08)",
            padding: "28px",
            width: "100%",
            maxWidth: "480px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                {editing ? "Editar momento" : "Nuevo momento"}
              </h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neutral-500)" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Time + Icon row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--neutral-400)", display: "block", marginBottom: "6px" }}>
                    Hora *
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="pm-input"
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", color: "var(--neutral-400)", display: "block", marginBottom: "6px" }}>
                    Emoji (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="🎂"
                    value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    className="pm-input"
                    style={{ width: "100%" }}
                    maxLength={4}
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--neutral-400)", display: "block", marginBottom: "6px" }}>
                  Título *
                </label>
                <input
                  type="text"
                  placeholder="Apertura de la fiesta"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="pm-input"
                  style={{ width: "100%" }}
                  maxLength={120}
                />
              </div>

              {/* Type */}
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--neutral-400)", display: "block", marginBottom: "6px" }}>
                  Tipo
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                      style={{
                        padding: "8px 4px",
                        borderRadius: "var(--radius-md)",
                        border: `1px solid ${form.type === t.value ? "rgba(255,51,102,0.5)" : "rgba(0,0,0,0.08)"}`,
                        background: form.type === t.value ? "rgba(255,51,102,0.12)" : "#FAFAFA",
                        cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                        fontSize: "0.65rem", color: form.type === t.value ? "#1C1C1E" : "var(--neutral-500)",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: "1.1rem" }}>{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: "0.78rem", color: "var(--neutral-400)", display: "block", marginBottom: "6px" }}>
                  Descripción (opcional)
                </label>
                <textarea
                  placeholder="Detalles del momento..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="pm-input"
                  style={{ width: "100%", minHeight: "80px", resize: "vertical" }}
                  maxLength={500}
                />
              </div>

              {error && (
                <p style={{ color: "var(--brand-primary)", fontSize: "0.82rem" }}>{error}</p>
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
                  {isPending ? "Guardando..." : editing ? "Guardar cambios" : "Añadir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
