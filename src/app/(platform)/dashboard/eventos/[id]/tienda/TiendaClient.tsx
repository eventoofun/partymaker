"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ShoppingBag, Plus, Pencil, Trash2, Eye, EyeOff,
  Package, TrendingUp, ShoppingCart, ExternalLink, ToggleLeft, ToggleRight, X, Check,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductType = "POD_2D_APPAREL" | "POD_2D_ACCESSORY" | "POD_2D_PRINT" | "POD_3D_DECOR" | "POD_3D_FIGURE" | "POD_3D_GIFT" | "CUSTOM_ONE_OFF";
type ProductStatus = "draft" | "active" | "archived";

interface ProductVariantData {
  id: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
  attributes: Record<string, string>;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  type: ProductType;
  status: ProductStatus;
  requiresQuote: boolean;
  sortOrder: number;
  assets: Array<{ id: string; type: string; url: string }>;
  variants: ProductVariantData[];
}

interface StoreData {
  id: string;
  isActive: boolean;
  title: string | null;
  description: string | null;
  visibility: "public" | "guests_only" | "vip_only";
  products: ProductData[];
}

interface Props {
  eventId: string;
  eventSlug: string;
  celebrantName: string;
  store: StoreData | null;
  orderCount: number;
  revenueTotal: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_TYPES: { value: ProductType; label: string; emoji: string }[] = [
  { value: "POD_2D_APPAREL",   label: "Camiseta / Ropa",   emoji: "👕" },
  { value: "POD_2D_ACCESSORY", label: "Accesorio (taza, bolsa...)", emoji: "☕" },
  { value: "POD_2D_PRINT",     label: "Póster / Lámina",   emoji: "🖼️" },
  { value: "POD_3D_DECOR",     label: "Decoración 3D",     emoji: "🎨" },
  { value: "POD_3D_FIGURE",    label: "Figura 3D",         emoji: "🏆" },
  { value: "POD_3D_GIFT",      label: "Regalo 3D",         emoji: "🎁" },
  { value: "CUSTOM_ONE_OFF",   label: "Personalizado",     emoji: "✨" },
];

const STATUS_LABEL: Record<ProductStatus, string> = {
  draft: "Borrador", active: "Activo", archived: "Archivado",
};

const STATUS_COLOR: Record<ProductStatus, string> = {
  draft: "#F59E0B", active: "#10B981", archived: "#6B7280",
};

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

// ─── AddProductModal ─────────────────────────────────────────────────────────

function AddProductModal({
  eventId,
  onClose,
  onCreated,
}: {
  eventId: string;
  onClose: () => void;
  onCreated: (product: ProductData) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProductType>("POD_2D_APPAREL");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("");
  const [variantName, setVariantName] = useState("Único");

  async function handleSubmit() {
    if (!name.trim() || !price) return;
    const priceCents = Math.round(parseFloat(price.replace(",", ".")) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      toast.error("Introduce un precio válido");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/eventos/${eventId}/tienda/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          type,
          status: "active",
          variants: [{ name: variantName, priceCents }],
        }),
      });

      if (!res.ok) throw new Error("Error al crear producto");
      const { product } = await res.json();

