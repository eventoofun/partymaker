"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Cake, Calendar, MapPin, Users } from "lucide-react";

const schema = z.object({
  celebrantName: z.string().min(2, "Nombre requerido (mínimo 2 caracteres)"),
  celebrantAge: z.coerce.number().int().min(0).max(18).optional(),
  type: z.enum(["cumpleanos", "comunion", "bautizo", "navidad", "graduacion", "otro"]),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  venue: z.string().optional(),
  venueAddress: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const EVENT_TYPES = [
  { value: "cumpleanos", label: "🎂 Cumpleaños" },
  { value: "comunion", label: "✝️ Comunión" },
  { value: "bautizo", label: "👶 Bautizo" },
  { value: "navidad", label: "🎄 Navidad" },
  { value: "graduacion", label: "🎓 Graduación" },
  { value: "otro", label: "🎉 Otro" },
];

export default function NuevoEventoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "cumpleanos" },
  });

  const selectedType = watch("type");

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Error al crear el evento");
      const { eventId } = await res.json();

      toast.success("¡Evento creado!");
      router.push(`/dashboard/eventos/${eventId}/lista-deseos`);
    } catch {
      toast.error("Error al crear el evento. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    background: "var(--surface-elevated)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "var(--radius-md)",
    padding: "12px 16px",
    color: "white",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "var(--font-body)",
  };

  return (
    <div style={{ maxWidth: "680px" }}>
      <div style={{ marginBottom: "40px" }}>
        <h1 style={{ fontSize: "var(--text-3xl)", marginBottom: "8px" }}>Nuevo evento</h1>
        <p style={{ color: "var(--neutral-400)" }}>
          Paso {step} de 2 — {step === 1 ? "Información básica" : "Detalles del evento"}
        </p>
        {/* Progress */}
        <div style={{ marginTop: "16px", height: "4px", background: "var(--surface-elevated)", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{ width: `${(step / 2) * 100}%`, height: "100%", background: "var(--gradient-brand)", transition: "width 0.4s ease", borderRadius: "999px" }} />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Event type */}
            <div>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: 600, color: "var(--neutral-300)" }}>
                Tipo de evento
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setValue("type", t.value as FormValues["type"])}
                    style={{
                      padding: "14px 10px",
                      borderRadius: "var(--radius-md)",
                      border: selectedType === t.value
                        ? "2px solid var(--brand-primary)"
                        : "1px solid rgba(255,255,255,0.1)",
                      background: selectedType === t.value
                        ? "rgba(255,51,102,0.12)"
                        : "var(--surface-elevated)",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: selectedType === t.value ? 600 : 400,
                      transition: "all 0.2s",
                      textAlign: "center",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Celebrant name */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--neutral-300)" }}>
                Nombre del festejado/a *
              </label>
              <input
                {...register("celebrantName")}
                placeholder="ej. Lucía"
                style={inputStyle}
              />
              {errors.celebrantName && (
                <p style={{ color: "var(--color-error)", fontSize: "0.8rem", marginTop: "4px" }}>
                  {errors.celebrantName.message}
                </p>
              )}
            </div>

            {/* Age */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--neutral-300)" }}>
                Edad que cumple
              </label>
              <input
                {...register("celebrantAge")}
                type="number"
                min={0}
                max={18}
                placeholder="ej. 7"
                style={{ ...inputStyle, width: "120px" }}
              />
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn btn--primary"
              style={{ alignSelf: "flex-start" }}
            >
              Siguiente <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Date + Time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--neutral-300)" }}>
                  <Calendar size={14} style={{ display: "inline", marginRight: "6px" }} />
                  Fecha del evento
                </label>
                <input {...register("eventDate")} type="date" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--neutral-300)" }}>
                  Hora
                </label>
                <input {...register("eventTime")} type="time" style={inputStyle} />
              </div>
            </div>

            {/* Venue */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--neutral-300)" }}>
                <MapPin size={14} style={{ display: "inline", marginRight: "6px" }} />
                Nombre del lugar
              </label>
              <input
                {...register("venue")}
                placeholder="ej. Parque de Atracciones, Casa de los abuelos..."
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--neutral-300)" }}>
                Dirección
              </label>
              <input
                {...register("venueAddress")}
                placeholder="Calle, ciudad..."
                style={inputStyle}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, color: "var(--neutral-300)" }}>
                Descripción / notas para invitados
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Información adicional, aparcamiento, código de vestimenta..."
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn--ghost"
              >
                <ArrowLeft size={18} /> Atrás
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear evento y añadir regalos"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
