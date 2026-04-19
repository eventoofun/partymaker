"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, Mail, Phone, UserCheck, UserX, Clock, Copy, LogIn,
  Upload, Smartphone, X, Check, Users,
} from "lucide-react";
import type { Guest } from "@/db/schema";

// ── Contact Picker API types ────────────────────────────────────────────────
interface ContactInfo {
  name?: string[];
  tel?: string[];
  email?: string[];
}
declare global {
  interface Navigator {
    contacts?: {
      select(props: string[], opts?: { multiple?: boolean }): Promise<ContactInfo[]>;
      getProperties(): Promise<string[]>;
    };
  }
}

// ── vCard parser ─────────────────────────────────────────────────────────────
interface ImportContact {
  name: string;
  email?: string;
  phone?: string;
  selected: boolean;
}

function parseVCard(text: string): ImportContact[] {
  const result: ImportContact[] = [];
  const cards = text.split(/BEGIN:VCARD/i).slice(1);
  for (const card of cards) {
    const fn = card.match(/^FN[;:](.+)$/im)?.[1]?.replace(/\r/g, "").trim();
    if (!fn) continue;
    const tel = card.match(/^TEL[^:]*:(.+)$/im)?.[1]?.replace(/\r/g, "").trim();
    const email = card.match(/^EMAIL[^:]*:(.+)$/im)?.[1]?.replace(/\r/g, "").trim();
    result.push({ name: fn, phone: tel, email, selected: true });
  }
  return result;
}

