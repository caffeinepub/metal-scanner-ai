import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Lock, RefreshCw, Scan, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MetalType } from "../backend";
import ScanResults from "../components/ScanResults";
import { useEasyMode } from "../contexts/EasyModeContext";
import { useSaveScan } from "../hooks/useQueries";
import { useSubscription } from "../hooks/useSubscription";
import { analyzeMetalImage } from "../utils/gemini";
import type { GeminiAnalysisResult } from "../utils/gemini";
import { METALS, topMetalToMetalType } from "../utils/metals";

const FREE_METALS = ["silver"];
const EASY_STEPS = [
  "Take a clear photo of your metal object or upload an image",
  "Optionally select what metal you think it might be",
  "Optionally enter the weight and size of the object",
  'Tap the big gold "Scan Now" button',
  "View your results and save them to your history",
];

function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
      resolve({ data, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function videoToBase64(
  video: HTMLVideoElement,
): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const [, data] = dataUrl.split(",");
    resolve({ data, mimeType: "image/jpeg" });
  });
}

export default function ScannerPage() {
  const { easyMode } = useEasyMode();
  const { isPaid } = useSubscription();
  const saveScanMutation = useSaveScan();

  const [selectedMetal, setSelectedMetal] = useState<string>("autoDetect");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<{
    data: string;
    mimeType: string;
  } | null>(null);
  const [weightGrams, setWeightGrams] = useState<string>("");
  const [dimensions, setDimensions] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<GeminiAnalysisResult | null>(null);
  const [savedAlready, setSavedAlready] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraDenied, setCameraDenied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    setCameraDenied(false);

    // Check permission state first if available
    if (navigator.permissions) {
      try {
        const permStatus = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        if (permStatus.state === "denied") {
          setCameraDenied(true);
          setCameraError("Camera permission denied");
          return;
        }
      } catch {
        // Permissions API not supported, continue
      }
    }

    // Try with progressively simpler constraints
    const constraintOptions = [
      {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      { video: { facingMode: "environment" } },
      { video: true },
    ];

    let stream: MediaStream | null = null;
    let lastError: Error | null = null;

    for (const constraints of constraintOptions) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        break; // success
      } catch (err) {
        lastError = err as Error;
        const e = err as Error;
        if (
          e.name === "NotAllowedError" ||
          e.name === "PermissionDeniedError"
        ) {
          setCameraDenied(true);
          setCameraError("Camera permission denied");
          return;
        }
        // Other errors: try next constraint set
      }
    }

    if (!stream) {
      const e = lastError as Error;
      if (e?.name === "NotFoundError") {
        setCameraError("No camera found on this device");
      } else {
        setCameraError(`Camera error: ${e?.message ?? "Unknown error"}`);
      }
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.muted = true;
      try {
        await videoRef.current.play();
      } catch {
        // play() rejection is usually benign on mobile
      }
    }
    setCameraActive(true);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const { data, mimeType } = await videoToBase64(videoRef.current);
    const byteString = atob(data);
    const ab = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++)
      ab[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: mimeType });
    const file = new File([blob], "camera-capture.jpg", { type: mimeType });
    setImageFile(file);
    setImagePreview(URL.createObjectURL(blob));
    setImageBase64({ data, mimeType });
    setResult(null);
    setSavedAlready(false);
    stopCamera();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const [preview, base64] = await Promise.all([
      URL.createObjectURL(file),
      fileToBase64(file),
    ]);
    setImageFile(file);
    setImagePreview(preview);
    setImageBase64(base64);
    setResult(null);
    setSavedAlready(false);
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleScan = async () => {
    if (!imageBase64) {
      toast.error("Please select or capture an image first");
      return;
    }
    setIsScanning(true);
    setResult(null);
    try {
      const weight = weightGrams ? Number.parseFloat(weightGrams) : undefined;
      const analysisResult = await analyzeMetalImage(
        imageBase64.data,
        imageBase64.mimeType,
        weight,
        dimensions || undefined,
      );
      setResult(analysisResult);
      setSavedAlready(false);
    } catch (err) {
      console.error(err);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      const metalType =
        selectedMetal === "autoDetect"
          ? topMetalToMetalType(result.topMetal)
          : (METALS.find((m) => m.key === selectedMetal)?.type ??
            MetalType.unknown_);
      const purityMatch = result.purityRange.match(/(\d+)/);
      const purityBigint = purityMatch ? BigInt(purityMatch[1]) : undefined;
      const valueMatch = result.estimatedValueRange.match(/\$([\d.]+)/);
      const valueBigint = valueMatch
        ? BigInt(Math.round(Number.parseFloat(valueMatch[1])))
        : undefined;
      const analysisResult = {
        goldProbability: BigInt(result.goldProbability),
        silverProbability: BigInt(result.silverProbability),
        copperProbability: BigInt(result.copperProbability),
        steelProbability: BigInt(result.steelProbability),
        zincProbability: BigInt(result.zincProbability),
        aluminiumProbability: BigInt(result.aluminiumProbability),
        titaniumProbability: BigInt(result.titaniumProbability),
        nickelProbability: BigInt(result.nickelProbability),
        leadProbability: BigInt(result.leadProbability),
        metalType,
        confidenceScore: BigInt(
          result.confidenceLevel.toUpperCase().startsWith("HIGH")
            ? 85
            : result.confidenceLevel.toUpperCase().startsWith("MEDIUM")
              ? 55
              : 30,
        ),
        purityEstimate: purityBigint,
        estimatedValueUSD: valueBigint,
        disclaimer:
          "Metal Scanner AI provides probabilistic estimates for informational purposes only.",
        analysisTimestamp: BigInt(Date.now()) * BigInt(1_000_000),
      };
      const weight = weightGrams ? Number.parseFloat(weightGrams) : null;
      await saveScanMutation.mutateAsync({
        selectedMetal: metalType,
        images: [],
        weightGrams: weight,
        dimensions: null,
        analysisResult,
      });
      setSavedAlready(true);
      toast.success("Scan saved to history!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save scan. Please try again.");
    }
  };

  const isMetalLocked = (key: string) =>
    !isPaid && !FREE_METALS.includes(key) && key !== "autoDetect";

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      <AnimatePresence>
        {easyMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 rounded-xl border border-gold/30 bg-gold/5 p-5"
          >
            <h2 className="font-bold text-lg text-gold mb-3">
              How to Use Metal Scanner AI
            </h2>
            <ol className="space-y-2">
              {EASY_STEPS.map((step) => (
                <li key={step} className="flex items-start gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-gold text-black text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {EASY_STEPS.indexOf(step) + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-5">
        {/* Camera / Upload section */}
        <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
          {cameraActive && (
            <div className="relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full max-h-80 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-gold/60 rounded-xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gold rounded-tl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gold rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gold rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gold rounded-br" />
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="h-0.5 bg-gold/60 w-full animate-scan-line" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
                <Button
                  onClick={capturePhoto}
                  className="bg-gold hover:bg-gold/90 text-black font-bold px-6"
                >
                  <Scan className="w-4 h-4 mr-2" /> Capture Photo
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="border-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {imagePreview && !cameraActive && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Selected metal"
                className="w-full max-h-80 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                  setImageBase64(null);
                  setResult(null);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!cameraActive && !imagePreview && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                <Scan className="w-10 h-10 text-gold" />
              </div>
              <p className="text-muted-foreground mb-2">
                Take a photo or upload an image
              </p>
              <p className="text-xs text-muted-foreground">
                For best results, ensure good lighting and a clear view of the
                metal surface
              </p>
            </div>
          )}

          {cameraDenied && (
            <div className="p-5 bg-yellow-500/10 border-t border-yellow-500/20">
              <p className="font-semibold text-yellow-400 mb-2">
                📷 Camera Access Required
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Chrome:</strong> Tap the camera icon in the address
                  bar → Allow → Reload
                </p>
                <p>
                  <strong>Safari:</strong> Settings → Safari → Camera → Allow
                  for this site
                </p>
                <p>
                  <strong>Firefox:</strong> Click the lock icon → Permissions →
                  Camera → Allow
                </p>
              </div>
              <Button
                onClick={() => {
                  setCameraDenied(false);
                  setCameraError(null);
                  startCamera();
                }}
                size="sm"
                className="mt-3 bg-gold text-black"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
              </Button>
            </div>
          )}
          {cameraError && !cameraDenied && (
            <div className="p-4 bg-destructive/10 border-t border-destructive/20">
              <p className="text-sm text-destructive">{cameraError}</p>
            </div>
          )}

          <div className="p-4 grid grid-cols-2 gap-3 border-t border-white/10">
            <Button
              data-ocid="scanner.camera_button"
              onClick={cameraActive ? stopCamera : startCamera}
              variant="outline"
              className={`border-white/20 hover:bg-white/5 ${easyMode ? "py-6 text-base" : "py-5"}`}
            >
              <Camera className="w-5 h-5 mr-2" />
              {cameraActive ? "Stop Camera" : "Take Photo"}
            </Button>
            <Button
              data-ocid="scanner.upload_button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className={`border-white/20 hover:bg-white/5 ${easyMode ? "py-6 text-base" : "py-5"}`}
            >
              <Upload className="w-5 h-5 mr-2" /> Upload Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Metal selector */}
        <div className="rounded-2xl border border-white/10 bg-card p-5">
          <h3
            className={`font-semibold mb-3 ${easyMode ? "text-base" : "text-sm"}`}
          >
            {easyMode ? "🔩 Step 2: Select Metal Type" : "Select Metal"}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-ocid="metal_selector.auto_button"
              onClick={() => setSelectedMetal("autoDetect")}
              className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                selectedMetal === "autoDetect"
                  ? "bg-gold border-gold text-black shadow-glow-sm"
                  : "border-white/15 text-muted-foreground hover:border-white/30"
              }`}
            >
              Auto Detect
            </button>
            {METALS.map((m) => {
              const locked = isMetalLocked(m.key);
              const active = selectedMetal === m.key;
              return (
                <button
                  type="button"
                  key={m.key}
                  data-ocid={`metal_selector.${m.key}_button`}
                  onClick={() => !locked && setSelectedMetal(m.key)}
                  title={
                    locked ? "Upgrade to unlock all metals" : m.description
                  }
                  className={`relative px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                    locked
                      ? "border-white/10 text-muted-foreground/50 cursor-not-allowed"
                      : active
                        ? "border-2 text-black"
                        : "border-white/15 text-muted-foreground hover:border-white/30"
                  }`}
                  style={
                    active && !locked
                      ? { background: m.color, borderColor: m.color }
                      : {}
                  }
                >
                  {locked && (
                    <Lock className="inline w-3 h-3 mr-1 opacity-50" />
                  )}
                  {m.label}
                </button>
              );
            })}
          </div>
          {!isPaid && (
            <p className="text-xs text-muted-foreground mt-3">
              🔒 Free plan: Silver only.{" "}
              <a href="/pricing" className="text-gold underline">
                Upgrade for all metals →
              </a>
            </p>
          )}
        </div>

        {/* Optional inputs */}
        <div className="rounded-2xl border border-white/10 bg-card p-5">
          <h3
            className={`font-semibold mb-3 ${easyMode ? "text-base" : "text-sm"}`}
          >
            {easyMode
              ? "⚖️ Step 3: Optional Details (for better accuracy)"
              : "Optional Details"}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Weight (grams)
              </Label>
              <Input
                data-ocid="scanner.weight_input"
                type="number"
                placeholder="e.g. 28.5"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                className={`bg-background border-white/15 ${easyMode ? "text-base py-5" : ""}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Dimensions (optional)
              </Label>
              <Input
                data-ocid="scanner.dimensions_input"
                type="text"
                placeholder="e.g. 5x3x1 cm"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className={`bg-background border-white/15 ${easyMode ? "text-base py-5" : ""}`}
              />
            </div>
          </div>
        </div>

        {/* Scan button */}
        <Button
          data-ocid="scanner.scan_button"
          onClick={handleScan}
          disabled={!imageBase64 || isScanning}
          className={`w-full bg-gold hover:bg-gold/90 text-black font-bold shadow-glow transition-all ${
            easyMode ? "text-xl py-8" : "text-lg py-7"
          } rounded-2xl disabled:opacity-50`}
        >
          {isScanning ? (
            <>
              <span className="animate-pulse">🔍</span>
              <span className="ml-2">Analyzing Metal...</span>
            </>
          ) : (
            <>
              <Scan className="w-6 h-6 mr-2" />
              {easyMode ? "🔍 Scan My Metal Object" : "Scan Now"}
            </>
          )}
        </Button>

        <AnimatePresence>
          {isScanning && (
            <motion.div
              data-ocid="scanner.loading_state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full border-2 border-gold mx-auto mb-4 animate-pulse-ring flex items-center justify-center">
                <Scan
                  className="w-8 h-8 text-gold animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              </div>
              <p className="text-gold font-semibold">
                Analyzing metal composition...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Gemini AI is examining visual properties
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {result && !isScanning && (
          <ScanResults
            result={result}
            onSave={handleSave}
            isSaving={saveScanMutation.isPending}
            savedAlready={savedAlready}
            weightGrams={
              weightGrams ? Number.parseFloat(weightGrams) : undefined
            }
            dimensions={dimensions || undefined}
            imagePreview={imagePreview ?? undefined}
          />
        )}

        {imageFile && (
          <p className="text-xs text-muted-foreground text-center">
            Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
          </p>
        )}
      </div>
    </main>
  );
}
