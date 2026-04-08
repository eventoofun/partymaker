"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Link from "next/link";
import { Gift, ArrowLeft } from "lucide-react";
import { formatEuros, fundingPercent } from "@/lib/utils";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface WishItem {
  id: string;
  title: string;
  price: number | null;
  isCollective: boolean;
  targetAmount: number | null;
  collectedAmount: number | null;
  status: string;
}

// Inner checkout form
function CheckoutForm({
  slug,
  item,
  amount,
  name,
  email,
  message,
  isAnonymous,
}: {
  slug: string;
  item: WishItem;
  amount: number;
  name: string;
  email: string;
  message: string;
  isAnonymous: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/e/${slug}/regalo/gracias`,
        payment_method_data: {
          billing_details: { name, email },
        },
      },
    });

    if (submitError) {
      setError(submitError.message ?? "Error al procesar el pago");
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "12px" }}>{error}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || paying}
        className="btn btn--primary"
        style={{ width: "100%", marginTop: "20px", justifyContent: "center" }}
      >
        {paying ? "Procesando..." : `Enviar ${formatEuros(amount)}`}
      </button>
    </form>
  );
}

export default function RegaloPage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams();
  const itemId = searchParams.get("item");

  const [slug, setSlug] = useState("");
  const [item, setItem] = useState<WishItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [step, setStep] = useState<"details" | "payment">("details");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!itemId || !slug) return;
    fetch(`/api/wish-items/${itemId}/public`)
      .then((r) => r.json())
      .then((d) => {
        setItem(d.item);
        if (d.item?.price && !d.item.isCollective) {
          setCustomAmount(String(d.item.price / 100));
        }
      })
      .finally(() => setLoading(false));
  }, [itemId, slug]);

  const amount = item?.isCollective
    ? Math.round(parseFloat(customAmount || "0") * 100)
    : (item?.price ?? 0);

  async function handleCreateIntent() {
    if (!name.trim() || !email.trim() || amount < 100) return;
    setCreating(true);
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishItemId: itemId,
          amount,
          contributorName: name,
          contributorEmail: email,
          message,
          isAnonymous,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al crear el pago");
    } finally {
      setCreating(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "white",
    fontSize: "0.95rem",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--surface-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--neutral-500)" }}>Cargando...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--surface-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px" }}>
        <p style={{ color: "var(--neutral-400)" }}>Regalo no encontrado.</p>
        <Link href={`/e/${slug}`} className="btn btn--ghost" style={{ textDecoration: "none" }}>
          <ArrowLeft size={16} /> Volver
        </Link>
      </div>
    );
  }

  const pct = item.isCollective && item.targetAmount
    ? fundingPercent(item.collectedAmount ?? 0, item.targetAmount)
    : null;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-bg)" }}>
      {/* Nav */}
      <nav style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link
          href={`/e/${slug}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--neutral-400)", textDecoration: "none", fontSize: "0.88rem" }}
        >
          <ArrowLeft size={15} /> Volver a la lista
        </Link>
      </nav>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Item card */}
        <div style={{
          background: "var(--surface-card)",
          borderRadius: "var(--radius-xl)",
          padding: "24px",
          marginBottom: "28px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Gift size={20} style={{ color: "var(--brand-primary)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>{item.title}</h2>
          </div>

          {item.price && !item.isCollective && (
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", marginBottom: "8px" }}>
              {formatEuros(item.price)}
            </div>
          )}

          {item.isCollective && item.targetAmount && (
            <div style={{ marginTop: "8px" }}>
              <div className="funding-bar">
                <div className="funding-bar__fill" style={{ width: `${pct}%` }} />
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--neutral-500)", marginTop: "6px" }}>
                {formatEuros(item.collectedAmount ?? 0)} recaudados de {formatEuros(item.targetAmount)} · {pct}%
              </div>
            </div>
          )}
        </div>

        {step === "details" && (
          <div style={{
            background: "var(--surface-card)",
            borderRadius: "var(--radius-xl)",
            padding: "28px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <h3 style={{ marginBottom: "24px", fontSize: "1rem", fontWeight: 700 }}>
              Tus datos
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.78rem", fontWeight: 600, color: "var(--neutral-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Tu nombre *
                </label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="María García" style={inputStyle} />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.78rem", fontWeight: 600, color: "var(--neutral-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Email *
                </label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="maria@email.com" style={inputStyle} />
              </div>

              {item.isCollective && (
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "0.78rem", fontWeight: 600, color: "var(--neutral-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Importe a aportar (€) *
                  </label>
                  <input
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    type="number"
                    min={1}
                    step={0.01}
                    placeholder="20.00"
                    style={inputStyle}
                  />
                  <p style={{ fontSize: "0.75rem", color: "var(--neutral-600)", marginTop: "4px" }}>Mínimo €1</p>
                </div>
              )}

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "0.78rem", fontWeight: 600, color: "var(--neutral-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Mensaje (opcional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="¡Feliz cumpleaños!"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Anonymous toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsAnonymous((v) => !v)}
                  style={{
                    width: "44px", height: "24px", borderRadius: "999px",
                    background: isAnonymous ? "var(--brand-primary)" : "rgba(255,255,255,0.1)",
                    border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: "absolute", top: "3px",
                    left: isAnonymous ? "23px" : "3px",
                    width: "18px", height: "18px", borderRadius: "50%",
                    background: "white", transition: "left 0.2s",
                  }} />
                </button>
                <span style={{ fontSize: "0.88rem", color: "var(--neutral-400)" }}>Aportar de forma anónima</span>
              </div>
            </div>

            <button
              onClick={handleCreateIntent}
              disabled={creating || !name.trim() || !email.trim() || amount < 100}
              className="btn btn--primary"
              style={{ width: "100%", marginTop: "24px", justifyContent: "center" }}
            >
              {creating ? "Un momento..." : `Continuar con el pago · ${formatEuros(amount)}`}
            </button>
          </div>
        )}

        {step === "payment" && clientSecret && (
          <div style={{
            background: "var(--surface-card)",
            borderRadius: "var(--radius-xl)",
            padding: "28px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <h3 style={{ marginBottom: "24px", fontSize: "1rem", fontWeight: 700 }}>Pago seguro</h3>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#ff3366",
                    colorBackground: "#15152e",
                    fontFamily: "Inter, sans-serif",
                    borderRadius: "10px",
                  },
                },
              }}
            >
              <CheckoutForm
                slug={slug}
                item={item}
                amount={amount}
                name={name}
                email={email}
                message={message}
                isAnonymous={isAnonymous}
              />
            </Elements>
          </div>
        )}

        <p style={{ textAlign: "center", color: "var(--neutral-600)", fontSize: "0.75rem", marginTop: "24px" }}>
          Pago procesado de forma segura por Stripe. eventoo nunca almacena datos de tarjeta.
        </p>
      </div>
    </div>
  );
}
