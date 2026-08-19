"use client";

import { Badge } from "@/components/ui/badge";
import SoftAurora from "@/components/SoftAurora";
import { cn } from "@/lib/utils";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { PLACEHOLDERS, FEATURES, STEPS, SUGGESTIONS } from "@/lib/data";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { ArrowRight } from "lucide-react";

const Home = () => {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
    if (isFocused || prompt) return;
    const t = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(t);
  }, [isFocused, prompt]);

  
    useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [prompt]);

  
  const handleSubmit = () => {
    if (!prompt.trim() || !isSignedIn) return;
    router.push(`/workspace?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  // submit on Enter, Allow Shift + Enter For Newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (s: string) => {
    setPrompt(s);
    textareaRef.current?.focus();
  };

  return (
    <main className="min-h-screen w-full bg-black selection:bg-white/20 ">

        {/* hero section */}
      <section className="relative flex flex-col items-center overflow-hidden px-4 pb-15 pt-30 text-center ">
        <SoftAurora
          className="absolute inset-0 h-full w-full mt-20 lg:mt-30  "
          speed={0.6}
          scale={1.5}
          brightness={1}
          color1="#f7f7f7"
          color2="#e100ff"
          noiseFrequency={2.5}
          noiseAmplitude={1}
          bandHeight={0.5}
          bandSpread={1}
          octaveDecay={0.1}
          layerOffset={1}
          colorSpeed={1}
          enableMouseInteraction
          mouseInfluence={0}
        />

        <Badge
          variant={"outline"}
          className="gap-2 p-4 backdrop-blur-sm border border-white/20"
        >
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Powered by Gemini 3.5 Flash
        </Badge>

        <h1 className="mx-auto max-w-3xl text-balance text-5xl leading-tight tracking-tight sm:text-5xl lg:text-7xl z-10">
          Have an idea? <br /> Let’s build it.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-white/80 z-10">
          Describe what you want to build. AI writes the code, picks the
          packages, and renders a live preview all inside your browser.
        </p>

        {/* prompt Box */}
        <div className="relative mx-auto mt-12 w-full max-w-2xl">
          <div
            className={cn(
              "rounded-2xl border bg-[#111111]/80 backdrop-blur-2xl  duration-200",
              isFocused
                ? "border-white/20 ring-1 ring-white/8"
                : "border-white/8",
            )}
          >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={PLACEHOLDERS[placeholderIndex]}
              rows={1}
              className="w-full resize-none bg-transparent px-5 pb-4 pt-5 text-sm placeholder:text-white/40 focus:outline-none sm:text-base"
              style={{ minHeight: 56, maxHeight: 200 }}
            />

            <div className="flex items-center justify-between border-t border-white/6 px-4 py-2.5">
              <span className="text-xs text-white/50">
                Press ⏎ to generate · Shift+⏎ for new line
              </span>

              {isSignedIn ? (
                <RainbowButton
                  onClick={handleSubmit}
                  disabled={!prompt.trim()}
                  variant={'default'}
                  className="h-8 rounded-sm px-3 font-semibold gap-1.5"
                >
                  Generate
                  <ArrowRight className="h-3.5 w-3.5" />
                </RainbowButton>
              ) : (
                <SignInButton mode="modal">
                  <RainbowButton 
                  className="h-8 rounded-sm px-3 font-semibold gap-1.5"
                  variant={"default"}
                  >
                    Generate
                    <ArrowRight className="h-3.5 w-3.5" />
                  </RainbowButton>
                </SignInButton>
              )}
            </div>
          </div>

             <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-white/40 hover:border-white/15 hover:bg-white/8 hover:text-white/70"
              >
                {s}
              </button>
            ))}
            </div>
        </div>
      </section>
    </main>
  );
};

export default Home;