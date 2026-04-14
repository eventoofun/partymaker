"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Save, Calendar, MapPin, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { use } from "react";

const schema = z.object({
  celebrantName: z.string().min(2, "Nombre requerido (mínimo 2 caracteres)"),
  celebrantAge: z.coerce.number().int().min(0).max(120).optional().or(z.literal("")),
  type: z.enum(["birthday","wedding","graduation","bachelor","communion","baptism","christmas","corporate","other"]),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  venue: z.string().optional(),
  venueAddress: z.string().optional(),
  description: z.string().optional(),
  isPublic: z.boolean(),
  allowRsvp: z.boolean(),
  allowGifts: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const EVENT_TYPES = [
  { value: "birthday",   label: "Cumpleaños", emoji: "🎂" },
  { value: "wedding",    label: "Boda",        emoji: "💍" },
  { value: "graduation", label: "Graduación",  emoji: "🎓" },
  { value: "bachelor",   label: "Despedida",   emoji: "🥂" },
  { value: "communion",  label: "Comunión",    emoji: "✝️" },
  { value: "baptism",    label: "Bautizo",     emoji: "👶" },
  { value: "christmas",  label: "Navidad",     emoji: "🎄" },
  { value: "corporate",  label: "Empresa",     emoji: "🏢" },
  { value: "other",      label: "Otro",        emoji: "🎉" },
];

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditarEventoPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "birthday",
      isPublic: true,
      allowRsvp: true,
      allowGifts: true,
    },
  });

  const selectedType = watch("type");
  const isPublic = watch("isPublic");
  const allowRsvp = watch("allowRsvp");
  const allowGifts = watch("allowGifts");

  // Fetch current event data
  useEffect(() => {
    fetch(`/api/eventos/data/${id}`)
      .then(r => r.json())
      .then(data => {
        reset({
          celebrantName: data.celebrantName ?? "",
          celebrantAge: data.celebrantAge ?? "",
          type: data.type ?? "birthday",
          eventDate: data.eventDate ?? "",
          eventTime: data.eventTime ?? "",
          venue: data.venue ?? "",
          venueAddress: data.venueAddress ?? "",
          description: data.description ?? "",
          isPublic: data.isPublic ?? true,
          allowRsvp: data.allowRsvp ?? true,
          allowGifts: data.allowGifts ?? true,
        });
      })
      .catch(() => toast.error("Error al cargar el evento"))
      .finally(() => setFetching(false));
  }, [id, reset]);

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      const res = await fetch(`/api/eventos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          celebrantAge: data.celebrantAge === "" ? null : Number(data.celebrantAge),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("¡Cambios guardados!");
      router.push(`/dashboard/eventos/${id}`);
    } catch {
      toast.error("Error al guardar los cambios");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/eventos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Evento eliminado");
      router.push("/dashboard");
    } catch {
      toast.error("Error al eliminar el evento");
    } finally {
      setDeleting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: "var(--radius-md)",
    padding: "12px 16px",
    color: "#1C1C1E",
    fontSize: "0.95rem",
    outline: "none",
    fontFamily: "var(--font-body)",
    boxSizing: "border-box",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "8px",
    fontWeight: 600,
    fontSize: "0.8rem",
    color: "var(--neutral-400)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    borderRadius: "var(--radius-md)",
    border: `1px solid ${active ? "rgba(6,255,165,0.3)" : "rgba(0,0,0,0.08)"}`,
    background: active ? "rgba(6,255,165,0.08)" : "#F2F2F7",
    color: active ? "#06ffa5" : "var(--neutral-500)",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 600,
    transition: "all 0.2s",
    fontFamily: "inherit",
  });

  if (fetching) {
    return (
      <div style={{ maxWidth: "680px", padding: "60px 0", textAlign: "center", color: "var(--neutral-500)" }}>
        Cargando...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "680px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <Link href={`/dashboard/eventos/${id}`} style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "36px", height: "36px",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgba(0,0,0,0.10)",
          color: "var(--neutral-400)",
          textDecoration: "none",
          flexShrink: 0,
        }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "2px" }}>Editar evento</h1>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.85rem" }}>Modifica los datos de tu celebración</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

          {/* Event type */}
          <div>
            <label style={labelStyle}>Tipo de celebración</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setValue("type", t.value as FormValues["type"])}
                  style={{
                    padding: "14px 8px",
                    borderRadius: "var(--radius-md)",
                    border: selectedType === t.value
                      ? "2px solid var(--brand-primary)"
                      : "1px solid rgba(0,0,0,0.09)",
                    background: selectedType === t.value
                      ? "rgba(0,194,209,0.08)"
                      : "#FFFFFF",
                    color: "#1C1C1E",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    fontWeight: selectedType === t.value ? 700 : 400,
                    transition: "all 0.2s",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "5px",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name + Age */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Nombre del festejado/a *</label>
              <input {...register("celebrantName")} placeholder="ej. Lucía" style={inputStyle} />
              {errors.celebrantName && (
                <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "5px" }}>{errors.celebrantName.message}</p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Edad</label>
              <input {...register("celebrantAge")} type="number" min={0} max={120} placeholder="ej. 7" style={inputStyle} />
            </div>
          </div>

          {/* Date + Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={labelStyle}>
                <Calendar size={11} style={{ display: "inline", marginRight: "4px" }} />
                Fecha del evento
              </label>
              <input {...register("eventDate")} type="date" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Hora</label>
              <input {...register("eventTime")} type="time" style={inputStyle} />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label style={labelStyle}>
              <MapPin size={11} style={{ display: "inline", marginRight: "4px" }} />
              Nombre del lugar
            </label>
            <input {...register("venue")} placeholder="ej. Parque de Atracciones..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Dirección</label>
            <input {...register("venueAddress")} placeholder="Calle, ciudad..." style={inputStyle} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Notas para invitados</label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Información adicional, aparcamiento, código de vestimenta..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Visibility toggles */}
          <div>
            <label style={labelStyle}>Configuración de visibilidad</label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" style={toggleStyle(isPublic)} onClick={() => setValue("isPublic", !isPublic)}>
                {isPublic ? "🌐 Página pública" : "🔒 Privado"}
              </button>
              <button type="button" style={toggleStyle(allowRsvp)} onClick={() => setValue("allowRsvp", !allowRsvp)}>
                {allowRsvp ? "✅ RSVP activo" : "⛔ RSVP desactivado"}
              </button>
              <button type="button" style={toggleStyle(allowGifts)} onClick={() => setValue("allowGifts", !allowGifts)}>
                {allowGifts ? "🎁 Regalos activos" : "⛔ Regalos desactivados"}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              <Save size={16} /> {loading ? "Guardando..." : "Guardar cambios"}
            </button>

            <button
              type="button"
              onClick={() => setShowDelete(true)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--neutral-600)", fontSize: "0.82rem",
                padding: "8px", fontFamily: "inherit",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--neutral-600)")}
            >
              <Trash2 size={14} /> Eliminar evento
            </button>
          </div>
        </div>
      </form>

      {/* Delete confirmation modal */}
      {showDelete && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px",
        }}>
          <div style={{
            background: "var(--surface-card)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "var(--radius-xl)",
            padding: "32px",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
          }}>
            <AlertTriangle size={36} style={{ color: "#ef4444", marginBottom: "16px" }} />
            <h3 style={{ marginBottom: "10px", fontSize: "1.15rem" }}>¿Eliminar esta celebración?</h3>
            <p style={{ color: "var(--neutral-400)", fontSize: "0.88rem", marginBottom: "24px" }}>
              Se eliminarán también todos los regalos, invitados e invitaciones de vídeo asociados. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={() => setShowDelete(false)}
                className="btn btn--ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "10px 20px", borderRadius: "var(--radius-md)",
                  background: "#ef4444", border: "none",
                  color: "white", cursor: deleting ? "not-allowed" : "pointer",
                  fontWeight: 600, fontSize: "0.9rem",
                  opacity: deleting ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                <Trash2 size={15} /> {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
