import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface InvitacionProps {
  celebrantName: string;
  celebrantAge?: number;
  protagonistEmoji: string;
  protagonistLabel: string;
  parentMessage: string;
  eventDate: string;
  eventTime?: string;
  venue: string;
  primaryColor: string;
  secondaryColor: string;
  mood: "epic" | "magical" | "fun" | "elegant";
}

// ─── Paleta por mood ──────────────────────────────────────────────────────────

const MOOD_BG: Record<string, string> = {
  epic:    "radial-gradient(ellipse at 30% 70%, #1a0010 0%, #0a0a1a 60%, #000 100%)",
  magical: "radial-gradient(ellipse at 50% 30%, #0d0020 0%, #0a0018 60%, #000 100%)",
  fun:     "radial-gradient(ellipse at 20% 80%, #001a0a 0%, #0a0a20 60%, #000 100%)",
  elegant: "radial-gradient(ellipse at 70% 20%, #1a1a00 0%, #0a0a0a 60%, #000 100%)",
};

// ─── Componentes internos ─────────────────────────────────────────────────────

function FloatingParticle({ x, y, size, delay, color }: { x: number; y: number; size: number; delay: number; color: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame - delay) / fps;
  const opacity = interpolate(frame, [delay, delay + 20, delay + 60], [0, 0.7, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const yOffset = Math.sin(t * 1.5) * 20;

  return (
    <div style={{
      position: "absolute",
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      opacity,
      transform: `translateY(${yOffset}px)`,
      filter: "blur(1px)",
    }} />
  );
}

function EmojiProtagonist({ emoji, frame, fps }: { emoji: string; frame: number; fps: number }) {
  const scale = spring({ frame, fps, from: 0, to: 1, config: { damping: 10, stiffness: 100, mass: 0.5 } });
  const bounce = 1 + Math.sin(frame / 15) * 0.05;

  return (
    <div style={{
      fontSize: 200,
      lineHeight: 1,
      transform: `scale(${scale * bounce})`,
      filter: "drop-shadow(0 0 60px rgba(255,255,255,0.3))",
      userSelect: "none",
    }}>
      {emoji}
    </div>
  );
}

function AnimatedText({ text, frame, startFrame, color = "white", size = 48, weight = 800, align = "center" as "center" | "left" | "right" }: {
  text: string; frame: number; startFrame: number; color?: string; size?: number; weight?: number; align?: "center" | "left" | "right";
}) {
  const { fps } = useVideoConfig();
  const opacity = spring({ frame: frame - startFrame, fps, from: 0, to: 1, config: { damping: 20 } });
  const y = interpolate(frame, [startFrame, startFrame + 20], [30, 0], { extrapolateRight: "clamp" });

  return (
    <div style={{
      color,
      fontSize: size,
      fontWeight: weight,
      textAlign: align,
      opacity,
      transform: `translateY(${y}px)`,
      fontFamily: "'Inter', sans-serif",
      lineHeight: 1.2,
    }}>
      {text}
    </div>
  );
}

// ─── Composición principal ────────────────────────────────────────────────────

export const InvitacionComposition: React.FC<InvitacionProps> = ({
  celebrantName,
  protagonistEmoji,
  protagonistLabel,
  parentMessage,
  eventDate,
  eventTime,
  venue,
  primaryColor,
  secondaryColor,
  mood,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Partículas decorativas
  const particles = [
    { x: 15, y: 20, size: 12, delay: 10, color: primaryColor },
    { x: 80, y: 15, size: 8,  delay: 20, color: secondaryColor },
    { x: 90, y: 70, size: 14, delay: 5,  color: primaryColor },
    { x: 10, y: 80, size: 10, delay: 15, color: secondaryColor },
    { x: 50, y: 10, size: 6,  delay: 25, color: primaryColor },
    { x: 70, y: 85, size: 9,  delay: 8,  color: secondaryColor },
  ];

  // Glow del fondo pulsante
  const glowOpacity = 0.15 + Math.sin(frame / 30) * 0.05;

  return (
    <AbsoluteFill style={{ background: MOOD_BG[mood] ?? MOOD_BG.fun, fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
      {/* Glow dinámico */}
      <div style={{
        position: "absolute",
        top: "10%",
        left: "20%",
        width: "60%",
        height: "60%",
        borderRadius: "50%",
        background: primaryColor,
        opacity: glowOpacity,
        filter: "blur(120px)",
        pointerEvents: "none",
      }} />

      {/* Partículas */}
      {particles.map((p, i) => <FloatingParticle key={i} {...p} />)}

      {/* ── Secuencia 1: Intro protagonista (0–80 frames) ── */}
      <Sequence from={0} durationInFrames={80}>
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <EmojiProtagonist emoji={protagonistEmoji} frame={frame} fps={fps} />
          <AnimatedText text={protagonistLabel.toUpperCase()} frame={frame} startFrame={15} color={primaryColor} size={40} weight={900} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Secuencia 2: Nombre del protagonista (60–140 frames) ── */}
      <Sequence from={60} durationInFrames={80}>
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "0 80px 120px" }}>
          <AnimatedText text={`¡Es la fiesta de`} frame={frame} startFrame={60} color="rgba(255,255,255,0.6)" size={32} weight={400} />
          <AnimatedText text={celebrantName} frame={frame} startFrame={70} color="white" size={96} weight={900} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Secuencia 3: Mensaje de padres (120–200 frames) ── */}
      <Sequence from={120} durationInFrames={100}>
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 80px", gap: 20 }}>
          {/* Línea decorativa */}
          <div style={{
            width: interpolate(frame, [120, 160], [0, 200], { extrapolateRight: "clamp" }),
            height: 3,
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
            borderRadius: 2,
          }} />
          <div style={{
            fontSize: 36,
            fontWeight: 500,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            lineHeight: 1.5,
            opacity: interpolate(frame, [130, 160], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(frame, [130, 160], [20, 0], { extrapolateRight: "clamp" })}px)`,
          }}>
            {parentMessage}
          </div>
          <div style={{
            width: interpolate(frame, [140, 180], [0, 200], { extrapolateRight: "clamp" }),
            height: 3,
            background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor})`,
            borderRadius: 2,
          }} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Secuencia 4: Detalles de la fiesta (190–280 frames) ── */}
      <Sequence from={190} durationInFrames={90}>
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, padding: "0 80px" }}>
          <AnimatedText text="📅  Fecha y hora" frame={frame} startFrame={190} color={primaryColor} size={28} weight={700} />
          <AnimatedText
            text={`${eventDate}${eventTime ? `  ·  ${eventTime}` : ""}`}
            frame={frame} startFrame={200} color="white" size={40} weight={800}
          />
          <AnimatedText text="📍  Lugar" frame={frame} startFrame={215} color={primaryColor} size={28} weight={700} />
          <AnimatedText text={venue} frame={frame} startFrame={225} color="white" size={36} weight={700} />
        </AbsoluteFill>
      </Sequence>

      {/* ── Secuencia 5: CTA final (260–300 frames) ── */}
      <Sequence from={260} durationInFrames={40}>
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 80 }}>
          <div style={{
            padding: "20px 60px",
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            borderRadius: 999,
            fontSize: 36,
            fontWeight: 900,
            color: "white",
            opacity: spring({ frame: frame - 260, fps, from: 0, to: 1, config: { damping: 15 } }),
            transform: `scale(${spring({ frame: frame - 260, fps, from: 0.8, to: 1, config: { damping: 12 } })})`,
          }}>
            ¡Te esperamos! 🎉
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
