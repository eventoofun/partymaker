"use client";

import { useState, useEffect } from "react";
import {
  Search, Star, Tag, ShoppingBag, Loader2, Plus, TrendingDown,
  Award, Zap, Trash2, AlertCircle, ArrowRight,
} from "lucide-react";
import type { GiftBadge, GiftSearchResult } from "@/lib/gift-search";

interface GiftItem {
  id: string;
  title: string;
  price: number | null;
  url: string | null;
  imageUrl: string | null;
}

interface Props {
  eventId: string;
  celebrantName: string;
  onNext: () => void;
  onSkip: () => void;
}

const BADGE_CONFIG: Record<GiftBadge, { label: string; color: string; Icon: React.ComponentType<{ size: number }> }> = {
  best_value: { label: "Mejor calidad/precio", color: "#ff3366",  Icon: Zap },
  best_price: { label: "Precio más bajo",       color: "#06ffa5",  Icon: TrendingDown },
  best_rated: { label: "Mejor valorado",        color: "#f59e0b",  Icon: Award },
};

export default function WizardStepGifts({ eventId, celebrantName, onNext, onSkip }: Props) {
  const [giftListId, setGiftListId]   = useState<string | null>(null);
  const [items, setItems]             = useState<GiftItem[]>([]);
  const [query, setQuery]             = useState("");
  const [budget, setBudget]           = useState("");
  const [results, setResults]         = useState<GiftSearchResult[] | null>(null);
  const [searching, setSearching]     = useState(false);
  const [adding, setAdding]           = useState<number | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [loadError, setLoadError]     = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [unconfigured, setUnconfigured] = useState(false);
  const [allowGiftsSet, setAllowGiftsSet] = useState(false);

  // Load or create gift list on mount
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`/api/events/${eventId}/gift-lists`);
        if (!res.ok) throw new Error("Error cargando la lista");
        const data = await res.json() as { lists: Array<{ id: string; items: GiftItem[] }> };
        if (data.lists.length > 0) {
          setGiftListId(data.lists[0].id);
          setItems(data.lists[0].items);
        } else {
          const createRes = await fetch(`/api/events/${eventId}/gift-lists`, { method: "POST" });
          if (!createRes.ok) throw new Error("Error creando la lista");
          const { list } = await createRes.json() as { list: { id: string } };
          setGiftListId(list.id);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Error inesperado");
      }
    }
    init();
  }, [eventId]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
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
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Error en la búsqueda");
      if ((data as { unconfigured?: boolean }).unconfigured) setUnconfigured(true);
      setResults((data as { results?: GiftSearchResult[] }).results ?? []);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(result: GiftSearchResult, idx: number) {
    if (!giftListId) return;
    setAdding(idx);
    try {
      if (!allowGiftsSet && items.length === 0) {
        await fetch(`/api/events/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allowGifts: true }),
        });
        setAllowGiftsSet(true);
      }
      const res = await fetch("/api/wish-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftListId,
          title:          result.title,
          price:          result.priceCents,
          url:            result.affiliateUrl,
          imageUrl:       result.imageUrl,
          quantityWanted: 1,
          sortOrder:      items.length,
        }),
      });
      if (!res.ok) throw new Error("Error al añadir");
      const { item } = await res.json() as { item: GiftItem };
      setItems(prev => [...prev, item]);
    } catch {
      // silently ignore — don't block the UI
    } finally {
      setAdding(null);
    }
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId);
    try {
      const res = await fetch(`/api/wish-items/${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null);
    }
  }

  if (loadError) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "#ff3366" }}>{loadError}</p>
        <button onClick={onSkip} className="btn btn--ghost" style={{ marginTop: "16px" }}>
          Saltar este paso
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{ fontSize: "1.6rem" }}>🎁</span>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
            Lista de regalos de {celebrantName}
          </h2>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--neutral-500)", margin: 0 }}>
          Busca con el Genio y añade regalos. Tus invitados los verán en la página del evento.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--neutral-500)", pointerEvents: "none" }} />
            <input
              type="text"
              className="input"
              placeholder='ej. "bicicleta niño 6 años", "juego mesa familia"…'
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ width: "100%", paddingLeft: "36px" }}
            />
          </div>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={searching || !query.trim()}
            style={{
              whiteSpace: "nowrap",
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: searching ? undefined : "linear-gradient(135deg, #7c3aed, #ff3366)",
            }}
          >
            {searching
              ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Buscando…</>
              : <>🧞 Buscar</>
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
            onChange={e => setBudget(e.target.value)}
            style={{ width: "110px" }}
          />
        </div>
      </form>

      {/* Unconfigured notice */}
      {unconfigured && (
        <div style={{
          display: "flex", gap: "10px", alignItems: "flex-start",
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: "var(--radius-md)", padding: "12px 16px",
        }}>
          <AlertCircle size={16} style={{ color: "#f59e0b", flexShrink: 0, marginTop: "2px" }} />
          <p style={{ fontSize: "0.8rem", color: "var(--neutral-400)", margin: 0 }}>
            El buscador no está configurado. Puedes añadir regalos manualmente después desde el panel.
          </p>
        </div>
      )}

      {/* Search error */}
      {searchError && (
        <div style={{
          display: "flex", gap: "8px", alignItems: "center",
          background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)",
          borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: "0.82rem", color: "#ff3366",
        }}>
          <AlertCircle size={14} /> {searchError}
        </div>
      )}

      {/* Loading */}
      {searching && (
        <div style={{ textAlign: "center", padding: "24px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px", animation: "genieFloat 1.5s ease-in-out infinite" }}>🧞</div>
          <p style={{ fontSize: "0.85rem", color: "var(--neutral-500)", margin: 0 }}>El Genio está buscando…</p>
        </div>
      )}

      {/* No results */}
      {results !== null && results.length === 0 && !unconfigured && (
        <div style={{ textAlign: "center", padding: "24px", color: "var(--neutral-500)", fontSize: "0.85rem" }}>
          🧞 Sin resultados. Prueba otro término de búsqueda.
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--neutral-600)", margin: 0 }}>
            🧞 {results.length} opciones encontradas
          </p>
          {results.map((r, i) => {
            const b = r.badge ? BADGE_CONFIG[r.badge] : null;
            return (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${b ? `${b.color}35` : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "14px",
                  display: "flex", gap: "12px", alignItems: "flex-start",
                }}
              >
                {r.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={r.imageUrl} alt={r.title} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "var(--radius-md)", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: "60px", height: "60px", background: "rgba(255,255,255,0.04)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ShoppingBag size={22} style={{ color: "var(--neutral-600)" }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {b && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.68rem", fontWeight: 700, color: b.color, background: `${b.color}15`, padding: "2px 8px", borderRadius: "999px", marginBottom: "5px", border: `1px solid ${b.color}25` }}>
                      <b.Icon size={10} /> {b.label}
                    </div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.3, marginBottom: "5px" }}>{r.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "1.05rem", fontWeight: 800, color: b?.color ?? "white" }}>€{r.priceEuros.toFixed(2)}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--neutral-500)", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Tag size={9} /> {r.store}
                    </span>
                    {r.rating !== null && (
                      <span style={{ fontSize: "0.72rem", color: "#f59e0b", display: "flex", alignItems: "center", gap: "3px" }}>
                        <Star size={9} /> {r.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleAdd(r, i)}
                  disabled={adding === i}
                  className="btn btn--primary"
                  style={{ flexShrink: 0, fontSize: "0.78rem", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  {adding === i
                    ? <Loader2 size={12} style={{ animation: "spin 0.8s linear infinite" }} />
                    : <Plus size={12} />
                  }
                  Añadir
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Added gifts */}
      {items.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--neutral-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
            ✅ Regalos añadidos ({items.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {items.map(item => (
              <div key={item.id} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 14px", background: "rgba(6,255,165,0.04)", border: "1px solid rgba(6,255,165,0.15)", borderRadius: "var(--radius-md)" }}>
                {item.imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.imageUrl} alt={item.title} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />
                )}
                <span style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600 }}>{item.title}</span>
                {item.price && (
                  <span style={{ fontSize: "0.85rem", color: "#06ffa5", fontWeight: 700 }}>€{(item.price / 100).toFixed(2)}</span>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ff3366", padding: "4px", display: "flex", alignItems: "center" }}
                >
                  {deletingId === item.id
                    ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} />
                    : <Trash2 size={14} />
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
        <button
          onClick={onSkip}
          style={{ background: "none", border: "none", color: "var(--neutral-500)", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}
        >
          Saltar este paso
        </button>
        <button
          onClick={onNext}
          className="btn btn--primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          Continuar <ArrowRight size={16} />
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes genieFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>
    </div>
  );
}