      // Add image asset if URL provided
      if (imageUrl.trim()) {
        await fetch(`/api/product-assets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, type: "preview", url: imageUrl.trim() }),
        }).catch(() => {/* non-critical */});
      }

      toast.success("Producto creado");
      onCreated({ ...product, assets: imageUrl.trim() ? [{ id: "temp", type: "preview", url: imageUrl.trim() }] : [] });
      onClose();
    } catch {
      toast.error("Error al crear el producto");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#fff",
    border: "1px solid rgba(0,0,0,0.12)", borderRadius: "10px",
    padding: "11px 14px", fontSize: "0.9rem", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
    color: "#1C1C1E",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", marginBottom: "6px",
    fontWeight: 600, fontSize: "0.75rem",
    color: "var(--neutral-400)", textTransform: "uppercase", letterSpacing: "0.05em",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
    }}>
      <div style={{
        background: "#fff", borderRadius: "20px", padding: "32px",
        width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Nuevo producto</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neutral-400)", padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Type */}
          <div>
            <label style={labelStyle}>Tipo de producto</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {PRODUCT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  style={{
                    padding: "10px 12px", borderRadius: "10px", textAlign: "left",
                    border: type === t.value ? "2px solid var(--brand-primary)" : "1px solid rgba(0,0,0,0.1)",
                    background: type === t.value ? "rgba(0,194,209,0.06)" : "#fff",
                    cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem",
                    display: "flex", gap: "8px", alignItems: "center",
                    fontWeight: type === t.value ? 600 : 400,
                    color: "#1C1C1E",
                  }}
                >
                  <span>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={labelStyle}>Nombre del producto *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Camiseta del cumple de Lucía"
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Descripción <span style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe el producto..."
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
            />
          </div>

          {/* Image URL */}
          <div>
            <label style={labelStyle}>URL de imagen <span style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          {/* Price + variant name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={labelStyle}>Precio (€) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="19.99"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Nombre variante</label>
              <input
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="ej. Talla M"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn--ghost"
            style={{ flex: 1 }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !price}
            className="btn btn--primary"
            style={{ flex: 2, opacity: loading || !name.trim() || !price ? 0.5 : 1 }}
          >
            {loading ? "Creando..." : "Crear producto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TiendaClient({
  eventId,
  eventSlug,
  celebrantName,
  store: initialStore,
  orderCount,
  revenueTotal,
}: Props) {
  const [store, setStore] = useState<StoreData | null>(initialStore);
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // ── Create store ────────────────────────────────────────────────────────────

  async function createStore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/eventos/${eventId}/tienda`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { store: s } = await res.json();
      setStore({ ...s, products: [] });
      toast.success("Tienda creada");
    } catch {
      toast.error("Error al crear la tienda");
    } finally {
      setLoading(false);
    }
  }

  // ── Toggle active ───────────────────────────────────────────────────────────