// ── Status labels ─────────────────────────────────────────────────────────────
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

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importContacts, setImportContacts] = useState<ImportContact[]>([]);
  const [importing, setImporting] = useState(false);
  const vcfInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const rsvpUrl = (token: string) =>
    `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/rsvp/${token}`;

  const hasContactPicker = typeof navigator !== "undefined" && !!navigator.contacts;

  // ── Single add ────────────────────────────────────────────────────────────
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

  // ── Contact Picker API ────────────────────────────────────────────────────
  async function handleContactPicker() {
    try {
      const props = ["name", "tel", "email"];
      const selected = await navigator.contacts!.select(props, { multiple: true });
      if (!selected.length) return;

      const parsed: ImportContact[] = selected
        .map((c) => ({
          name: c.name?.[0]?.trim() ?? "",
          phone: c.tel?.[0]?.trim(),
          email: c.email?.[0]?.trim(),
          selected: true,
        }))
        .filter((c) => c.name.length > 0);

      if (!parsed.length) { toast.error("No se pudieron leer los contactos seleccionados"); return; }
      setImportContacts(parsed);
      setShowImport(true);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("No se pudo acceder a los contactos");
    }
  }

  // ── VCF file import ───────────────────────────────────────────────────────
  function handleVcfFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseVCard(text);
      if (!parsed.length) { toast.error("No se encontraron contactos en el archivo"); return; }
      setImportContacts(parsed);
      setShowImport(true);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  function toggleContact(idx: number) {
    setImportContacts((prev) => prev.map((c, i) => i === idx ? { ...c, selected: !c.selected } : c));
  }

  function toggleAll(val: boolean) {
    setImportContacts((prev) => prev.map((c) => ({ ...c, selected: val })));
  }

  // ── Bulk import ───────────────────────────────────────────────────────────
  async function handleBulkImport() {
    const toAdd = importContacts.filter((c) => c.selected);
    if (!toAdd.length) { toast.error("Selecciona al menos un contacto"); return; }
    setImporting(true);
    try {
      const res = await fetch("/api/guests/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          contacts: toAdd.map(({ name, email, phone }) => ({ name, email, phone })),
        }),
      });
      if (!res.ok) throw new Error();
      const { guests: added } = await res.json() as { guests: Guest[]; count: number };
      setGuests((prev) => [...added, ...prev]);
      setShowImport(false);
      setImportContacts([]);
      toast.success(`${added.length} invitado${added.length !== 1 ? "s" : ""} añadido${added.length !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Error al importar contactos");
    } finally {
      setImporting(false);
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────
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

  const selectedCount = importContacts.filter((c) => c.selected).length;

  return (
    <div>
      {/* Action buttons */}
      {!showForm && !showImport && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              className="btn btn--primary"
              onClick={() => setShowForm(true)}
              style={{ minHeight: "44px" }}
            >
              <Plus size={16} /> Añadir invitado
            </button>

            {/* Android / Contact Picker API */}
            {hasContactPicker && (
              <button
                className="btn btn--ghost"
                onClick={handleContactPicker}
                style={{ minHeight: "44px", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Smartphone size={16} /> Del teléfono
              </button>
            )}

            {/* Universal: .vcf file — works on Android and iPhone */}
            <button
              className="btn btn--ghost"
              onClick={() => vcfInputRef.current?.click()}
              style={{ minHeight: "44px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Upload size={16} /> Importar .vcf
            </button>
          </div>

          {/* iOS / non-Android hint */}
          {!hasContactPicker && (
            <div style={{
              marginTop: "12px", fontSize: "0.78rem", color: "var(--neutral-500)",
              padding: "10px 14px", background: "rgba(131,56,236,0.06)",
              borderRadius: "8px", border: "1px solid rgba(131,56,236,0.15)",
              lineHeight: "1.5",
            }}>
              <strong style={{ color: "var(--neutral-400)" }}>iPhone:</strong> Abre <em>Contactos</em> → toca el contacto → <em>Compartir</em> → <em>Guardar en Archivos</em>. Luego pulsa <strong>Importar .vcf</strong> y selecciona el archivo.<br />
              <strong style={{ color: "var(--neutral-400)" }}>Android:</strong> Usa Chrome para que aparezca el botón <em>Del teléfono</em> (acceso directo sin archivos).
            </div>
          )}

          <input ref={vcfInputRef} type="file" accept=".vcf,text/vcard" style={{ display: "none" }} onChange={handleVcfFile} />
        </div>
      )}

      {/* Single add form */}
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

      {/* Import preview panel */}
      {showImport && (
        <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-xl)", padding: "20px", marginBottom: "20px", border: "1px solid rgba(131,56,236,0.25)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0 }}>
                <Users size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
                {importContacts.length} contacto{importContacts.length !== 1 ? "s" : ""} encontrado{importContacts.length !== 1 ? "s" : ""}
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--neutral-500)", margin: "4px 0 0" }}>
                Selecciona los que quieres añadir como invitados
              </p>
            </div>
            <button onClick={() => { setShowImport(false); setImportContacts([]); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neutral-500)", padding: "4px" }}>
              <X size={18} />
            </button>
          </div>

          {/* Select all / none */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button onClick={() => toggleAll(true)} style={{ background: "none", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "6px", cursor: "pointer", padding: "4px 10px", fontSize: "0.78rem", color: "var(--neutral-400)" }}>
              Todos
            </button>
            <button onClick={() => toggleAll(false)} style={{ background: "none", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "6px", cursor: "pointer", padding: "4px 10px", fontSize: "0.78rem", color: "var(--neutral-400)" }}>
              Ninguno
            </button>
          </div>

          {/* Contact list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "320px", overflowY: "auto", marginBottom: "16px" }}>
            {importContacts.map((c, idx) => (
              <div
                key={idx}
                onClick={() => toggleContact(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 12px", borderRadius: "10px", cursor: "pointer",
                  background: c.selected ? "rgba(131,56,236,0.08)" : "rgba(0,0,0,0.03)",
                  border: `1px solid ${c.selected ? "rgba(131,56,236,0.25)" : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0,
                  border: `2px solid ${c.selected ? "#8338ec" : "rgba(0,0,0,0.2)"}`,
                  background: c.selected ? "#8338ec" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {c.selected && <Check size={12} color="white" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {c.phone && <span><Phone size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {c.phone}</span>}
                    {c.email && <span><Mail size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {c.email}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn btn--primary"
              onClick={handleBulkImport}
              disabled={importing || selectedCount === 0}
            >
              {importing ? "Añadiendo..." : `Añadir ${selectedCount} invitado${selectedCount !== 1 ? "s" : ""}`}
            </button>
            <button className="btn btn--ghost" onClick={() => { setShowImport(false); setImportContacts([]); }}>
              Cancelar
            </button>
            <button className="btn btn--ghost" onClick={() => vcfInputRef.current?.click()} style={{ marginLeft: "auto", fontSize: "0.8rem" }}>
              <Upload size={13} /> Otro archivo
            </button>
          </div>
          <input ref={vcfInputRef} type="file" accept=".vcf,text/vcard" style={{ display: "none" }} onChange={handleVcfFile} />
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
