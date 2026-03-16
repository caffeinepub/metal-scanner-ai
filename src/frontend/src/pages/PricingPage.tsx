import { Button } from "@/components/ui/button";
import { Check, Crown, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useSubscription } from "../hooks/useSubscription";

const MONTHLY_LINK = import.meta.env.VITE_STRIPE_MONTHLY_LINK as
  | string
  | undefined;
const LIFETIME_LINK = import.meta.env.VITE_STRIPE_LIFETIME_LINK as
  | string
  | undefined;

const FREE_FEATURES = [
  "Scan Silver metal",
  "Basic probability scores",
  "Visual clues analysis",
  "Save to scan history",
];

const PAID_FEATURES = [
  "Scan all 10 metal types",
  "Gold, Silver, Copper, Steel",
  "Zinc, Aluminium, Titanium",
  "Nickel, Lead, Iron",
  "Purity & value estimates",
  "Full AI confidence reports",
  "Unlimited scan history",
];

export default function PricingPage() {
  const { tier } = useSubscription();

  const handleMonthly = () => {
    if (MONTHLY_LINK) window.location.href = MONTHLY_LINK;
    else window.alert("Please contact support to upgrade to the Monthly plan.");
  };

  const handleLifetime = () => {
    if (LIFETIME_LINK) window.location.href = LIFETIME_LINK;
    else
      window.alert("Please contact support to upgrade to the Lifetime plan.");
  };

  return (
    <main className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold mb-3">
          Simple, <span className="text-gold">Transparent</span> Pricing
        </h1>
        <p className="text-muted-foreground text-lg">
          Unlock all metals and get the most accurate AI analysis
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Free tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="rounded-2xl border border-white/10 bg-card p-6 flex flex-col"
        >
          <div className="mb-5">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
              Free
            </p>
            <div className="flex items-end gap-1">
              <span className="font-display text-4xl font-bold">$0</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Forever free</p>
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {FREE_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-lg py-2.5 text-center text-sm bg-white/5 text-muted-foreground border border-white/10">
            {tier === "free" ? "✓ Current Plan" : "Basic Access"}
          </div>
        </motion.div>

        {/* Monthly */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/20 bg-card p-6 flex flex-col"
        >
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-4 h-4 text-gold" />
              <p className="text-sm text-gold uppercase tracking-wider">
                Monthly
              </p>
            </div>
            <div className="flex items-end gap-1">
              <span className="font-display text-4xl font-bold">$2</span>
              <span className="text-muted-foreground mb-1">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Cancel anytime</p>
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {PAID_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button
            data-ocid="pricing.monthly_button"
            onClick={handleMonthly}
            disabled={tier === "monthly" || tier === "lifetime"}
            variant="outline"
            className="w-full border-gold/40 hover:bg-gold/10 text-gold"
          >
            {tier === "monthly"
              ? "✓ Current Plan"
              : tier === "lifetime"
                ? "Lifetime Active"
                : "Upgrade to Monthly"}
          </Button>
        </motion.div>

        {/* Lifetime - recommended */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border-2 border-gold bg-card p-6 flex flex-col relative shadow-glow"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-gold text-black text-xs font-bold px-3 py-1 rounded-full">
              BEST VALUE
            </span>
          </div>
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-1">
              <Crown className="w-4 h-4 text-gold" />
              <p className="text-sm text-gold uppercase tracking-wider">
                Lifetime
              </p>
            </div>
            <div className="flex items-end gap-1">
              <span className="font-display text-4xl font-bold text-gold">
                $10
              </span>
              <span className="text-muted-foreground mb-1">one-time</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Pay once, use forever
            </p>
          </div>
          <ul className="space-y-2.5 flex-1 mb-6">
            {PAID_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button
            data-ocid="pricing.lifetime_button"
            onClick={handleLifetime}
            disabled={tier === "lifetime"}
            className="w-full bg-gold hover:bg-gold/90 text-black font-bold shadow-glow"
          >
            {tier === "lifetime" ? "✓ Current Plan" : "Get Lifetime Access"}
          </Button>
        </motion.div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">
        Payments processed securely by Stripe. No hidden fees.
      </p>
    </main>
  );
}
