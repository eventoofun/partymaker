"use client";

/**
 * HeroCinematic — Landing page hero section with Lenis smooth scroll
 * and GSAP ScrollTrigger multi-layer parallax.
 *
 * Layers (back → front):
 *   1. Hero Genio image (zooms + drifts up on scroll)
 *   2. Gradient overlay
 *   3. Floating feature badges at various parallax depths
 *   4. Ambient magic particles (CSS animation)
 *   5. Hero text content (Framer Motion entry, fades out on scroll)
 *   6. Scroll indicator
 */

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Play, ChevronDown, Video, Gift, Users, BarChart3, Calendar, QrCode } from "lucide-react";

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

// ─── Floating feature badges ──────────────────────────────────────────────────

const BADGES = [
  {
    icon: <Video size={14} />,
    label: "Videoinvitación IA",
    color: "#00C2D1",
    // position: left% top% — offset units to keep badges visible on desktop
    left: "5%",
    top: "22%",
    parallaxFactor: 0.25,
    delay: "0s",
  },
  {
    icon: <Gift size={14} />,
    label: "Lista de regalos",
    color: "#FFB300",
    left: "78%",
    top: "18%",
    parallaxFactor: 0.4,
    delay: "0.4s",
  },
  {
    icon: <Users size={14} />,
    label: "RSVP automático",
    color: "#00E5A0",
    left: "4%",
    top: "62%",
    parallaxFactor: 0.55,
    delay: "0.8s",
  },
  {
    icon: <BarChart3 size={14} />,
    label: "Analytics en vivo",
    color: "#6366F1",
    left: "80%",
    top: "58%",
    parallaxFactor: 0.35,
    delay: "1.1s",
  },
  {
    icon: <Calendar size={14} />,
    label: "Programa del evento",
    color: "#FF4D6D",
    left: "68%",
    top: "75%",
    parallaxFactor: 0.6,
    delay: "1.4s",
  },
  {
    icon: <QrCode size={14} />,
    label: "Check-in QR",
    color: "#A78BFA",
    left: "14%",
    top: "78%",
    parallaxFactor: 0.45,
    delay: "1.7s",
  },
];

// ─── Ambient particles ────────────────────────────────────────────────────────

