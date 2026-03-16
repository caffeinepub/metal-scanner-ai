import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Calendar, History, TrendingUp } from "lucide-react";
import { MetalType } from "../backend";
import type { ScanRecord } from "../backend";
import { useGetScanHistory } from "../hooks/useQueries";

const metalLabels: Record<string, string> = {
  gold: "Gold",
  silver: "Silver",
  copper: "Copper",
  steel: "Steel",
  zinc: "Zinc",
  aluminium: "Aluminium",
  titanium: "Titanium",
  nickel: "Nickel",
  lead: "Lead",
  unknown: "Unknown",
  autoDetect: "Auto Detect",
};

const metalColors: Record<string, string> = {
  gold: "bg-gold",
  silver: "bg-silver",
  copper: "bg-copper",
  steel: "bg-steel",
  zinc: "bg-zinc",
  aluminium: "bg-aluminium",
  titanium: "bg-titanium",
  nickel: "bg-nickel",
  lead: "bg-lead",
  unknown: "bg-unknown",
};

export default function HistoryTab() {
  const { data: scanHistory, isLoading } = useGetScanHistory();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full bg-white/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!scanHistory || scanHistory.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardContent className="p-12 text-center">
            <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Scans Yet
            </h3>
            <p className="text-muted-foreground">
              Your scan history will appear here after you complete your first
              analysis.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Scan History</h2>
          <p className="text-sm text-muted-foreground">
            {scanHistory.length} total scans
          </p>
        </div>
      </div>

      {scanHistory.map((scan) => (
        <ScanHistoryCard key={Number(scan.id)} scan={scan} />
      ))}
    </div>
  );
}

function ScanHistoryCard({ scan }: { scan: ScanRecord }) {
  const result = scan.analysisResult;

  const metalProbabilities = [
    { name: "gold", value: Number(result.goldProbability) },
    { name: "silver", value: Number(result.silverProbability) },
    { name: "copper", value: Number(result.copperProbability) },
    { name: "steel", value: Number(result.steelProbability) },
    { name: "zinc", value: Number(result.zincProbability) },
    { name: "aluminium", value: Number(result.aluminiumProbability) },
    { name: "titanium", value: Number(result.titaniumProbability) },
    { name: "nickel", value: Number(result.nickelProbability) },
    { name: "lead", value: Number(result.leadProbability) },
  ].sort((a, b) => b.value - a.value);

  const topThreeMetals = metalProbabilities
    .slice(0, 3)
    .filter((m) => m.value > 0);
  const dominantMetal = metalProbabilities[0];

  const confidence = Number(result.confidenceScore);
  const purity = result.purityEstimate ? Number(result.purityEstimate) : null;
  const value = result.estimatedValueUSD
    ? Number(result.estimatedValueUSD)
    : null;

  const date = new Date(Number(scan.timestamp) / 1000000);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const metalTypeLabel =
    scan.selectedMetal === MetalType.autoDetect
      ? "Auto Detect"
      : scan.selectedMetal === MetalType.unknown_
        ? "Unknown"
        : metalLabels[scan.selectedMetal] || scan.selectedMetal;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-gold/30 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg text-foreground">
                Scan #{Number(scan.id)}
              </CardTitle>
              <Badge
                variant="outline"
                className="border-white/20 text-muted-foreground text-xs"
              >
                {metalTypeLabel}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={`${
              confidence >= 80
                ? "border-green-500/50 text-green-400"
                : confidence >= 60
                  ? "border-yellow-500/50 text-yellow-400"
                  : "border-red-500/50 text-red-400"
            }`}
          >
            {confidence}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Images Preview */}
        <div className="grid grid-cols-4 gap-2">
          {scan.images.slice(0, 4).map((img, idx) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: no stable IDs
              key={idx}
              className="aspect-square rounded-lg overflow-hidden border border-white/10"
            >
              <img
                src={img.getDirectURL()}
                alt={`Scan ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-gold" />
              <span className="text-xs text-muted-foreground">Dominant</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {metalLabels[dominantMetal.name]}
            </p>
            <p className="text-xs text-muted-foreground">
              {dominantMetal.value}%
            </p>
          </div>

          {purity !== null && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-1 mb-1">
                <Award className="w-3 h-3 text-gold" />
                <span className="text-xs text-muted-foreground">Purity</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{purity}%</p>
            </div>
          )}

          {value !== null && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xs text-muted-foreground block mb-1">
                Value
              </span>
              <p className="text-sm font-semibold text-foreground">${value}</p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <span className="text-xs text-muted-foreground block mb-1">
              Images
            </span>
            <p className="text-sm font-semibold text-foreground">
              {scan.images.length}
            </p>
          </div>
        </div>

        {/* Metal Breakdown - Top 3 */}
        <div className="flex flex-wrap gap-2 text-xs">
          {topThreeMetals.map(({ name, value }) => (
            <div key={name} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${metalColors[name]}`} />
              <span className="text-muted-foreground">
                {metalLabels[name]}: {value}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
