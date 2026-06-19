import { experimental_transcribe as transcribe } from "ai";
import { groq } from "@/lib/groq";

export const maxDuration = 30;

/**
 * Speech-to-text endpoint. Receives a recorded audio blob (multipart form,
 * field "audio") and transcribes it with Groq's Whisper model.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("audio");

    if (!(file instanceof Blob)) {
      return Response.json({ error: "No audio provided." }, { status: 400 });
    }

    const audio = new Uint8Array(await file.arrayBuffer());

    const result = await transcribe({
      model: groq.transcription("whisper-large-v3-turbo"),
      audio,
      providerOptions: { groq: { language: "en" } },
    });

    return Response.json({ text: result.text.trim() });
  } catch (err) {
    console.error("[transcribe] failed:", err);
    return Response.json({ error: "Transcription failed." }, { status: 500 });
  }
}
