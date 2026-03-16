import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { ScanRecord } from "../backend";
import ScanResults from "../components/ScanResults";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { GeminiAnalysisResult } from "../utils/gemini";
import { formatTimestamp } from "../utils/metals";

function recordToGeminiResult(
  record: ScanRecord,
  ironProbability = 0,
): GeminiAnalysisResult {
  const r = record.analysisResult;
  const topMetal = r.metalType as string;
  return {
    goldProbability: Number(r.goldProbability),
    silverProbability: Number(r.silverProbability),
    copperProbability: Number(r.copperProbability),
    steelProbability: Number(r.steelProbability),
    zincProbability: Number(r.zincProbability),
    aluminiumProbability: Number(r.aluminiumProbability),
    titaniumProbability: Number(r.titaniumProbability),
    nickelProbability: Number(r.nickelProbability),
    leadProbability: Number(r.leadProbability),
    ironProbability,
    topMetal,
    purityRange: r.purityEstimate
      ? `${Number(r.purityEstimate)}% pure`
      : "Unknown",
    estimatedValueRange: r.estimatedValueUSD
      ? `$${Number(r.estimatedValueUSD)}`
      : "Unknown",
    confidenceLevel:
      Number(r.confidenceScore) >= 75
        ? "High - Strong confidence"
        : Number(r.confidenceScore) >= 50
          ? "Medium - Moderate confidence"
          : "Low - Uncertain result",
    visualClues: [],
  };
}

export default function ScanDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  const {
    data: record,
    isLoading,
    error,
  } = useQuery<ScanRecord>({
    queryKey: ["scanDetail", id],
    queryFn: async () => {
      if (!actor || !identity) throw new Error("Not authenticated");
      return actor.getScanById(identity.getPrincipal(), BigInt(id));
    },
    enabled: !!actor && !!identity && !!id,
  });

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/history" })}
        className="mb-5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
      </Button>

      {isLoading && (
        <div
          data-ocid="scan_detail.loading_state"
          className="flex items-center justify-center py-20"
        >
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      )}

      {error && (
        <div data-ocid="scan_detail.error_state" className="text-center py-20">
          <p className="text-destructive">Failed to load scan details.</p>
        </div>
      )}

      {record && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Scan #{id}</span>
            <span>·</span>
            <span>{formatTimestamp(record.timestamp)}</span>
          </div>
          <ScanResults
            result={recordToGeminiResult(record)}
            weightGrams={record.weightGrams ?? undefined}
            scanDate={formatTimestamp(record.timestamp)}
          />
        </div>
      )}
    </main>
  );
}
