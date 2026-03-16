import { Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const link = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;
  return (
    <footer className="mt-auto border-t border-white/10 bg-background/80">
      <div className="container mx-auto px-4 py-5">
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          © {year}. Built with{" "}
          <Heart className="w-3.5 h-3.5 text-gold fill-gold" /> using{" "}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-gold/80 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
