"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { PLANS } from "@/lib/constants";
import type { Plan } from "@/types/plans";

type CreditsState = {
  credits: number | null;
  plan: Plan | null;
};

type Listener = () => void;

let state: CreditsState = { credits: null, plan: null };
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const creditsStore = {
  getState(): CreditsState {
    return state;
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setCredits(credits: number, plan?: Plan): void {
    state = {
      credits,
      plan: plan ?? state.plan ?? "free",
    };
    emit();
  },
  setPlan(plan: Plan): void {
    state = { credits: state.credits, plan };
    emit();
  },
};

/**
 * Returns the live synced credits count across the whole app.
 * - WorkspaceClient calls `setCredits(value, plan)` from SSE `done` events.
 * - CreditsPill (header/chat) re-renders automatically via `useSyncExternalStore`.
 * Falls back to `initialCredits` (SSR prop) until live data arrives.
 */
export function useLiveCredits(initialCredits?: number, initialPlan?: Plan) {
  const hasSeenInitial = useRefInitialHydrate(initialCredits, initialPlan);

  const snapshot = useSyncExternalStore(
    creditsStore.subscribe,
    creditsStore.getState,
    creditsStore.getState,
  );

  const credits = snapshot.credits ?? initialCredits ?? 0;
  const plan = (snapshot.plan ?? initialPlan ?? "free") as Plan;
  const planMax = PLANS[plan]?.credits ?? 0;

  return {
    credits,
    plan,
    planMax,
    isInitialized: hasSeenInitial || snapshot.credits !== null,
  };
}

// Ensures that when server components pass initial SSR values, we store them
// once so even components that don't receive props (e.g. Header CreditsPill)
// still show something meaningful before the first SSE update.
function useRefInitialHydrate(
  initialCredits?: number,
  initialPlan?: Plan,
): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (hydrated) return;
    if (typeof initialCredits === "number") {
      if (
        state.credits === null ||
        state.credits < initialCredits // SSR newer snapshot wins (e.g. after router.refresh())
      ) {
        state = {
          credits: initialCredits,
          plan: (initialPlan ?? state.plan ?? "free") as Plan,
        };
        emit();
      }
    } else if (initialPlan && state.plan !== initialPlan) {
      state = { credits: state.credits, plan: initialPlan };
      emit();
    }
    setHydrated(true);
  }, [initialCredits, initialPlan, hydrated]);
  return hydrated;
}
