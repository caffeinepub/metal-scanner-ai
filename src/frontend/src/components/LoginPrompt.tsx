import { Button } from "@/components/ui/button";
import { Loader2, Scan, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPrompt() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-24 h-24 bg-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-gold/20 shadow-glow">
          <Scan className="w-12 h-12 text-gold" />
        </div>

        <h2 className="font-display text-4xl font-bold text-foreground mb-3">
          Metal Scanner <span className="text-gold">AI</span>
        </h2>
        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
          Upload a photo of any metal object and get an instant AI-powered
          analysis — purity, value, and metal type.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Zap, label: "Instant AI analysis" },
            { icon: Shield, label: "Accurate results" },
            { icon: Scan, label: "10 metal types" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="rounded-xl p-3 bg-card border border-white/10 text-center"
            >
              <Icon className="w-5 h-5 text-gold mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <Button
          data-ocid="login.primary_button"
          onClick={login}
          disabled={isLoggingIn}
          className="w-full py-6 text-base font-bold bg-gold hover:bg-gold/90 text-black shadow-glow"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing in...
            </>
          ) : (
            "Sign In to Start Scanning"
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Secure login via Internet Identity
        </p>
      </motion.div>
    </main>
  );
}
