import React, { useEffect, useState, useRef } from "react";
import type { Message, StatusStep } from "@/types/workspace";
import PricingModal from "./PricingModal";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { ArrowUp, Check, Loader2, Paperclip, Square, X } from "lucide-react";
import { Button } from "./ui/button";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

interface ChatPanelProps {
  messages: Message[];
  isGenerating: boolean;
  isImproving: boolean;
  statusLog: StatusStep[];
  credits: number;
  initialPrompt: string | null;
  onGenerate: (prompt: string, imageUrl?: string) => Promise<void>;
  userId: string;
  workspaceId: string | null;
  appTitle: string | null;
  onStop : ()=> <void>;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const ChatPanel = ({
  messages,
  isGenerating,
  isImproving,
  statusLog,
  credits,
  initialPrompt,
  onGenerate,
  userId,
  onStop,
  workspaceId,
  appTitle,
}: ChatPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasAutoSubmittedRef = useRef(false);
  const noCredits = credits <= 0;

  const canSubmit =
    input.trim().length > 0 && !isGenerating && !isImproving && !noCredits;

  const statuses = [
    { label: "planning the component structure", status: "done" },
    { label: "Writing App.js and Component", status: "done" },
    { label: "Validating Packages...", status: "running" },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setIsUploading(true);

    try {
      const ext = file.name.split(".").pop();

      const path = `${userId}/${workspaceId ?? "new"}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("workspace-images")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("workspace-images")
        .getPublicUrl(path);
      setPendingImageUrl(data.publicUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating || isImproving || noCredits) return;

    setInput("");
    setPendingImageUrl(null);
    await onGenerate(trimmed, pendingImageUrl ?? undefined);
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // auto-resize textarea as user types
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  // Auto-scroll on new messages or streaming updates
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isGenerating, isImproving]);

  useEffect(() => {
    if (!initialPrompt || hasAutoSubmittedRef.current || messages.length > 0)
      return;
    hasAutoSubmittedRef.current = true;
    onGenerate(initialPrompt);
  }, []);

  return (
    <div className="flex w-[320px] shrink-0 flex-col bg-[#0d0d0d]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
        <h3 className="text-[18.5px] font-semibold">{appTitle}</h3>
        <PricingModal reason={noCredits ? "credits" : "upgrade"}>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] transition-colors",
              noCredits
                ? "bg-red-500/15 text-red-400/80 hover:bg-red-500/25"
                : "bg-white/6 text-white/30 hover:bg-white/10 hover:text-white/50",
            )}
          >
            {noCredits
              ? "No credits • Upgrade"
              : `${credits} credit${credits !== 1 ? "s" : ""}`}
          </span>
        </PricingModal>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 [&::-webkit-scrollbar]:hidden"
      >
        {messages.length === 0 && !isGenerating ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-xs text-white/20">
              Describe What You want to Build...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" ? (
                  <div className="flex items-start justify-end gap-2">
                    <div className="max-w-[85%] space-y-1.5">
                      {/* TODO : show msg.imageUrl thumbnail if present */}
                      <div className="rounded-2xl rounded-br-sm bg-white/10 px-3.5 py-2.5">
                        <p className="text-[13px] leading-relaxed text-white/80 break-words">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Image
                      src="/favicon.png"
                      width={24}
                      height={24}
                      className="mt-0.5 h-6 w-6 shrink-0 rounded-md"
                      alt="Prixis"
                    />
                    <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm bg-white/5 px-3.5 py-2.5">
                      <div className="text-[13px] leading-relaxed text-white/70 break-words [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1 [&_strong]:font-semibold [&_strong]:text-white/90">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* status Steps - Shown While isGenerating */}
        {isGenerating && (
          <div className="flex items-start gap-2">
            <Image
              src="/favicon.png"
              width={24}
              height={24}
              className="mt-0.5 h-6 w-6 shrink-0 rounded-md"
              alt="Prixis"
            />
            <div className="rounded-2xl rounded-tl-sm bg-white/5 px-3.5 py-3">
              <div className="space-y-2">
                {statusLog.map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                      {step.status === "running" ? (
                        <Loader2 className="h-3 w-3 animate-spin text-blue-400/80" />
                      ) : (
                        <svg
                          className="h-3 w-3 text-white/25"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <Check className="h-3 w-3 text-blue-400/25" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[12px] transition-colors duration-300",
                        step.status === "running"
                          ? "text-white/75"
                          : "text-white/25",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-white/6 p-3">
        {pendingImageUrl && (
          <div className="relative mb-2 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImageUrl}
              alt="pending upload"
              className="h-16 w-16 rounded-lg object-cover"
            />
            <button
              onClick={() => setPendingImageUrl(null)}
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/80 text-white/60 hover:text-white"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        )}

        <div
          className={cn(
            "rounded-xl border bg-white/4 transition-colors",
            isGenerating || isImproving
              ? "border-white/4"
              : noCredits
                ? "border-white/4 opacity-60"
                : "border-white/8 hover:border-white/12",
          )}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating || isImproving || noCredits}
            placeholder={
              noCredits
                ? "Upgrade to Keep Building"
                : isImproving
                  ? "praxis is improving Your app"
                  : isGenerating
                    ? "Generating"
                    : "Ask AI to modify..."
            }
            rows={1}
            className="w-full max-h-[160px] overflow-y-auto  resize-none bg-transparent px-3.5 pb-2 pt-3 text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none"
          />

          <div className="flex items-center justify-between px-2 pb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileRef.current?.click()}
              disabled={isGenerating || isImproving || isUploading || noCredits}
              className="h-7 w-7 rounded-lg text-white/25  hover:bg-white/6 hover:text-white/50 disabled:opacity-40"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Paperclip className="h-3.5 w-3.5" />
              )}
            </Button>

            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {isGenerating || isImproving ? (
              <Button
                size="icon"
                onClick={onStop}
                className="h-7 w-7 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white active:scale-95 transition-all"
              >
                <Square className="h-3 w-3 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  "h-7 w-7 rounded-lg transition-all",
                  canSubmit
                    ? "bg-white text-black hover:bg-white/90 active:scale-95"
                    : "bg-white/8 text-white/20 shadow-none"
                )}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

          <p className="mt-1.5 text-center text-[10px] text-white/15">
           {isGenerating || isImproving
            ? "Click ■ to stop generation"
            : "⏎ to send · Shift+⏎ for new line"}
          </p>
      </div>
    </div>
  );
};

export default ChatPanel;