  async function toggleActive() {
    if (!store) return;
    try {
      const res = await fetch(`/api/eventos/${eventId}/tienda`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !store.isActive }),
      });
      if (!res.ok) throw new Error();
      const { store: updated } = await res.json();
      setStore((s) => s ? { ...s, isActive: updated.isActive } : s);
      toast.success(updated.isActive ? "Tienda activada" : "Tienda desactivada");
    } catch {
      toast.error("Error al actualizar la tienda");
    }
  }

  // ── Toggle product status ────────────────────────────────────────────────

  async function toggleProductStatus(productId: string, currentStatus: ProductStatus) {
    const newStatus: ProductStatus = currentStatus === "active" ? "draft" : "active";
    try {
      const res = await fetch(`/api/eventos/${eventId}/tienda/productos/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setStore((s) => s ? {
        ...s,
        products: s.products.map((p) => p.id === productId ? { ...p, status: newStatus } : p),
      } : s);
      toast.success(newStatus === "active" ? "Producto publicado" : "Producto ocultado");
    } catch {
      toast.error("Error al actualizar el producto");
    }
  }

  // ── Delete product ──────────────────────────────────────────────────────────

  async function deleteProduct(productId: string) {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/eventos/${eventId}/tienda/productos/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStore((s) => s ? { ...s, products: s.products.filter((p) => p.id !== productId) } : s);
      toast.success("Producto eliminado");
    } catch {
      toast.error("Error al eliminar el producto");
    }
  }

  // ── Render: no store yet ────────────────────────────────────────────────────

  if (!store) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <ShoppingBag size={22} style={{ color: "var(--brand-primary)" }} />
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Tienda del evento</h1>
        </div>

        <div style={{
          background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
          borderRadius: "20px", padding: "56px 32px",
          textAlign: "center", maxWidth: "480px",
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🛍️</div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "10px" }}>
            Activa la tienda del evento
          </h2>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "28px" }}>
            Vende camisetas, tazas, posters y artículos personalizados directamente desde la página del evento. Los invitados pueden comprar sin salir de la invitación.
          </p>
          <button
            className="btn btn--primary btn--lg"
            onClick={createStore}
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear tienda"}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: store exists ────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          <ShoppingBag size={22} style={{ color: "var(--brand-primary)" }} />
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Tienda del evento</h1>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <Link
            href={`/e/${eventSlug}`}
            target="_blank"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "0.82rem", color: "var(--neutral-500)",
              textDecoration: "none", padding: "8px 14px",
              border: "1px solid rgba(0,0,0,0.1)", borderRadius: "10px",
            }}
          >
            <ExternalLink size={13} /> Ver página pública
          </Link>

          <button
            onClick={toggleActive}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 16px", borderRadius: "10px", cursor: "pointer",
              border: "none", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: 600,
              background: store.isActive ? "#D1FAE5" : "#F3F4F6",
              color: store.isActive ? "#065F46" : "#374151",
              transition: "all 0.2s",
            }}
          >
            {store.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {store.isActive ? "Activa" : "Inactiva"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {[
          { label: "Productos", value: store.products.length, icon: <Package size={18} />, color: "#6366F1" },
          { label: "Pedidos", value: orderCount, icon: <ShoppingCart size={18} />, color: "#F59E0B" },
          { label: "Ingresos", value: formatEuros(revenueTotal), icon: <TrendingUp size={18} />, color: "#10B981" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{
            background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: "16px", padding: "20px",
            display: "flex", flexDirection: "column", gap: "8px",
          }}>
            <div style={{ color, opacity: 0.8 }}>{icon}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#1C1C1E" }}>{value}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)", fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Products */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700 }}>
          Productos ({store.products.filter((p) => p.status === "active").length} activos)
        </h2>
        <button
          className="btn btn--primary"
          onClick={() => setShowAddProduct(true)}
          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
        >
          <Plus size={15} /> Añadir producto
        </button>
      </div>

      {store.products.length === 0 ? (
        <div style={{
          background: "#fff", border: "1px dashed rgba(0,0,0,0.15)",
          borderRadius: "16px", padding: "40px", textAlign: "center",
        }}>
          <p style={{ color: "var(--neutral-500)", fontSize: "0.9rem" }}>
            Aún no hay productos. Añade el primero para empezar a vender.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {store.products.map((product) => {
            const cover = product.assets.find((a) => a.type === "preview")?.url;
            const minPrice = product.variants.length > 0
              ? Math.min(...product.variants.map((v) => v.priceCents))
              : null;

            return (
              <div
                key={product.id}
                style={{
                  background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
                  borderRadius: "14px", padding: "16px",
                  display: "flex", gap: "16px", alignItems: "center",
                }}
              >
                {/* Cover */}
                <div style={{
                  width: "56px", height: "56px", flexShrink: 0,
                  borderRadius: "10px", overflow: "hidden",
                  background: "rgba(0,0,0,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem",
                }}>
                  {cover ? (
                    <img src={cover} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    PRODUCT_TYPES.find((t) => t.value === product.type)?.emoji ?? "📦"
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "#1C1C1E" }}>{product.name}</span>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px",
                      borderRadius: "99px",
                      background: `${STATUS_COLOR[product.status]}18`,
                      color: STATUS_COLOR[product.status],
                    }}>
                      {STATUS_LABEL[product.status]}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--neutral-500)" }}>
                    {minPrice !== null ? `Desde ${formatEuros(minPrice)}` : "Sin precio"} · {product.variants.length} variante{product.variants.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    onClick={() => toggleProductStatus(product.id, product.status)}
                    title={product.status === "active" ? "Ocultar" : "Publicar"}
                    style={{
                      width: "34px", height: "34px", borderRadius: "8px",
                      border: "1px solid rgba(0,0,0,0.08)", background: "#fff",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: product.status === "active" ? "#10B981" : "var(--neutral-400)",
                    }}
                  >
                    {product.status === "active" ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>

                  <button
                    onClick={() => deleteProduct(product.id)}
                    title="Eliminar"
                    style={{
                      width: "34px", height: "34px", borderRadius: "8px",
                      border: "1px solid rgba(0,0,0,0.08)", background: "#fff",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#EF4444",
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visibility note */}
      {!store.isActive && store.products.length > 0 && (
        <div style={{
          marginTop: "20px", padding: "14px 18px",
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "12px", fontSize: "0.85rem", color: "#92400E",
        }}>
          La tienda está <strong>inactiva</strong> y no es visible para los invitados. Actívala para que puedan ver y comprar los productos.
        </div>
      )}

      {/* Add product modal */}
      {showAddProduct && (
        <AddProductModal
          eventId={eventId}
          onClose={() => setShowAddProduct(false)}
          onCreated={(product) => setStore((s) => s ? { ...s, products: [...s.products, product] } : s)}
        />
      )}
    </div>
  );
}
