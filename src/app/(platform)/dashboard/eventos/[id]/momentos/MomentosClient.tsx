"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Heart, Sparkles, Trash2, ExternalLink, Camera, Package, EyeOff, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Photo {
  id: string;
  url: string;
  guestName: string | null;
  guestEmail: string | null;
  caption: string | null;
  likes: number;
  status: "pending" | "approved" | "rejected";
  usedForProduct: boolean;
  createdAt: string;
}

interface Props {
  eventId: string;
  eventSlug: string;
  celebrantName: string;
  initialPhotos: Photo[];
}

const STATUS_CONFIG = {
  pending:  { label: "En revisión",  color: "#FFB300", bg: "rgba(255,176,0,0.1)",  icon: Clock },
  approved: { label: "Aprobada",     color: "#10B981", bg: "rgba(16,185,129,0.1)", icon: CheckCircle2 },
  rejected: { label: "Rechazada",    color: "#ef4444", bg: "rgba(239,68,68,0.1)",  icon: XCircle },
};

const FILTERS = ["all", "pending", "approved", "rejected"] as const;
type Filter = typeof FILTERS[number];

export default function MomentosClient({ eventId, eventSlug, celebrantName, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [filter, setFilter] = useState<Filter>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const filtered = photos.filter((p) => filter === "all" || p.status === filter);
  const counts = {
    all:      photos.length,
    pending:  photos.filter((p) => p.status === "pending").length,
    approved: photos.filter((p) => p.status === "approved").length,
    rejected: photos.filter((p) => p.status === "rejected").length,
  };

  async function setStatus(photoId: string, status: Photo["status"]) {
    setLoadingId(photoId);
    const res = await fetch(`/api/eventos/${eventId}/momentos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const { photo } = await res.json();
      setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, status: photo.status } : p));
    }
    setLoadingId(null);
  }

  async function toggleUsedForProduct(photoId: string, current: boolean) {
    setLoadingId(photoId);
    const res = await fetch(`/api/eventos/${eventId}/momentos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usedForProduct: !current }),
    });
    if (res.ok) {
      const { photo } = await res.json();
      setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, usedForProduct: photo.usedForProduct } : p));
    }
    setLoadingId(null);
  }

  async function approveAll() {
    const pending = photos.filter((p) => p.status === "pending");
    if (pending.length === 0) return;
    setBulkLoading(true);
    await Promise.all(
      pending.map((p) =>
        fetch(`/api/eventos/${eventId}/momentos/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "approved" }),
        })
      )
    );
    setPhotos((prev) => prev.map((p) => p.status === "pending" ? { ...p, status: "approved" } : p));
    setBulkLoading(false);
  }

  async function deletePhoto(photoId: string) {
    if (!confirm("¿Eliminar esta foto permanentemente?")) return;
    setLoadingId(photoId);
    const res = await fetch(`/api/eventos/${eventId}/momentos/${photoId}`, { method: "DELETE" });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      if (selectedId === photoId) setSelectedId(null);
    }
    setLoadingId(null);
  }

  const selectedPhoto = photos.find((p) => p.id === selectedId);

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <Link
          href={`/dashboard/eventos/${eventId}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            fontSize: "0.8rem", color: "var(--neutral-500)", textDecoration: "none",
            marginBottom: "16px",
          }}
        >
          <ArrowLeft size={14} /> Volver al evento
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(0,194,209,0.15), rgba(131,56,236,0.15))",
                border: "1px solid rgba(0,194,209,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Camera size={17} style={{ color: "#00C2D1" }} />
              </div>
              <h1 style={{ fontSize: "var(--text-xl)", margin: 0 }}>Momentos Épicos</h1>
            </div>
            <p style={{ color: "var(--neutral-500)", fontSize: "0.85rem", margin: 0 }}>
              Fotos subidas por los invitados de {celebrantName} · Modera y selecciona las mejores
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {counts.pending > 0 && (
              <button
                onClick={approveAll}
                disabled={bulkLoading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "8px 14px", borderRadius: "10px", border: "none", cursor: "pointer",
                  background: "rgba(16,185,129,0.12)", color: "#10B981",
                  fontWeight: 700, fontSize: "0.82rem",
                  opacity: bulkLoading ? 0.6 : 1,
                }}
              >
                <CheckCheck size={14} />
                {bulkLoading ? "Aprobando..." : `Aprobar todas (${counts.pending})`}
              </button>
            )}
            <a
              href={`/e/${eventSlug}#momentos`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost"
              style={{ textDecoration: "none", fontSize: "0.82rem", padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <ExternalLink size={13} /> Ver en página pública
            </a>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
        {([
          { label: "Total fotos",  value: counts.all,      color: "var(--neutral-400)" },
          { label: "En revisión",  value: counts.pending,  color: "#FFB300" },
          { label: "Aprobadas",    value: counts.approved, color: "#10B981" },
          { label: "Rechazadas",   value: counts.rejected, color: "#ef4444" },
        ] as const).map((s) => (
          <div key={s.label} className="pm-card" style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--neutral-500)", marginTop: "2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px", borderRadius: "999px", border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: "0.8rem",
              background: filter === f
                ? f === "all" ? "rgba(255,255,255,0.1)"
                  : STATUS_CONFIG[f as Exclude<Filter, "all">]?.bg
                : "rgba(255,255,255,0.04)",
              color: filter === f
                ? f === "all" ? "white"
                  : STATUS_CONFIG[f as Exclude<Filter, "all">]?.color
                : "var(--neutral-500)",
              transition: "all 0.18s",
            }}
          >
            {f === "all" ? "Todas" : STATUS_CONFIG[f as Exclude<Filter, "all">]?.label}
            {" "}({counts[f]})
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="pm-card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--neutral-500)" }}>
          <Camera size={32} style={{ marginBottom: "12px", opacity: 0.4 }} />
          <div style={{ fontWeight: 600, marginBottom: "6px" }}>
            {photos.length === 0 ? "Aún no hay fotos" : "No hay fotos en esta categoría"}
          </div>
          <div style={{ fontSize: "0.82rem" }}>
            {photos.length === 0
              ? "Los invitados pueden subir fotos desde la página pública del evento."
              : "Cambia el filtro para ver otras fotos."}
          </div>
        </div>
      )}

      {/* Two-panel layout when a photo is selected */}
      <div style={{ display: "grid", gridTemplateColumns: selectedPhoto ? "1fr 320px" : "1fr", gap: "16px" }}>
        {/* Photo grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
          <AnimatePresence>
            {filtered.map((photo) => {
              const cfg = STATUS_CONFIG[photo.status];
              const StatusIcon = cfg.icon;
              const isLoading = loadingId === photo.id;
              const isSelected = selectedId === photo.id;

              return (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setSelectedId(isSelected ? null : photo.id)}
                  style={{
                    borderRadius: "14px", overflow: "hidden", position: "relative", cursor: "pointer",
                    aspectRatio: "1/1",
                    border: isSelected ? `2px solid #00C2D1` : "2px solid rgba(255,255,255,0.06)",
                    transition: "border-color 0.18s",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={`Foto de ${photo.guestName ?? "invitado"}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />

                  {/* Overlay gradient */}
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 45%)",
                  }} />

                  {/* Status badge */}
                  <div style={{
                    position: "absolute", top: "8px", left: "8px",
                    display: "flex", alignItems: "center", gap: "4px",
                    background: cfg.bg, border: `1px solid ${cfg.color}40`,
                    borderRadius: "999px", padding: "3px 8px",
                    fontSize: "0.62rem", color: cfg.color, fontWeight: 700,
                    backdropFilter: "blur(8px)",
                  }}>
                    <StatusIcon size={9} /> {cfg.label}
                  </div>

                  {/* Used for product badge */}
                  {photo.usedForProduct && (
                    <div style={{
                      position: "absolute", top: "8px", right: "8px",
                      background: "rgba(131,56,236,0.85)", borderRadius: "999px",
                      padding: "3px 7px", fontSize: "0.6rem", color: "white", fontWeight: 700,
                    }}>
                      🧞 Seleccionada
                    </div>
                  )}

                  {/* Bottom info */}
                  <div style={{ position: "absolute", bottom: "8px", left: "8px", right: "8px" }}>
                    {photo.guestName && (
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.9)", fontWeight: 600, marginBottom: "4px" }}>
                        {photo.guestName}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.65)" }}>
                        ❤️ {photo.likes}
                      </span>
                      <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.45)" }}>
                        {new Date(photo.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              style={{
                position: "sticky", top: "24px", alignSelf: "start",
                background: "var(--surface-card)", borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              {/* Photo preview */}
              <div style={{ aspectRatio: "1/1", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhoto.url}
                  alt="Foto seleccionada"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              <div style={{ padding: "16px" }}>
                {/* Meta */}
                <div style={{ marginBottom: "16px" }}>
                  {selectedPhoto.guestName && (
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "2px" }}>
                      {selectedPhoto.guestName}
                    </div>
                  )}
                  {selectedPhoto.guestEmail && (
                    <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)" }}>{selectedPhoto.guestEmail}</div>
                  )}
                  {selectedPhoto.caption && (
                    <div style={{ fontSize: "0.8rem", color: "var(--neutral-400)", marginTop: "8px", fontStyle: "italic" }}>
                      "{selectedPhoto.caption}"
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "12px", marginTop: "10px", fontSize: "0.75rem", color: "var(--neutral-500)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Heart size={12} style={{ color: "#ef4444" }} /> {selectedPhoto.likes} me gusta
                    </span>
                    <span>
                      {new Date(selectedPhoto.createdAt).toLocaleDateString("es-ES", {
                        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Moderation actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--neutral-600)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
                    Visibilidad en el muro
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <button
                      onClick={() => setStatus(selectedPhoto.id, "approved")}
                      disabled={selectedPhoto.status === "approved" || loadingId === selectedPhoto.id}
                      style={{
                        padding: "8px", borderRadius: "10px", border: "none", cursor: "pointer",
                        background: selectedPhoto.status === "approved" ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.08)",
                        color: "#10B981", fontWeight: 600, fontSize: "0.78rem",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                        opacity: selectedPhoto.status === "approved" ? 0.5 : 1,
                      }}
                    >
                      <CheckCircle2 size={13} /> Visible
                    </button>
                    <button
                      onClick={() => setStatus(selectedPhoto.id, "rejected")}
                      disabled={selectedPhoto.status === "rejected" || loadingId === selectedPhoto.id}
                      style={{
                        padding: "8px", borderRadius: "10px", border: "none", cursor: "pointer",
                        background: selectedPhoto.status === "rejected" ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.08)",
                        color: "#ef4444", fontWeight: 600, fontSize: "0.78rem",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                        opacity: selectedPhoto.status === "rejected" ? 0.5 : 1,
                      }}
                    >
                      <EyeOff size={13} /> Ocultar
                    </button>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "var(--neutral-600)", margin: 0, lineHeight: 1.4 }}>
                    {selectedPhoto.status === "rejected"
                      ? "Oculta — no visible en el muro público."
                      : selectedPhoto.status === "approved"
                      ? "Visible — aprobada y sin badge de revisión."
                      : "En revisión — visible en el muro con badge amarillo."}
                  </p>
                  {selectedPhoto.status !== "pending" && (
                    <button
                      onClick={() => setStatus(selectedPhoto.id, "pending")}
                      disabled={loadingId === selectedPhoto.id}
                      style={{
                        padding: "7px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)",
                        cursor: "pointer", background: "transparent",
                        color: "var(--neutral-500)", fontWeight: 500, fontSize: "0.75rem",
                      }}
                    >
                      <Clock size={11} style={{ marginRight: "4px" }} /> Marcar como en revisión
                    </button>
                  )}
                </div>

                {/* Product selection */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px", marginBottom: "12px" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--neutral-600)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                    🧞 El Genio — Crear producto
                  </div>
                  <button
                    onClick={() => toggleUsedForProduct(selectedPhoto.id, selectedPhoto.usedForProduct)}
                    disabled={loadingId === selectedPhoto.id}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "10px", cursor: "pointer",
                      background: selectedPhoto.usedForProduct
                        ? "linear-gradient(135deg, rgba(131,56,236,0.3), rgba(255,51,102,0.2))"
                        : "linear-gradient(135deg, rgba(131,56,236,0.1), rgba(255,51,102,0.08))",
                      color: selectedPhoto.usedForProduct ? "white" : "var(--neutral-400)",
                      fontWeight: 700, fontSize: "0.82rem",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      border: `1px solid ${selectedPhoto.usedForProduct ? "rgba(131,56,236,0.4)" : "rgba(131,56,236,0.15)"}`,
                      marginBottom: selectedPhoto.usedForProduct ? "8px" : 0,
                    }}
                  >
                    {selectedPhoto.usedForProduct ? (
                      <><Package size={14} /> Seleccionada para Tienda ✓</>
                    ) : (
                      <><Sparkles size={14} /> Usar para crear producto</>
                    )}
                  </button>
                  {selectedPhoto.usedForProduct && (
                    <Link
                      href={`/dashboard/eventos/${eventId}/tienda`}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                        width: "100%", padding: "9px", borderRadius: "10px", textDecoration: "none",
                        background: "rgba(131,56,236,0.12)", border: "1px solid rgba(131,56,236,0.25)",
                        color: "#a78bfa", fontWeight: 700, fontSize: "0.8rem",
                      }}
                    >
                      <ExternalLink size={13} /> Ir a Tienda y crear producto →
                    </Link>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => deletePhoto(selectedPhoto.id)}
                  disabled={loadingId === selectedPhoto.id}
                  style={{
                    width: "100%", padding: "8px", borderRadius: "10px",
                    border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer",
                    background: "rgba(239,68,68,0.06)", color: "#ef4444",
                    fontWeight: 600, fontSize: "0.75rem",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                  }}
                >
                  <Trash2 size={12} /> Eliminar foto
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info banner */}
      {photos.filter((p) => p.usedForProduct).length > 0 && (
        <div style={{
          marginTop: "24px",
          padding: "16px 20px",
          background: "linear-gradient(135deg, rgba(131,56,236,0.08), rgba(255,51,102,0.06))",
          border: "1px solid rgba(131,56,236,0.2)",
          borderRadius: "14px",
          display: "flex", alignItems: "center", gap: "14px",
        }}>
          <span style={{ fontSize: "1.5rem" }}>🧞</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "3px" }}>
              {photos.filter((p) => p.usedForProduct).length} foto{photos.filter((p) => p.usedForProduct).length !== 1 ? "s" : ""} seleccionada{photos.filter((p) => p.usedForProduct).length !== 1 ? "s" : ""} para El Genio
            </div>
            <div style={{ fontSize: "0.77rem", color: "var(--neutral-500)" }}>
              Pronto podrás convertirlas en camisetas, pósters, figuras 3D y más desde la Tienda del evento.
            </div>
          </div>
          <Link
            href={`/dashboard/eventos/${eventId}/tienda`}
            style={{
              flexShrink: 0, padding: "8px 16px", borderRadius: "10px", textDecoration: "none",
              background: "rgba(131,56,236,0.15)", border: "1px solid rgba(131,56,236,0.3)",
              color: "white", fontWeight: 600, fontSize: "0.8rem", whiteSpace: "nowrap",
            }}
          >
            Ir a Tienda →
          </Link>
        </div>
      )}
    </div>
  );
}
