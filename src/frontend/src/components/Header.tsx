import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Crown,
  DollarSign,
  History,
  LogOut,
  Menu,
  Scan,
  X,
} from "lucide-react";
import { useState } from "react";
import { useEasyMode } from "../contexts/EasyModeContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSubscription } from "../hooks/useSubscription";

export default function Header() {
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { easyMode, toggleEasyMode } = useEasyMode();
  const { tier } = useSubscription();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            data-ocid="nav.home_link"
            className="flex items-center gap-3 shrink-0"
          >
            <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center shadow-glow-sm">
              <Scan className="w-5 h-5 text-black" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-display font-bold text-foreground leading-none">
                Metal Scanner AI
              </h1>
              <p className="text-[10px] text-muted-foreground">
                AI-Powered Analysis
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              data-ocid="nav.scanner_link"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Scan className="w-4 h-4" /> Scanner
            </Link>
            <Link
              to="/history"
              data-ocid="nav.history_link"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <History className="w-4 h-4" /> History
            </Link>
            <Link
              to="/pricing"
              data-ocid="nav.pricing_link"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <DollarSign className="w-4 h-4" /> Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {tier !== "free" && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30">
                <Crown className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs text-gold font-medium capitalize">
                  {tier}
                </span>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-2">
              <Switch
                id="easy-mode"
                checked={easyMode}
                onCheckedChange={toggleEasyMode}
                data-ocid="header.easymode_toggle"
                className="data-[state=checked]:bg-gold scale-90"
              />
              <Label
                htmlFor="easy-mode"
                className="text-xs text-muted-foreground cursor-pointer select-none"
              >
                Easy
              </Label>
            </div>

            {identity && (
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground hover:bg-white/5 hidden sm:flex"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}

            <button
              type="button"
              className="md:hidden p-2 rounded-lg hover:bg-white/5"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden pt-3 pb-2 border-t border-white/10 mt-3 space-y-1">
            <Link
              to="/"
              data-ocid="nav.scanner_link"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              <Scan className="w-4 h-4 text-gold" /> Scanner
            </Link>
            <Link
              to="/history"
              data-ocid="nav.history_link"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              <History className="w-4 h-4 text-gold" /> History
            </Link>
            <Link
              to="/pricing"
              data-ocid="nav.pricing_link"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              <DollarSign className="w-4 h-4 text-gold" /> Pricing
            </Link>
            <div className="flex items-center justify-between px-3 py-2.5">
              <Label htmlFor="easy-mode-mobile" className="text-sm">
                Easy Mode
              </Label>
              <Switch
                id="easy-mode-mobile"
                checked={easyMode}
                onCheckedChange={toggleEasyMode}
                data-ocid="header.easymode_toggle"
                className="data-[state=checked]:bg-gold"
              />
            </div>
            {identity && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-white/5"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
