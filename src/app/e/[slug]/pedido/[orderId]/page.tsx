import Link from "next/link";
import { db } from "@/db";
import { orders, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CheckCircle, Package, ArrowLeft } from "lucide-react";

interface Props { params: Promise<{ slug: string; orderId: string }> }

function formatEuros(cents: number) {
  return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export default async function PedidoConfirmPage({ params }: Props) {
  const { slug, orderId } = await params;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });

  if (!order) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        {/* Icon */}
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <CheckCircle size={36} style={{ color: "#10B981" }} />
        </div>

        <h1 style={{ fontSize: "1.8rem", fontWeight: 900, marginBottom: "10px" }}>¡Pedido confirmado!</h1>
        <p style={{ color: "var(--neutral-400)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "32px" }}>
          Hemos recibido tu pedido. El organizador del evento lo revisará y te contactará para coordinar el envío.
        </p>

        {/* Order summary */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "20px", marginBottom: "24px", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Package size={16} style={{ color: "var(--neutral-500)" }} />
            <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Resumen del pedido</span>
          </div>

          {order.items.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.88rem" }}>
              <span style={{ color: "var(--neutral-300)" }}>{item.productName}{item.variantName && ` · ${item.variantName}`} × {item.quantity}</span>
              <span style={{ fontWeight: 600 }}>{formatEuros(item.unitPriceCents * item.quantity)}</span>
            </div>
          ))}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "12px", marginTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
            <span>Total</span>
            <span style={{ color: "#10B981" }}>{formatEuros(order.totalCents)}</span>
          </div>
        </div>

        {order.guestEmail && (
          <p style={{ color: "var(--neutral-500)", fontSize: "0.82rem", marginBottom: "24px" }}>
            Confirmación enviada a <strong style={{ color: "var(--neutral-300)" }}>{order.guestEmail}</strong>
          </p>
        )}

        <Link
          href={`/e/${slug}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "13px 24px", borderRadius: "14px",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "white", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem",
          }}
        >
          <ArrowLeft size={16} /> Volver al evento
        </Link>
      </div>
    </div>
  );
}
