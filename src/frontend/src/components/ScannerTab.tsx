import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Camera, Loader2, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { MetalType } from "../backend";
import type { MetalAnalysisResult } from "../backend";
import { analyzeMetalWithGemini } from "../services/geminiService";
import AnalysisResults from "./AnalysisResults";
import CameraCapture from "./CameraCapture";
import ImageUpload from "./ImageUpload";

function metalStringToType(metal: string): MetalType {
  switch (metal.toLowerCase()) {
    case "gold":
      return MetalType.gold;
    case "silver":
      return MetalType.silver;
    case "copper":
      return MetalType.copper;
    case "steel":
      return MetalType.steel;
    case "zinc":
      return MetalType.zinc;
    case "aluminium":
    case "aluminum":
      return MetalType.aluminium;
    case "titanium":
      return MetalType.titanium;
    case "nickel":
      return MetalType.nickel;
    case "lead":
      return MetalType.lead;
    default:
      return MetalType.unknown_;
  }
}

export default function ScannerTab() {
  const [selectedMetal, setSelectedMetal] = useState<MetalType>(
    MetalType.autoDetect,
  );
  const [captureMode, setCaptureMode] = useState<"camera" | "upload" | null>(
    null,
  );
  const [images, setImages] = useState<File[]>([]);
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState({
    length: "",
    width: "",
    height: "",
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<MetalAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleStartCapture = (mode: "camera" | "upload") => {
    setCaptureMode(mode);
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  const handleImagesReady = (newImages: File[]) => {
    setImages(newImages);
    setCaptureMode(null);
  };

  const handleCancelCapture = () => {
    setCaptureMode(null);
  };

  const handleSwitchToUpload = (capturedImages: File[]) => {
    setImages(capturedImages);
    setCaptureMode("upload");
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const dims =
        dimensions.length && dimensions.width && dimensions.height
          ? ([
              Number.parseFloat(dimensions.length),
              Number.parseFloat(dimensions.width),
              Number.parseFloat(dimensions.height),
            ] as [number, number, number])
          : null;

      const result = await analyzeMetalWithGemini(
        images,
        selectedMetal,
        weight ? Number.parseFloat(weight) : null,
        dims,
      );

      const mockResult: MetalAnalysisResult = {
        goldProbability: BigInt(result.probabilities.gold),
        silverProbability: BigInt(result.probabilities.silver),
        copperProbability: BigInt(result.probabilities.copper),
        steelProbability: BigInt(result.probabilities.steel),
        zincProbability: BigInt(result.probabilities.zinc),
        aluminiumProbability: BigInt(result.probabilities.aluminium),
        titaniumProbability: BigInt(result.probabilities.titanium),
        nickelProbability: BigInt(result.probabilities.nickel),
        leadProbability: BigInt(result.probabilities.lead),
        metalType: metalStringToType(result.topMetal),
        confidenceScore: BigInt(result.confidenceScore),
        purityEstimate:
          result.purityEstimate != null
            ? BigInt(Math.round(result.purityEstimate))
            : undefined,
        estimatedValueUSD:
          result.estimatedValueUSD != null
            ? BigInt(Math.round(result.estimatedValueUSD))
            : undefined,
        analysisTimestamp: BigInt(Date.now() * 1000000),
        disclaimer:
          "This analysis is for educational purposes only. Results are probabilistic estimates based on visual analysis and should not be used as definitive identification. Professional testing is recommended for accurate metal verification.",
      };

      setAnalysisResult(mockResult);
    } catch (err: any) {
      const msg = err?.message || err?.toString() || "Unknown error occurred";
      setAnalysisError(
        `Analysis failed: ${msg}. Please check your API key or try again.`,
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImages([]);
    setWeight("");
    setDimensions({ length: "", width: "", height: "" });
    setAnalysisResult(null);
    setAnalysisError(null);
    setCaptureMode(null);
  };

  if (captureMode === "camera") {
    return (
      <CameraCapture
        onImagesReady={handleImagesReady}
        onCancel={handleCancelCapture}
        onSwitchToUpload={handleSwitchToUpload}
      />
    );
  }

  if (captureMode === "upload") {
    return (
      <ImageUpload
        onImagesReady={handleImagesReady}
        onCancel={handleCancelCapture}
        initialImages={images}
      />
    );
  }

  if (analysisResult) {
    return (
      <AnalysisResults
        result={analysisResult}
        selectedMetal={selectedMetal}
        images={images}
        weight={weight ? Number.parseFloat(weight) : null}
        dimensions={
          dimensions.length && dimensions.width && dimensions.height
            ? [
                Number.parseFloat(dimensions.length),
                Number.parseFloat(dimensions.width),
                Number.parseFloat(dimensions.height),
              ]
            : null
        }
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-foreground">New Metal Scan</CardTitle>
          <CardDescription className="text-muted-foreground">
            Select metal type and capture images for AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="metal-type" className="text-foreground">
              Metal Type
            </Label>
            <Select
              value={selectedMetal}
              onValueChange={(value) => setSelectedMetal(value as MetalType)}
            >
              <SelectTrigger
                id="metal-type"
                data-ocid="scanner.select"
                className="bg-white/5 border-white/10 text-foreground"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MetalType.autoDetect}>
                  Auto Detect
                </SelectItem>
                <SelectItem value={MetalType.gold}>Gold</SelectItem>
                <SelectItem value={MetalType.silver}>Silver</SelectItem>
                <SelectItem value={MetalType.copper}>Copper</SelectItem>
                <SelectItem value={MetalType.steel}>Steel</SelectItem>
                <SelectItem value={MetalType.zinc}>Zinc</SelectItem>
                <SelectItem value={MetalType.aluminium}>Aluminium</SelectItem>
                <SelectItem value={MetalType.titanium}>Titanium</SelectItem>
                <SelectItem value={MetalType.nickel}>Nickel</SelectItem>
                <SelectItem value={MetalType.lead}>Lead</SelectItem>
                <SelectItem value={MetalType.unknown_}>
                  Unknown Metal
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {images.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                data-ocid="scanner.primary_button"
                onClick={() => handleStartCapture("camera")}
                variant="outline"
                className="h-32 flex-col gap-3 border-white/10 hover:bg-white/5 hover:border-gold"
              >
                <Camera className="w-12 h-12 text-gold" />
                <span className="text-foreground">Use Camera</span>
              </Button>
              <Button
                data-ocid="scanner.upload_button"
                onClick={() => handleStartCapture("upload")}
                variant="outline"
                className="h-32 flex-col gap-3 border-white/10 hover:bg-white/5 hover:border-gold"
              >
                <Upload className="w-12 h-12 text-gold" />
                <span className="text-foreground">Upload Images</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">
                  {images.length} image(s) captured
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-muted-foreground"
                  data-ocid="scanner.secondary_button"
                >
                  Clear
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: no stable IDs
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden border border-white/10"
                  >
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`Capture ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-white/10">
            <Label className="text-foreground text-sm">
              Optional: Enhance accuracy
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="weight"
                  className="text-sm text-muted-foreground"
                >
                  Weight (grams)
                </Label>
                <Input
                  id="weight"
                  data-ocid="scanner.input"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="bg-white/5 border-white/10 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Dimensions (mm)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="L"
                    value={dimensions.length}
                    onChange={(e) =>
                      setDimensions({ ...dimensions, length: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-foreground text-sm"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="W"
                    value={dimensions.width}
                    onChange={(e) =>
                      setDimensions({ ...dimensions, width: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-foreground text-sm"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="H"
                    value={dimensions.height}
                    onChange={(e) =>
                      setDimensions({ ...dimensions, height: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-foreground text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {analysisError && (
            <Alert
              variant="destructive"
              className="border-red-500/50 bg-red-500/10"
              data-ocid="scanner.error_state"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">
                {analysisError}
              </AlertDescription>
            </Alert>
          )}

          <Button
            data-ocid="scanner.submit_button"
            onClick={handleAnalyze}
            disabled={images.length === 0 || isAnalyzing}
            className="w-full bg-gold hover:bg-gold/90 text-black font-semibold"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Analyze Metal
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
