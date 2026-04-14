"use client";

import { useState } from "react";
import {
  X, Search, Star, Tag, ShoppingBag, Loader2,
  Plus, TrendingDown, Award, Zap, AlertCircle,
  Sparkles, ShieldCheck, Clock, BarChart3,
} from "lucide-react";
import type { GiftBadge, GiftSearchResult } from "@/lib/gift-search";

interface Props {
  onClose: () => void;
  onSelect: (item: {
    title: string;
    price: number;   // cents
    url: string;
    imageUrl: string | null;
  }) => void;
}

const BADGE: Record<GiftBadge, { label: string; color: string; Icon: React.ComponentType<{ size: number }> }> = {
  best_value: { label: "Mejor calidad/precio",   color: "#ff3366",  Icon: Zap },
  best_price: { label: "Precio más bajo",         color: "#06ffa5",  Icon: TrendingDown },
  best_rated: { label: "Mejor valorado",          color: "#f59e0b",  Icon: Award },
};

const VENTAJAS = [
  {
    icon: BarChart3,
    color: "#ff3366",
    title: "Compara miles de tiendas",
    desc: "El Genio analiza Google Shopping en tiempo real para encontrar el mejor precio.",
  },
  {
    icon: Sparkles,
    color: "#a78bfa",
    title: "Selección inteligente",
    desc: "Elige los 5 resultados con mejor equilibrio entre precio, valoraciones y relevancia.",
  },
  {
    icon: Star,
    color: "#f59e0b",
    title: "Reseñas reales",
    desc: "Solo muestra productos con valoraciones verificadas de compradores reales.",
  },
  {
    icon: ShieldCheck,
    color: "#06ffa5",
    title: "Añade en 1 clic",
    desc: "El regalo queda listo en tu lista con imagen, precio y enlace incluidos.",
  },
  {
    icon: Clock,
    color: "#38bdf8",
    title: "Siempre actualizado",
    desc: "Precios en tiempo real — ningún resultado desactualizado o sin stock.",
  },
];

