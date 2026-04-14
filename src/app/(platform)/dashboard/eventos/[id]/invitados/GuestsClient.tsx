"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Mail, Phone, UserCheck, UserX, Clock, Copy, LogIn } from "lucide-react";
import type { Guest } from "@/db/schema";

const STATUS_LABEL: Record<string, { label: string; color: string; icon: typeof UserCheck }> = {
  confirmed:   { label: "Asiste",    color: "#06ffa5", icon: UserCheck },
  declined:    { label: "No asiste", color: "#ef4444", icon: UserX },
  pending:     { label: "Pendiente", color: "#f59e0b", icon: Clock },
  invited:     { label: "Invitado",  color: "#8338ec", icon: Clock },
  checked_in:  { label: "Check-in",  color: "#3b82f6", icon: LogIn },
};

interface Props {
  eventId: string;
  initialGuests: Guest[];
  slug: string;
}

export default function GuestsClient({ eventId, initialGuests, slug }: Props) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const rsvpUrl = (token: string) =>
    `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/rsvp/${token}`;

  async function handleAdd() {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ...form }),
      });
      if (!res.ok) throw new Error();
      const { guest } = await res.json();
      setGuests((prev) => [guest, ...prev]);
      setForm({ name: "", email: "", phone: "", notes: "" });
      setShowForm(false);
      toast.success("Invitado añadido");
    } catch {
      toast.error("Error al añadir invitado");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/guests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setGuests((prev) => prev.filter((g) => g.id !== id));
      toast.success("Invitado eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  function copyInviteLink(guest: Guest) {
    if (!guest.inviteToken) return;
    navigator.clipboard.writeText(rsvpUrl(guest.inviteToken));
    setCopiedId(guest.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#1C1C1E",
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "5px",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--neutral-400)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div>
      {/* Add button */}
      {!showForm && (
        <button className="btn btn--primary" onClick={() => setShowForm(true)} style={{ marginBottom: "20px" }}>
          <Plus size={18} /> Añadir invitado
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", padding: "24px", marginBottom: "20px", border: "1px solid rgba(0,0,0,0.08)" }}>
          <h3 style={{ marginBottom: "20px", fontSize: "0.95rem", fontWeight: 700 }}>Nuevo invitado</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Nombre *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ana Martínez" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" placeholder="ana@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+34 600 000 000" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Notas</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Padrino de la novia, mesa 3..." style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
            <button className="btn btn--primary" onClick={handleAdd} disabled={saving}>
              {saving ? "Guardando..." : "Añadir"}
            </button>
            <button className="btn btn--ghost" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Guests list */}
      {guests.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 40px", background: "var(--surface-card)", borderRadius: "var(--radius-xl)", border: "2px dashed rgba(0,0,0,0.10)" }}>
          <p style={{ color: "var(--neutral-400)" }}>Aún no has añadido invitados.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {guests.map((guest) => {
            const statusInfo = STATUS_LABEL[guest.status] ?? STATUS_LABEL.pending;
            const StatusIcon = statusInfo.icon;
            return (
              <div key={guest.id} className="pm-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.93rem" }}>{guest.name}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: statusInfo.color, fontWeight: 600 }}>
                      <StatusIcon size={11} /> {statusInfo.label}
                    </span>
                  </div>
                  {guest.email && (
                    <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)", marginTop: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Mail size={11} /> {guest.email}
                    </div>
                  )}
                  {guest.phone && (
                    <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Phone size={11} /> {guest.phone}
                    </div>
                  )}
                  {guest.notes && (
                    <div style={{ fontSize: "0.75rem", color: "var(--neutral-600)", marginTop: "2px" }}>
                      {guest.notes}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => copyInviteLink(guest)}
                  title="Copiar link de invitación"
                  style={{ background: "none", border: "none", cursor: "pointer", color: copiedId === guest.id ? "#06ffa5" : "var(--neutral-600)", padding: "4px", transition: "color 0.2s" }}
                >
                  <Copy size={15} />
                </button>
                <button
                  onClick={() => handleDelete(guest.id)}
                  disabled={deletingId === guest.id}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neutral-600)", padding: "4px", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--neutral-600)")}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
