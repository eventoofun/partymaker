"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Loader2, Package } from "lucide-react";

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

interface CartItem {
  variantId: string;
  qty: number;
}

interface VariantDetail {
  id: string;
  name: string;
  priceCents: number;
  product: { id: string; name: string; assets: Array<{ url: string; type: string }> };
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 16px",
  borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)", color: "white",
  fontSize: "0.9rem", outline: "none", fontFamily: "inherit",
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: "6px",
  fontWeight: 600, fontSize: "0.72rem",
  color: "var(--neutral-500)", textTransform: "uppercase", letterSpacing: "0.05em",
};

function CarritoContent() {
  const searchParams = useSearchParams();
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [items, setItems] = useState<CartItem[]>([]);
  const [variants, setVariants] = useState<VariantDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState({ line1: "", city: "", postalCode: "", country: "ES" });

  useEffect(() => {
    const raw = searchParams.get("items");
    if (!raw) { setLoadingVariants(false); return; }
    try {
      const parsed: CartItem[] = JSON.parse(raw);
      setItems(parsed);
      // Fetch variant details
      Promise.all(
        parsed.map((item) =>
          fetch(`/api/product-variants/${item.variantId}`).then((r) => r.json()).then((d) => d.variant)
        )
      ).then((vs) => {
        setVariants(vs.filter(Boolean));
        setLoadingVariants(false);
      }).catch(() => setLoadingVariants(false));
    } catch {
      setLoadingVariants(false);
    }
  }, [searchParams]);

  const subtotal = items.reduce((sum, item) => {
    const v = variants.find((v) => v.id === item.variantId);
    return sum + (v?.priceCents ?? 0) * item.qty;
  }, 0);
  const shipping = 499;
  const total = subtotal + shipping;

  async function handleCheckout() {
    if (!name.trim() || !email.trim() || !address.line1.trim() || !address.city.trim() || !address.postalCode.trim()) {
      alert("Por favor, rellena todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create cart
      const eventId = variants[0]?.product?.id; // we don't have eventId here — we'll get it from the API
      // For now we do a simple confirmation without Stripe (Phase 2.3)
      // Just create the order directly
      const orderRes = await fetch("/api/orders/simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          guestName: name,
          guestEmail: email,
          guestPhone: phone || null,
          items: items.map((item) => {
            const v = variants.find((v) => v.id === item.variantId);
            return { variantId: item.variantId, qty: item.qty, unitPriceCents: v?.priceCents ?? 0, productName: v?.product.name ?? "Producto", variantName: v?.name };
          }),
          shippingAddress: { ...address },
          subtotalCents: subtotal,
          shippingCents: shipping,
          totalCents: total,
        }),
      });

      if (!orderRes.ok) throw new Error("Error al crear el pedido");
      const { orderId } = await orderRes.json();
      router.push(`/e/${slug}/pedido/${orderId}`);
    } catch {
      alert("Error al procesar el pedido. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingVariants) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--neutral-500)" }} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", padding: "24px" }}>
        <Package size={48} style={{ color: "var(--neutral-600)" }} />
        <p style={{ color: "var(--neutral-500)", textAlign: "center" }}>Tu carrito está vacío</p>
        <Link href={`/e/${slug}`} style={{ color: "#00C2D1", textDecoration: "none", fontSize: "0.9rem" }}>← Volver al evento</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "white", padding: "0 0 80px" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href={`/e/${slug}`} style={{ color: "var(--neutral-500)", display: "flex" }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Checkout</h1>
      </div>

      <div style={{ maxWidth: "520px", margin: "0 auto", padding: "24px" }}>
        {/* Order summary */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-500)", marginBottom: "14px" }}>Tu pedido</h2>
          {items.map((item) => {
            const v = variants.find((v) => v.id === item.variantId);
            if (!v) return null;
            return (
              <div key={item.variantId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", marginBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{v.product.name}</div>
                  <div style={{ color: "var(--neutral-500)", fontSize: "0.78rem" }}>{v.name} × {item.qty}</div>
                </div>
                <div style={{ fontWeight: 700, color: "#00C2D1" }}>{formatEuros(v.priceCents * item.qty)}</div>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--neutral-500)", fontSize: "0.85rem", marginBottom: "6px" }}>
            <span>Envío</span><span>{formatEuros(shipping)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.05rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px", marginTop: "6px" }}>
            <span>Total</span><span style={{ color: "#00C2D1" }}>{formatEuros(total)}</span>
          </div>
        </div>

        {/* Contact info */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-500)", marginBottom: "14px" }}>Datos de contacto</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Nombre completo *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Teléfono <span style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span></label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--neutral-500)", marginBottom: "14px" }}>Dirección de envío</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Dirección *</label>
              <input value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} placeholder="Calle y número" style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Ciudad *</label>
                <input value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} placeholder="Madrid" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>C.P. *</label>
                <input value={address.postalCode} onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))} placeholder="28001" style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            width: "100%", padding: "16px",
            borderRadius: "16px", border: "none",
            background: "linear-gradient(135deg, #00C2D1, #FFB300)",
            color: "white", fontFamily: "inherit",
            fontSize: "1rem", fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          }}
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Procesando...</> : <><ShoppingBag size={18} /> Confirmar pedido · {formatEuros(total)}</>}
        </button>

        <p style={{ marginTop: "12px", color: "var(--neutral-600)", fontSize: "0.75rem", textAlign: "center" }}>
          El organizador del evento gestionará tu pedido. Recibirás confirmación por email.
        </p>
      </div>
    </div>
  );
}

export default function CarritoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
        <Loader2 size={24} style={{ color: "var(--neutral-500)" }} />
      </div>
    }>
      <CarritoContent />
    </Suspense>
  );
}
