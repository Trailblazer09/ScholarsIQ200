"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, ImagePlus, Square, X, GraduationCap, Trash2, Heart, FileDown, Loader2 } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { EmptyState } from "@/components/EmptyState";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VoiceButton } from "@/components/VoiceButton";
import { Brand } from "@/components/Brand";
import { TipsButton } from "@/components/TipsButton";
import { ParallaxBackground } from "@/components/ParallaxBackground";

/** Build a FileList (what the SDK expects) from an array of File objects. */
function toFileList(files: File[]): FileList | undefined {
  if (!files.length) return undefined;
  const dt = new DataTransfer();
  files.forEach((f) => dt.items.add(f));
  return dt.files;
}

export default function Page() {
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState<{ text: string; files: File[] } | null>(
    null,
  );
  const [exportingPdf, setExportingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  const busy = status === "submitted" || status === "streaming";

  // Export the whole conversation to a downloaded PDF file.
  async function exportPdf() {
    const node = messagesRef.current;
    if (!node || exportingPdf) return;
    setExportingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      // Build an offscreen, light-themed clone of the conversation.
      const wrapper = document.createElement("div");
      wrapper.className = "pdf-export";
      wrapper.style.position = "fixed";
      wrapper.style.left = "-10000px";
      wrapper.style.top = "0";
      wrapper.style.width = "760px";

      const header = document.createElement("div");
      header.style.cssText =
        "display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #cbd5e1;padding-bottom:12px;margin-bottom:20px;font-family:system-ui,sans-serif";
      header.innerHTML = `<div style="font-weight:700;font-size:20px;color:#0f172a">Scholars<span style="color:#0a7d4f">IQ200</span></div><div style="font-size:12px;color:#475569">Chat export · ${new Date().toLocaleString()}</div>`;
      wrapper.appendChild(header);
      wrapper.appendChild(node.cloneNode(true));
      document.body.appendChild(wrapper);

      const canvas = await html2canvas(wrapper, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;

      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
        heightLeft -= pageH;
      }
      pdf.save(`ScholarsIQ200-chat-${Date.now()}.pdf`);
    } catch (err) {
      console.error("[pdf] export failed:", err);
      alert("Sorry, the PDF export failed. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  }

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  // Auto-grow the textarea.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  function submit() {
    const text = input.trim();
    if (!text && files.length === 0) return;
    if (busy) {
      // Interrupt: stop the current response and queue this message. It is sent
      // once the stream has fully torn down (see effect below), which avoids a
      // race in the AI SDK when sending immediately after abort.
      setPending({ text, files });
      stop();
    } else {
      sendMessage({
        text: text || "(see attached image)",
        files: toFileList(files),
      });
    }
    setInput("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Send a queued (interrupting) message once the previous response has ended.
  useEffect(() => {
    if (!pending) return;
    if (status === "ready" || status === "error") {
      const p = pending;
      setPending(null);
      sendMessage({
        text: p.text || "(see attached image)",
        files: toFileList(p.files),
      });
    }
  }, [pending, status, sendMessage]);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    setFiles((prev) => [...prev, ...picked].slice(0, 4));
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function clearChat() {
    if (busy) stop();
    setMessages([]);
    setInput("");
    setFiles([]);
  }

  return (
    <div className="flex h-dvh flex-col print:block print:h-auto">
      <ParallaxBackground />
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/70 backdrop-blur-xl print:hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 sm:px-6">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white shadow-sm shadow-accent/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <Brand className="text-base text-foreground" />
          <div className="ml-auto flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={exportPdf}
                disabled={exportingPdf}
                title="Download chat as PDF"
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface/60 px-3 text-sm font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground disabled:opacity-60"
              >
                {exportingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin text-brand" />
                ) : (
                  <FileDown className="h-4 w-4 text-brand" />
                )}
                <span className="hidden sm:inline">
                  {exportingPdf ? "Saving…" : "PDF"}
                </span>
              </button>
            )}
            <TipsButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className={
          messages.length === 0
            ? "flex flex-1 items-center overflow-hidden"
            : "flex-1 overflow-y-auto print:h-auto print:overflow-visible"
        }
      >
        {messages.length === 0 ? (
          <div className="mx-auto w-full max-w-3xl px-4">
            <EmptyState
              onPick={(prompt) => {
                sendMessage({ text: prompt });
              }}
            />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 py-6">
            {/* Print-only document header */}
            <div className="mb-6 hidden items-center justify-between border-b border-border pb-3 print:flex">
              <Brand className="text-lg" />
              <span className="text-xs text-muted-foreground">
                Chat export · {new Date().toLocaleDateString()}
              </span>
            </div>
            <div ref={messagesRef} className="space-y-6">
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  isStreaming={
                    busy && m.id === messages[messages.length - 1]?.id
                  }
                />
              ))}
              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
                  Something went wrong. Please try again.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background/70 backdrop-blur-xl print:hidden">
        <div className="mx-auto max-w-3xl px-4 py-3">
          {messages.length > 0 && (
            <div className="mb-2 flex justify-end">
              <button
                onClick={clearChat}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface/60 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear chat
              </button>
            </div>
          )}
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface/80 p-2 shadow-sm backdrop-blur transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              aria-label="Attach image"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
              className="hidden"
            />

            <VoiceButton
              disabled={busy}
              onTranscript={(text) =>
                setInput((prev) => (prev ? `${prev} ${text}` : text))
              }
            />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder="Ask anything. Type, attach an image, or use the mic…"
              className="max-h-[200px] flex-1 resize-none bg-transparent py-2 text-[0.95rem] text-foreground outline-none placeholder:text-muted-foreground"
            />

            {busy && !input.trim() && files.length === 0 ? (
              <button
                onClick={stop}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-foreground transition-colors hover:bg-border"
                aria-label="Stop"
              >
                <Square className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!input.trim() && files.length === 0}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white transition-opacity disabled:opacity-40"
                aria-label={busy ? "Interrupt and send" : "Send"}
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-medium text-muted-foreground">
            {["Multimodal", "RAG", "Tool-calling", "Voice", "Groq"].map(
              (tag, i) => (
                <span key={tag} className="flex items-center gap-2">
                  {i > 0 && <span className="text-border">•</span>}
                  {tag}
                </span>
              ),
            )}
            <span className="flex items-center gap-1.5">
              <span className="text-border">•</span>
              Made with
              <Heart className="h-3 w-3 fill-red-500 text-red-500" />
              by Anmol Agarwal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
