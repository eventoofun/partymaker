"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "genio";
  content: string;
  ts: number;
}

// ─── Quick Replies ─────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  { label: "🎂 Cumpleaños", text: "Quiero organizar un cumpleaños" },
  { label: "💍 Boda",       text: "Necesito ayuda con mi boda" },
  { label: "🎓 Graduación", text: "Voy a organizar una graduación" },
  { label: "🥂 Despedida",  text: "Quiero organizar una despedida" },
];

// ─── ChatBubble ───────────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: Message }) {
  const isGenio = msg.role === "genio";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-end",
        flexDirection: isGenio ? "row" : "row-reverse",
        marginBottom: 12,
      }}
    >
      {isGenio && (
        <Image
          src="/genio.png"
          alt="Genio"
          width={28}
          height={28}
          style={{ borderRadius: "50%", flexShrink: 0, objectFit: "contain" }}
        />
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 14px",
          borderRadius: isGenio ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
          background: isGenio
            ? "rgba(0,194,209,0.12)"
            : "linear-gradient(135deg,#00C2D1,#FFB300)",
          color: isGenio ? "#e2e8f0" : "#020409",
          fontSize: 14,
          lineHeight: 1.5,
          border: isGenio ? "1px solid rgba(0,194,209,0.2)" : "none",
          fontWeight: isGenio ? 400 : 600,
        }}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

// ─── TypingIndicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
      <Image src="/genio.png" alt="Genio" width={28} height={28} style={{ borderRadius: "50%", objectFit: "contain" }} />
      <div style={{ padding: "10px 16px", borderRadius: "4px 18px 18px 18px", background: "rgba(0,194,209,0.12)", border: "1px solid rgba(0,194,209,0.2)", display: "flex", gap: 4, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C2D1" }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GenioChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "genio",
          content: "¡Hola! Soy el Genio 🧞. Puedo ayudarte a organizar cualquier celebración. ¿Qué tipo de evento quieres crear?",
          ts: Date.now(),
        },
      ]);
    }
  }, [open, messages.length]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role === "genio" ? "assistant" : "user",
        content: m.content,
      }));

      const res = await fetch("/api/genio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history, voice: voiceEnabled }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "genio", content: data.reply ?? "Lo siento, no pude procesar tu mensaje.", ts: Date.now() },
      ]);

      if (voiceEnabled && data.audioUrl) {
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = new Audio(data.audioUrl);
        audioRef.current.play().catch(() => {});
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "genio", content: "Hubo un problema de conexión. ¿Lo intentamos de nuevo?", ts: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, voiceEnabled]);

  const toggleListening = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.lang = "es-ES";
    rec.continuous = false;
    rec.interimResults = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      sendMessage(transcript);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, sendMessage]);

  const showQuickReplies = messages.length === 1 && messages[0].role === "genio";

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#00C2D1,#FFB300)",
          border: "none",
          cursor: "pointer",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 0 0 rgba(0,194,209,0.4)",
          animation: open ? "none" : "genio-pulse 2s ease-in-out infinite",
          padding: 0,
        }}
        aria-label="Abrir chat con el Genio"
        data-genio-trigger="true"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
              <X size={28} color="#020409" />
            </motion.div>
          ) : (
            <motion.div key="genio" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
              <Image src="/genio.png" alt="Genio" width={52} height={52} style={{ objectFit: "contain" }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
              position: "fixed",
              bottom: 112,
              right: 28,
              width: 420,
              maxWidth: "calc(100vw - 32px)",
              height: 600,
              maxHeight: "calc(100vh - 140px)",
              background: "#0D1117",
              border: "1px solid rgba(0,194,209,0.25)",
              borderRadius: 20,
              boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,194,209,0.1)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 9998,
            }}
          >
            {/* Header */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(0,194,209,0.15)", display: "flex", alignItems: "center", gap: 10, background: "rgba(0,194,209,0.05)" }}>
              <Image src="/genio.png" alt="Genio" width={36} height={36} style={{ objectFit: "contain" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 15 }}>El Genio</div>
                <div style={{ fontSize: 12, color: "#00C2D1", display: "flex", alignItems: "center", gap: 4 }}>
                  <Sparkles size={10} />
                  Asistente de celebraciones IA
                </div>
              </div>
              <button
                onClick={() => setVoiceEnabled((v) => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: voiceEnabled ? "#00C2D1" : "#4a5568" }}
                title={voiceEnabled ? "Desactivar voz" : "Activar voz"}
              >
                {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#4a5568" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", scrollbarWidth: "thin", scrollbarColor: "rgba(0,194,209,0.2) transparent" }}>
              {messages.map((msg) => (
                <ChatBubble key={msg.ts} msg={msg} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <AnimatePresence>
              {showQuickReplies && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ padding: "0 12px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}
                >
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr.label}
                      onClick={() => sendMessage(qr.text)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 20,
                        border: "1px solid rgba(0,194,209,0.3)",
                        background: "rgba(0,194,209,0.08)",
                        color: "#00C2D1",
                        fontSize: 13,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {qr.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div style={{ padding: "10px 12px 14px", borderTop: "1px solid rgba(0,194,209,0.15)", display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={toggleListening}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  background: listening ? "rgba(255,77,109,0.2)" : "rgba(0,194,209,0.1)",
                  color: listening ? "#FF4D6D" : "#00C2D1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  animation: listening ? "genio-pulse 1s ease-in-out infinite" : "none",
                }}
                title={listening ? "Parar grabación" : "Hablar"}
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Escribe o habla con el Genio..."
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(0,194,209,0.2)",
                  borderRadius: 12,
                  padding: "9px 14px",
                  color: "#e2e8f0",
                  fontSize: 14,
                  outline: "none",
                }}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  border: "none",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  background: input.trim() && !loading
                    ? "linear-gradient(135deg,#00C2D1,#FFB300)"
                    : "rgba(255,255,255,0.05)",
                  color: input.trim() && !loading ? "#020409" : "#4a5568",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes genio-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,194,209,0.4); }
          50%       { box-shadow: 0 0 0 14px rgba(0,194,209,0); }
        }
      `}</style>
    </>
  );
}
