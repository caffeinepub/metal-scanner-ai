import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Loader2,
  Save,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import type { GeminiAnalysisResult } from "../utils/gemini";
import {
  getConfidenceColor,
  getConfidenceLabel,
  getMetalColor,
} from "../utils/metals";
import MetalBarChart from "./MetalBarChart";

interface ScanResultsProps {
  result: GeminiAnalysisResult;
  onSave?: () => void;
  isSaving?: boolean;
  savedAlready?: boolean;
  weightGrams?: number;
  dimensions?: string;
  imagePreview?: string;
  scanDate?: string;
}

export default function ScanResults({
  result,
  onSave,
  isSaving,
  savedAlready,
  weightGrams,
  dimensions,
  imagePreview,
  scanDate,
}: ScanResultsProps) {
  const topColor = getMetalColor(result.topMetal);
  const confidenceLabel = getConfidenceLabel(result.confidenceLevel);
  const confidenceColor = getConfidenceColor(result.confidenceLevel);
  const confidenceDescription = result.confidenceLevel.replace(
    /^(High|Medium|Low)\s*-?\s*/i,
    "",
  );
  const ConfidenceIcon =
    confidenceLabel === "High"
      ? CheckCircle
      : confidenceLabel === "Medium"
        ? AlertCircle
        : XCircle;
  const isApiKeyMissing = !import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-5"
    >
      {isApiKeyMissing && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Gemini API key not configured. Showing demo mode results.</span>
        </div>
      )}

      {/* Top metal hero */}
      <div
        className="rounded-xl p-6 border text-center"
        style={{
          borderColor: `${topColor}60`,
          background: `linear-gradient(135deg, ${topColor}12 0%, oklch(0.15 0.008 260) 100%)`,
          boxShadow: `0 0 32px ${topColor}25`,
        }}
      >
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Scanned metal"
            className="w-24 h-24 object-cover rounded-xl mx-auto mb-4 border-2"
            style={{ borderColor: `${topColor}60` }}
          />
        )}
        <p className="text-sm text-muted-foreground mb-1 uppercase tracking-widest">
          Top Match
        </p>
        <h2
          className="font-display text-5xl font-bold capitalize mb-2"
          style={{ color: topColor }}
        >
          {result.topMetal}
        </h2>
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
            <span className="text-muted-foreground">Purity: </span>
            <span className="text-foreground font-medium">
              {result.purityRange}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
            <span className="text-muted-foreground">Est. Value: </span>
            <span className="text-foreground font-medium">
              {result.estimatedValueRange}
            </span>
          </div>
          {scanDate && (
            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
              <span className="text-muted-foreground">{scanDate}</span>
            </div>
          )}
        </div>
        {(weightGrams != null || dimensions) && (
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {weightGrams != null && (
              <span className="text-xs text-muted-foreground">
                Weight: {weightGrams}g
              </span>
            )}
            {dimensions && (
              <span className="text-xs text-muted-foreground">
                Dims: {dimensions}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Confidence */}
      <div className="rounded-xl p-4 border border-white/10 bg-card">
        <div className="flex items-center gap-2 mb-2">
          <ConfidenceIcon
            className="w-5 h-5"
            style={{ color: confidenceColor }}
          />
          <span className="font-semibold" style={{ color: confidenceColor }}>
            {confidenceLabel} Confidence
          </span>
        </div>
        {confidenceDescription && (
          <p className="text-sm text-muted-foreground">
            {confidenceDescription}
          </p>
        )}
      </div>

      {/* Bar chart */}
      <div className="rounded-xl p-5 border border-white/10 bg-card">
        <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
          Metal Probability
        </h3>
        <MetalBarChart
          goldProbability={result.goldProbability}
          silverProbability={result.silverProbability}
          copperProbability={result.copperProbability}
          steelProbability={result.steelProbability}
          zincProbability={result.zincProbability}
          aluminiumProbability={result.aluminiumProbability}
          titaniumProbability={result.titaniumProbability}
          nickelProbability={result.nickelProbability}
          leadProbability={result.leadProbability}
          ironProbability={result.ironProbability}
          topMetal={result.topMetal}
        />
      </div>

      {/* Visual clues */}
      <div className="rounded-xl p-5 border border-white/10 bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-gold" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">
            Visual Clues Observed
          </h3>
        </div>
        <ul className="space-y-2">
          {result.visualClues.map((clue) => (
            <li
              key={clue}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <span className="text-gold mt-0.5">•</span>
              <span>{clue}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Disclaimer */}
      <div
        className="rounded-xl p-4 border border-white/5 flex items-start gap-2"
        style={{ background: "oklch(0.15 0.008 260 / 0.5)" }}
      >
        <ShieldAlert className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Metal Scanner AI provides probabilistic estimates for informational
          purposes only. Results are not certified, laboratory-grade, or legally
          binding verification.
        </p>
      </div>

      {onSave && !savedAlready && (
        <Button
          data-ocid="results.save_button"
          onClick={onSave}
          disabled={isSaving}
          className="w-full bg-gold hover:bg-gold/90 text-black font-bold text-base py-6"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving Scan...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" /> Save Scan to History
            </>
          )}
        </Button>
      )}
      {savedAlready && (
        <div
          data-ocid="results.success_state"
          className="flex items-center justify-center gap-2 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Scan saved to history!</span>
        </div>
      )}
    </motion.div>
  );
}
