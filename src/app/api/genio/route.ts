import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// ─── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres el Genio de Cumplefy, un asistente mágico especializado en organizar celebraciones perfectas en España. Tu personalidad es entusiasta, cálida y un poco mágica — como un genio que concede deseos de celebración.

Tu misión:
- Ayudar a los usuarios a organizar cumpleaños, bodas, bautizos, comuniones, graduaciones, despedidas, navidad y eventos de empresa
- Guiarlos para crear su evento en Cumplefy (la plataforma)
- Sugerir ideas creativas para cada tipo de celebración
- Responder preguntas sobre funcionalidades: videoinvitaciones IA, lista de regalos, RSVP automático, página del evento

Reglas de tono:
- Responde siempre en español
- Sé conciso: máximo 3-4 frases por respuesta
- Usa emojis con moderación (1-2 por mensaje)
- Termina con una pregunta o CTA cuando sea relevante
- Si no sabes algo específico de Cumplefy, sugiere que visiten la web para más info

Precios de Cumplefy:
- Plan Gratuito: Hasta 30 invitados, página básica del evento, RSVP ilimitado, lista de regalos básica
- Plan Pro (9€/mes): Invitados ilimitados, videoinvitación IA, dominio personalizado, soporte prioritario

URLs útiles:
- Crear evento: /crear-evento
- Cumpleaños: /cumpleanos
- Bodas: /bodas
- Bautizos: /bautizos
- Navidad: /navidad
- Eventos empresa: /eventos-empresa`;

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], voice = false } = await req.json() as {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
      voice: boolean;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // Build messages for Anthropic
    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    });

    const reply =
      response.content[0].type === "text" ? response.content[0].text : "¡Hola! ¿En qué puedo ayudarte con tu celebración?";

    // Optional ElevenLabs TTS
    let audioUrl: string | null = null;
    if (voice && process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) {
      try {
        const ttsRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": process.env.ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: reply,
              model_id: "eleven_multilingual_v2",
              voice_settings: { stability: 0.5, similarity_boost: 0.8 },
            }),
          }
        );

        if (ttsRes.ok) {
          const audioBuffer = await ttsRes.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString("base64");
          audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
        }
      } catch {
        // TTS failure is non-fatal — reply still returns
      }
    }

    return NextResponse.json({ reply, audioUrl });
  } catch (err) {
    console.error("[/api/genio]", err);
    return NextResponse.json(
      { reply: "Lo siento, el Genio está ocupado ahora mismo. ¡Inténtalo de nuevo en un momento! ✨" },
      { status: 500 }
    );
  }
}
