"use client";

import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import { useLiveCredits } from "@/lib/useLiveCredits";
import PricingModal from "@/components/PricingModal";

interface CreditsPillProps {
  variant?: "header" | "chat";
  className?: string;
  initialCredits?: number;
  initialPlan?: string;
}

export default function CreditsPill({
  variant = "header",
  className,
  initialCredits,
  initialPlan,
}: CreditsPillProps) {
  const { credits, plan, planMax } = useLiveCredits(
    initialCredits,
    (initialPlan as "free" | "pro" | "starter" | undefined) ?? undefined,
  );

  const noCredits = credits <= 0;
  const headerStyle =
    variant === "header"
      ? "h-8 border border-white/15 bg-white/5 px-3 text-xs text-white/70"
      : "px-2 py-0.5 text-[11px]";

  return (
    <PricingModal reason={noCredits ? "credits" : "upgrade"}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full transition-colors cursor-pointer",
          headerStyle,
          noCredits
            ? "bg-red-500/15 text-red-400/80 hover:bg-red-500/25 border border-red-500/20"
            : variant === "chat"
              ? "bg-white/6 text-white/30 hover:bg-white/10 hover:text-white/50"
              : "hover:border-white/25 hover:text-white/90",
          className,
        )}
      >
        <Zap
          className={cn(
            "h-3 w-3",
            variant === "header" ? "fill-white/70" : "",
            noCredits ? "text-red-400/80" : "",
          )}
        />
        {variant === "header" ? (
          <>
            {credits}
            <span className="text-white/30">/ {planMax} credits</span>
          </>
        ) : noCredits ? (
          "No credits • Upgrade"
        ) : (
          <>
            {credits} credit{credits !== 1 ? "s" : ""}
          </>
        )}
      </span>
    </PricingModal>
  );
}
