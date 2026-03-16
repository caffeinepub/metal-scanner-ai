import { useEffect, useState } from "react";

export type SubscriptionTier = "free" | "monthly" | "lifetime";

const STORAGE_KEY = "metalscanner_tier";

export function useSubscription() {
  const [tier, setTierState] = useState<SubscriptionTier>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "monthly" || stored === "lifetime") return stored;
    return "free";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, tier);
  }, [tier]);

  const setTier = (t: SubscriptionTier) => {
    localStorage.setItem(STORAGE_KEY, t);
    setTierState(t);
  };

  const isPaid = tier === "monthly" || tier === "lifetime";

  return { tier, setTier, isPaid };
}
