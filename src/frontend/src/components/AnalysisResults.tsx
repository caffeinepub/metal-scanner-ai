import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Award,
  DollarSign,
  Info,
  RotateCcw,
  Save,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, type MetalType } from "../backend";
import type { MetalAnalysisResult } from "../backend";
import { useSaveScan } from "../hooks/useQueries";

interface AnalysisResultsProps {
  result: MetalAnalysisResult;
  selectedMetal: MetalType;
  images: File[];
  weight: number | null;
  dimensions: [number, number, number] | null;
  onReset: () => void;
}

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
};

const metalTextColors: Record<string, string> = {
  gold: "text-gold",
  silver: "text-silver",
  copper: "text-copper",
  steel: "text-steel",
  zinc: "text-zinc",
  aluminium: "text-aluminium",
  titanium: "text-titanium",
  nickel: "text-nickel",
  lead: "text-lead",
};

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
};

export default function AnalysisResults({
  result,
  selectedMetal,
  images,
  weight,
  dimensions,
  onReset,
}: AnalysisResultsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const saveScan = useSaveScan();

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

  const confidence = Number(result.confidenceScore);
  const purity = result.purityEstimate ? Number(result.purityEstimate) : null;
  const value = result.estimatedValueUSD
    ? Number(result.estimatedValueUSD)
    : null;

  const dominantMetal = metalProbabilities[0].name;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const imageBlobs = await Promise.all(
        images.map(async (img) => {
          const arrayBuffer = await img.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          return ExternalBlob.fromBytes(uint8Array);
        }),
      );

      await saveScan.mutateAsync({
        selectedMetal,
        images: imageBlobs,
        weightGrams: weight,
        dimensions,
        analysisResult: result,
      });

      toast.success("Scan saved to history!");
    } catch (error) {
      toast.error("Failed to save scan. Please try again.");
      console.error("Save scan error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl text-foreground">
                Analysis Results
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Enhanced AI-powered metal composition estimate with improved
                accuracy
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={`${
                confidence >= 80
                  ? "border-green-500/50 text-green-400"
                  : confidence >= 70
                    ? "border-yellow-500/50 text-yellow-400"
                    : "border-orange-500/50 text-orange-400"
              }`}
            >
              {confidence}% Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold" />
              Metal Composition Likelihood
            </h3>

            {metalProbabilities.map(
              ({ name, value }) =>
                value > 0 && (
                  <div key={name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium">
                        {metalLabels[name]}
                      </span>
                      <span className={`${metalTextColors[name]} font-bold`}>
                        {value}%
                      </span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full ${metalColors[name]} transition-all duration-300`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ),
            )}
          </div>

          <Separator className="bg-white/10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {purity !== null && (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-gold" />
                  <span className="text-sm text-muted-foreground">
                    Estimated Purity
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">{purity}%</p>
              </div>
            )}

            {value !== null && (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-trust" />
                  <span className="text-sm text-muted-foreground">
                    Estimated Value
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">${value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  USD (approximate)
                </p>
              </div>
            )}
          </div>

          <Separator className="bg-white/10" />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-trust" />
              Detection Analysis Summary
            </h3>
            <div className="bg-trust/10 border border-trust/30 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-trust mt-0.5">•</span>
                  <span>
                    Revised spectral analysis identified{" "}
                    {metalLabels[dominantMetal]} characteristics with enhanced
                    accuracy
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-trust mt-0.5">•</span>
                  <span>
                    Balanced confidence weighting applied to prevent
                    misclassification between similar metals
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-trust mt-0.5">•</span>
                  <span>
                    Hue, saturation, and brightness profiles calibrated for
                    various lighting conditions
                  </span>
                </li>
                {weight && (
                  <li className="flex items-start gap-2">
                    <span className="text-trust mt-0.5">•</span>
                    <span>
                      Weight data incorporated with adaptive density matching
                      (+12% confidence boost)
                    </span>
                  </li>
                )}
                {dimensions && (
                  <li className="flex items-start gap-2">
                    <span className="text-trust mt-0.5">•</span>
                    <span>
                      Dimensional measurements factored into enhanced analysis
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <Alert className="bg-yellow-500/10 border-yellow-500/30">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-sm text-foreground">
              {result.disclaimer}
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gold hover:bg-gold/90 text-black"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save to History"}
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              className="border-white/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-foreground">Analyzed Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: no stable IDs
                key={idx}
                className="aspect-square rounded-lg overflow-hidden border border-white/10"
              >
                <img
                  src={URL.createObjectURL(img)}
                  alt={`Analysis ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