export default function GiftSearchModal({ onClose, onSelect }: Props) {
  const [query,   setQuery]   = useState("");
  const [budget,  setBudget]  = useState("");
  const [results, setResults] = useState<GiftSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [unconfigured, setUnconfigured] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setUnconfigured(false);
    try {
      const res = await fetch("/api/gift-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          budget: budget ? parseFloat(budget) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error en la búsqueda");
      if (data.unconfigured) setUnconfigured(true);
      setResults(data.results ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(0,0,0,0.80)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "24px 16px", overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "var(--surface-card)",
          borderRadius: "var(--radius-xl)",
          padding: "28px",
          width: "100%", maxWidth: "680px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.15)",
          margin: "auto",
          border: "1px solid rgba(167,139,250,0.12)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>🧞</span>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #a78bfa 0%, #ff3366 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Buscador Mágico del Genio
              </h2>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--neutral-500)", margin: 0 }}>
              El Genio compara miles de tiendas y te trae las 5 mejores opciones al instante
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neutral-500)", padding: "2px", flexShrink: 0 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", pointerEvents: "none" }}>
                🔍
              </span>
              <input
                type="text"
                className="input"
                placeholder='ej. "auriculares inalámbricos", "perfume mujer 30 años"…'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                style={{ width: "100%", paddingLeft: "42px" }}
              />
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading || !query.trim()}
              style={{
                whiteSpace: "nowrap",
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: loading ? undefined : "linear-gradient(135deg, #7c3aed, #ff3366)",
                boxShadow: loading ? undefined : "0 4px 16px rgba(124,58,237,0.4)",
              }}
            >
              {loading
                ? <><Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Consultando…</>
                : <>🧞 Preguntar al Genio</>
              }
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "0.78rem", color: "var(--neutral-500)", whiteSpace: "nowrap" }}>
              Presupuesto máx. (€)
            </label>
            <input
              type="number"
              className="input"
              placeholder="ej. 50"
              min={1}
              step={1}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={{ width: "110px" }}
            />
          </div>
        </form>

        {/* Ventajas — only shown before first search */}
        {results === null && !loading && !error && (
          <div style={{ marginBottom: "24px" }}>
            <p style={{
              fontSize: "0.72rem", fontWeight: 700, color: "var(--neutral-600)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px",
            }}>
              ✨ Por qué usar el Buscador Mágico
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {VENTAJAS.map((v, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "12px",
                    padding: "10px 14px",
                    background: `${v.color}08`,
                    border: `1px solid ${v.color}20`,
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{
                    width: "28px", height: "28px", flexShrink: 0,
                    background: `${v.color}18`,
                    borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <v.icon size={14} style={{ color: v.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--neutral-200)", marginBottom: "1px" }}>
                      {v.title}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--neutral-500)", lineHeight: 1.4 }}>
                      {v.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unconfigured notice */}
        {unconfigured && (
          <div style={{
            display: "flex", gap: "10px", alignItems: "flex-start",
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: "16px",
          }}>
            <AlertCircle size={16} style={{ color: "#f59e0b", flexShrink: 0, marginTop: "2px" }} />
            <p style={{ fontSize: "0.8rem", color: "var(--neutral-400)", margin: 0 }}>
              El buscador no está configurado todavía. Añade <code>SERPER_API_KEY</code> en <code>.env.local</code> para activarlo.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            display: "flex", gap: "8px", alignItems: "center",
            background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)",
            borderRadius: "var(--radius-md)", padding: "10px 14px", marginBottom: "16px",
            fontSize: "0.82rem", color: "#ff3366",
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: "center", padding: "40px 24px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px", animation: "genieFloat 1.5s ease-in-out infinite" }}>🧞</div>
            <p style={{ fontSize: "0.88rem", color: "var(--neutral-500)", margin: 0 }}>El Genio está consultando las tiendas…</p>
          </div>
        )}

        {/* No results */}
        {results !== null && results.length === 0 && !unconfigured && (
          <div style={{ textAlign: "center", padding: "36px 24px", color: "var(--neutral-500)", fontSize: "0.88rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🧞</div>
            El Genio no encontró resultados. Prueba con otro término de búsqueda.
          </div>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <>
            <p style={{ fontSize: "0.75rem", color: "var(--neutral-600)", marginBottom: "12px" }}>
              🧞 El Genio encontró <strong style={{ color: "var(--neutral-300)" }}>{results.length} opciones</strong> · Haz clic en Añadir para incluirlo en tu lista
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {results.map((r, i) => {
                const b = r.badge ? BADGE[r.badge] : null;
                return (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: `1px solid ${b ? `${b.color}35` : "rgba(255,255,255,0.07)"}`,
                      borderRadius: "var(--radius-lg)",
                      padding: "16px",
                      display: "flex", gap: "14px", alignItems: "flex-start",
                      boxShadow: b ? `0 0 16px ${b.color}10` : undefined,
                    }}
                  >
                    {/* Thumbnail */}
                    {r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        alt={r.title}
                        style={{ width: "68px", height: "68px", objectFit: "cover", borderRadius: "var(--radius-md)", flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: "68px", height: "68px", background: "rgba(255,255,255,0.04)",
                        borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <ShoppingBag size={26} style={{ color: "var(--neutral-600)" }} />
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {b && (
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "0.68rem", fontWeight: 700, color: b.color,
                          background: `${b.color}15`, padding: "2px 8px",
                          borderRadius: "999px", marginBottom: "6px",
                          border: `1px solid ${b.color}25`,
                        }}>
                          <b.Icon size={10} /> {b.label}
                        </div>
                      )}
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.35, marginBottom: "6px" }}>
                        {r.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "1.15rem", fontWeight: 800, color: b?.color ?? "white" }}>
                          €{r.priceEuros.toFixed(2)}
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "var(--neutral-500)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Tag size={10} /> {r.store}
                        </span>
                        {r.rating !== null && (
                          <span style={{ fontSize: "0.74rem", color: "#f59e0b", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Star size={10} /> {r.rating.toFixed(1)}
                            {r.reviewCount && (
                              <span style={{ color: "var(--neutral-600)" }}>({r.reviewCount.toLocaleString("es-ES")})</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => {
                        onSelect({
                          title: r.title,
                          price: r.priceCents,
                          url: r.affiliateUrl,
                          imageUrl: r.imageUrl,
                        });
                        onClose();
                      }}
                      className="btn btn--primary"
                      style={{ flexShrink: 0, fontSize: "0.8rem", padding: "7px 14px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <Plus size={13} /> Añadir
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Affiliate disclosure */}
        <p style={{
          fontSize: "0.68rem", color: "var(--neutral-700)",
          marginTop: "20px", lineHeight: 1.6, textAlign: "center",
        }}>
          Los enlaces incluyen una etiqueta de afiliación. Cumplefy recibe una pequeña comisión por compras realizadas a través de estos enlaces — sin coste adicional para ti ni para el festejado. Así el Genio puede seguir cumpliendo sueños. 🧞
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes genieFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
