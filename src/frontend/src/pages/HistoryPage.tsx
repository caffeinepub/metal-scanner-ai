import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Clock, History, Scan } from "lucide-react";
import { motion } from "motion/react";
import type { ScanRecord } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetScanHistory } from "../hooks/useQueries";
import { METALS, formatTimestamp, getMetalColor } from "../utils/metals";

function getMetalLabel(type: string): string {
  return METALS.find((m) => m.key === type)?.label ?? type;
}

function HistoryItem({
  record,
  index,
  onClick,
}: { record: ScanRecord; index: number; onClick: () => void }) {
  const topMetal = record.analysisResult.metalType as string;
  const color = getMetalColor(topMetal);
  const label = getMetalLabel(topMetal);
  const confidence = Number(record.analysisResult.confidenceScore);
  const date = formatTimestamp(record.timestamp);

  const emoji =
    topMetal === "gold"
      ? "🥇"
      : topMetal === "silver"
        ? "🥈"
        : topMetal === "copper"
          ? "🟤"
          : "⚙️";

  return (
    <motion.button
      type="button"
      data-ocid={`history.item.${index}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="w-full text-left rounded-xl border border-white/10 bg-card hover:border-white/20 hover:bg-card/80 transition-all p-4 flex items-center gap-4 group"
    >
      <div
        className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center"
        style={{ background: `${color}22`, border: `1.5px solid ${color}50` }}
      >
        <span className="text-xl">{emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold capitalize" style={{ color }}>
            {label}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: `${color}20`, color }}
          >
            {confidence}% confidence
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        {record.weightGrams != null && (
          <span className="text-xs text-muted-foreground">
            Weight: {record.weightGrams}g
          </span>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </motion.button>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: scans, isLoading } = useGetScanHistory();

  if (!identity) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">
          Please sign in to view your scan history.
        </p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <History className="w-6 h-6 text-gold" />
        <h1 className="font-display text-2xl font-bold">Scan History</h1>
      </div>

      {isLoading && (
        <div data-ocid="history.loading_state" className="space-y-3">
          {[...Array(4)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static list
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (!scans || scans.length === 0) && (
        <motion.div
          data-ocid="history.empty_state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
            <Scan className="w-10 h-10 text-gold/50" />
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">
            No scans yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Your scan history will appear here after your first analysis.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="px-6 py-3 rounded-xl bg-gold text-black font-semibold hover:bg-gold/90 transition-colors"
          >
            Start Scanning
          </button>
        </motion.div>
      )}

      {!isLoading && scans && scans.length > 0 && (
        <div className="space-y-3">
          {[...scans].reverse().map((record, idx) => (
            <HistoryItem
              key={String(record.id)}
              record={record}
              index={idx + 1}
              onClick={() => navigate({ to: `/scan/${String(record.id)}` })}
            />
          ))}
        </div>
      )}
    </main>
  );
}
