import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, Crown, Scan } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useSubscription } from "../hooks/useSubscription";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { setTier } = useSubscription();

  useEffect(() => {
    // Set lifetime tier on payment success
    setTier("lifetime");
  }, [setTier]);

  return (
    <main className="container mx-auto px-4 py-16 max-w-lg text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>

        <h1 className="font-display text-4xl font-bold mb-3">
          Payment <span className="text-gold">Successful!</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          Welcome to Metal Scanner AI Lifetime. You now have access to all 10
          metal types and unlimited scans.
        </p>

        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6 mb-8">
          <Crown className="w-8 h-8 text-gold mx-auto mb-2" />
          <p className="font-semibold text-gold">Lifetime Access Activated</p>
          <p className="text-sm text-muted-foreground mt-1">
            All metals unlocked · Unlimited history · Full AI reports
          </p>
        </div>

        <Button
          data-ocid="payment_success.primary_button"
          onClick={() => navigate({ to: "/" })}
          className="w-full bg-gold hover:bg-gold/90 text-black font-bold py-6 text-lg shadow-glow"
        >
          <Scan className="w-5 h-5 mr-2" /> Start Scanning
        </Button>
      </motion.div>
    </main>
  );
}