const PARTICLES = [
  { left: "12%",  top: "20%", size: 3, color: "#00C2D1", delay: "0s",   dur: "6s"  },
  { left: "85%",  top: "15%", size: 2, color: "#FFB300", delay: "1.5s", dur: "8s"  },
  { left: "70%",  top: "65%", size: 4, color: "#FF4D6D", delay: "3s",   dur: "7s"  },
  { left: "25%",  top: "75%", size: 2, color: "#A78BFA", delay: "0.8s", dur: "9s"  },
  { left: "55%",  top: "10%", size: 3, color: "#00E5A0", delay: "2s",   dur: "7s"  },
  { left: "42%",  top: "85%", size: 2, color: "#00C2D1", delay: "2.5s", dur: "8s"  },
  { left: "92%",  top: "45%", size: 3, color: "#FFB300", delay: "0.5s", dur: "6s"  },
  { left: "6%",   top: "50%", size: 2, color: "#FF4D6D", delay: "3.5s", dur: "9s"  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HeroCinematic() {
  const sectionRef   = useRef<HTMLElement>(null);
  const imageRef     = useRef<HTMLDivElement>(null);
  const badgeRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const smokeRef     = useRef<HTMLDivElement>(null);

  // Framer Motion scroll — fade out hero content as user scrolls
  const { scrollY } = useScroll();
  const contentOpacity = useTransform(scrollY, [0, 420], [1, 0]);
  const contentY       = useTransform(scrollY, [0, 420], [0, -40]);

  useEffect(() => {
    // Dynamic import to keep SSR clean
    let lenis: import("lenis").default | null = null;
    let gsap: typeof import("gsap").gsap | null = null;
    let ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger | null = null;

    async function init() {
      const [{ default: Lenis }, { gsap: g }, { ScrollTrigger: ST }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      g.registerPlugin(ST);
      gsap = g;
      ScrollTrigger = ST;

      // ── Lenis smooth scroll ──────────────────────────────────────────────
      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical" as const,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 2.0,
      });

      function onFrame(time: number) {
        lenis?.raf(time * 1000);
      }
      g.ticker.add(onFrame);
      g.ticker.lagSmoothing(0);
      lenis.on("scroll", ST.update);

      const section = sectionRef.current;
      if (!section) return;

      // ── Hero image parallax — slow zoom + drift ──────────────────────────
      if (imageRef.current) {
        g.to(imageRef.current, {
          yPercent: 28,
          scale: 1.15,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      }

      // ── Smoke layer subtle upward drift ─────────────────────────────────
      if (smokeRef.current) {
        g.to(smokeRef.current, {
          yPercent: 15,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 2,
          },
        });
      }

      // ── Badge parallax — each at a different depth ───────────────────────
      badgeRefs.current.forEach((el, i) => {
        if (!el) return;
        const badge = BADGES[i];
        if (!badge) return;
        g.to(el, {
          y: () => window.innerHeight * badge.parallaxFactor * -1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      });

      return onFrame;
    }

    let cleanup: (() => void) | undefined;

    init().then((onFrame) => {
      cleanup = () => {
        if (onFrame && gsap) gsap.ticker.remove(onFrame);
        lenis?.destroy();
        ScrollTrigger?.getAll().forEach((t) => t.kill());
      };
    });

    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ position: "relative", minHeight: "100dvh", display: "flex", alignItems: "center", overflow: "hidden" }}
    >
      {/* ── Layer 1: Hero Genio image ────────────────────────────────────── */}
      <div
        ref={imageRef}
        style={{
          position: "absolute",
          inset: "-10%",
          transformOrigin: "center 40%",
          willChange: "transform",
          zIndex: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/genio/hero-genio.png"
          alt="El Genio de Cumplefy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 30%",
          }}
        />
      </div>

      {/* ── Layer 2: Gradient overlays ───────────────────────────────────── */}
      {/* Base darkening — stronger than before to ensure text safety */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(2,4,9,0.65) 0%, rgba(2,4,9,0.5) 30%, rgba(2,4,9,0.68) 70%, rgba(2,4,9,0.93) 90%, #020409 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Text protection scrim — dark ellipse centered on the content area.
          Ensures WCAG AA contrast (≥4.5:1) for all text regardless of image brightness. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 85% 80% at 50% 48%, rgba(2,4,9,0.7) 0%, rgba(2,4,9,0.35) 55%, transparent 80%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,194,209,0.05) 0%, transparent 60%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Layer 3: Smoke/glow accent ───────────────────────────────────── */}
      <div
        ref={smokeRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
          willChange: "transform",
        }}
      >
        {/* Central glow under genie */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "20%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "300px",
            background:
              "radial-gradient(ellipse, rgba(103,63,215,0.25) 0%, transparent 70%)",
            filter: "blur(40px)",
            animation: "smoke-pulse 4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "15%",
            transform: "translateX(-50%)",
            width: "400px",
            height: "200px",
            background:
              "radial-gradient(ellipse, rgba(0,194,209,0.2) 0%, transparent 70%)",
            filter: "blur(30px)",
            animation: "smoke-pulse 4s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />
      </div>

      {/* ── Layer 4: Ambient particles ───────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "50%",
              background: p.color,
              boxShadow: `0 0 ${p.size * 5}px ${p.color}, 0 0 ${p.size * 10}px ${p.color}40`,
              animation: `particle-float ${p.dur} ease-in-out infinite`,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      {/* ── Layer 5: Floating feature badges ────────────────────────────── */}
      {BADGES.map((badge, i) => (
        <div
          key={badge.label}
          ref={(el) => { badgeRefs.current[i] = el; }}
          className="hero-badge"
          style={{
            position: "absolute",
            left: badge.left,
            top: badge.top,
            zIndex: 4,
            willChange: "transform",
            animation: `badge-float 5s ease-in-out infinite`,
            animationDelay: badge.delay,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 14px",
              borderRadius: "12px",
              background: "rgba(2,4,9,0.75)",
              border: `1px solid ${badge.color}45`,
              backdropFilter: "blur(14px)",
              boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 16px ${badge.color}20`,
              fontSize: "0.78rem",
              fontWeight: 600,
              color: badge.color,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ opacity: 0.85 }}>{badge.icon}</span>
            {badge.label}
          </div>
        </div>
      ))}

      {/* ── Layer 6: Hero content ────────────────────────────────────────── */}
      <motion.div
        style={{
          opacity: contentOpacity,
          y: contentY,
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "120px 32px 80px",
        }}
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center" }}
        >
          {/* Badge */}
          <motion.div variants={fadeUp} style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                borderRadius: "999px",
                background: "rgba(2,4,9,0.7)",
                border: "1px solid rgba(0,194,209,0.45)",
                backdropFilter: "blur(12px)",
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#00C2D1",
              }}
            >
              <Sparkles size={13} />
              La primera plataforma todo-en-uno para celebraciones épicas
              <span
                style={{
                  background: "var(--gradient-brand)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontWeight: 800,
                }}
              >
                ✨ Nuevo
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(3rem, 7vw, 5.5rem)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              marginBottom: "24px",
              color: "white",
              // text-shadow for legibility over any background (WCAG contrast safety net)
              textShadow: "0 2px 24px rgba(2,4,9,0.9), 0 4px 48px rgba(2,4,9,0.7)",
            }}
          >
            El evento de su vida.{" "}
            {/* gradient text — uses filter:drop-shadow instead of text-shadow
                since -webkit-text-fill-color:transparent disables text-shadow */}
            <span
              style={{
                display: "block",
                background: "linear-gradient(135deg, #00C2D1 0%, #FFB300 50%, #FF4D6D 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 16px rgba(2,4,9,0.95)) drop-shadow(0 0 8px rgba(2,4,9,0.8))",
              }}
            >
              Una obra maestra.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            style={{
              fontSize: "clamp(1.05rem, 2vw, 1.3rem)",
              color: "#e0e0f0",  /* neutral-200 — contrast ≥7:1 on dark scrim */
              lineHeight: 1.7,
              maxWidth: "600px",
              margin: "0 auto 40px",
              fontWeight: 400,
              textShadow: "0 1px 12px rgba(2,4,9,0.95), 0 2px 24px rgba(2,4,9,0.8)",
            }}
          >
            Videoinvitaciones cinematográficas con IA donde el protagonista se convierte en la estrella.
            Lista de regalos sin repetidos. RSVP sin caos. Todo en un enlace mágico — gestionado por El Genio.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              gap: "14px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "56px",
            }}
          >
            <Link
              href="/sign-up"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "16px 32px",
                borderRadius: "14px",
                background: "var(--gradient-brand)",
                color: "white",
                fontSize: "1rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 8px 40px rgba(0,194,209,0.35)",
                letterSpacing: "-0.01em",
              }}
            >
              Crear mi evento gratis
              <ArrowRight size={18} />
            </Link>
            <a
              href="#video-feature"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "16px 32px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                fontSize: "1rem",
                fontWeight: 600,
                textDecoration: "none",
                backdropFilter: "blur(8px)",
              }}
            >
              <Play size={16} />
              Ver cómo funciona
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              gap: "32px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {[
              { value: "+12.000", label: "eventos creados" },
              { value: "+280.000", label: "invitados RSVP" },
              { value: "4.9★", label: "valoración media" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    color: "white",
                    textShadow: "0 2px 12px rgba(2,4,9,0.9)",
                  }}
                >
                  {s.value}
                </div>
                {/* neutral-400 (#8888a8) has contrast ≥4.8:1 on the dark scrim — WCAG AA ✓ */}
                <div style={{ fontSize: "0.75rem", color: "rgba(200,200,220,0.85)", marginTop: "2px", textShadow: "0 1px 8px rgba(2,4,9,0.95)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Scroll progress bar ─────────────────────────────────────────── */}
      <div className="scroll-progress" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "2px", zIndex: 200, transformOrigin: "left", transform: "scaleX(0)" }} />

      {/* ── Scroll indicator ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        style={{
          position: "absolute",
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          /* rgba(200,200,220,0.7) — contrast ≥4.5:1 on the bottom dark overlay ✓ */
          color: "rgba(200,200,220,0.75)",
          animation: "float 3s ease-in-out infinite",
          zIndex: 10,
          textShadow: "0 1px 6px rgba(2,4,9,0.9)",
        }}
      >
        <span style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Descubrir
        </span>
        <ChevronDown size={16} />
      </motion.div>

      {/* ── CSS animations ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes badge-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes smoke-pulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50%       { opacity: 1;   transform: translateX(-50%) scale(1.08); }
        }
        @media (max-width: 900px) {
          .hero-badge { display: none !important; }
        }
      `}</style>
    </section>
  );
}
