import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Camera,
  Check,
  Loader2,
  RotateCw,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useStabilizedCamera } from "../hooks/useStabilizedCamera";
import { createObjectURL, revokeObjectURL } from "../utils/objectUrls";

interface CameraCaptureProps {
  onImagesReady: (images: File[]) => void;
  onCancel: () => void;
  onSwitchToUpload?: (capturedImages: File[]) => void;
}

export default function CameraCapture({
  onImagesReady,
  onCancel,
  onSwitchToUpload,
}: CameraCaptureProps) {
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera: _startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    retry: _retry,
    videoRef,
    canvasRef,
    currentFacingMode: _currentFacingMode,
    startWithTimeout,
  } = useStabilizedCamera({ facingMode: "environment", quality: 0.9 });

  const [capturedImages, setCapturedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [initState, setInitState] = useState<
    "initializing" | "ready" | "error" | "timeout"
  >("initializing");
  const [isMobile] = useState(() =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ),
  );

  // Initialize camera with timeout-bounded state machine
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      setInitState("initializing");

      const success = await startWithTimeout();

      if (!mounted) return;

      if (success) {
        setInitState("ready");
      } else {
        // Check if it's a timeout or error
        if (error) {
          setInitState("error");
        } else {
          setInitState("timeout");
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      stopCamera();
      // Clean up object URLs
      for (const url of imageUrls) revokeObjectURL(url);
    };
  }, []);

  const handleCapture = async () => {
    const photo = await capturePhoto();
    if (photo) {
      const url = createObjectURL(photo);
      setCapturedImages([...capturedImages, photo]);
      setImageUrls([...imageUrls, url]);
    }
  };

  const handleSwitchCamera = async () => {
    if (!isMobile) return;
    await switchCamera();
  };

  const handleDone = () => {
    stopCamera();
    onImagesReady(capturedImages);
    // URLs will be cleaned up by parent component
  };

  const handleCancel = () => {
    stopCamera();
    for (const url of imageUrls) revokeObjectURL(url);
    onCancel();
  };

  const handleRetry = async () => {
    setInitState("initializing");
    // Stop any existing stream before retrying
    await stopCamera();

    const success = await startWithTimeout();

    if (success) {
      setInitState("ready");
    } else {
      if (error) {
        setInitState("error");
      } else {
        setInitState("timeout");
      }
    }
  };

  const handleSwitchToUpload = () => {
    stopCamera();
    if (onSwitchToUpload) {
      onSwitchToUpload(capturedImages);
    }
  };

  // Camera not supported
  if (isSupported === false) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-foreground">
              Camera Not Supported
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Your browser doesn't support camera access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Please use the upload option to select images from your device.
            </p>
            <div className="flex gap-3">
              {onSwitchToUpload && (
                <Button
                  onClick={handleSwitchToUpload}
                  className="flex-1 bg-gold hover:bg-gold/90 text-black"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Images Instead
                </Button>
              )}
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-white/10"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Camera permission denied or error
  if (error?.type === "permission" || initState === "error") {
    const errorMessage =
      error?.type === "permission"
        ? "Camera access was denied. Please allow camera access in your browser settings."
        : error?.type === "not-found"
          ? "No camera found on this device."
          : error?.type === "not-supported"
            ? "Camera is not supported in this browser."
            : error?.message || "Failed to access camera.";

    return (
      <div className="max-w-2xl mx-auto px-4">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-foreground">
                    Camera Access Required
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Unable to access camera
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                How to enable camera access:
              </h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Look for a camera icon in your browser's address bar</li>
                <li>Click it and select "Allow" for camera access</li>
                <li>Click "Retry" below to try again</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleRetry}
                variant="outline"
                className="flex-1 border-white/10"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              {onSwitchToUpload && (
                <Button
                  onClick={handleSwitchToUpload}
                  className="flex-1 bg-gold hover:bg-gold/90 text-black"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Instead
                </Button>
              )}
            </div>

            <Button onClick={handleCancel} variant="ghost" className="w-full">
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Timeout state
  if (initState === "timeout") {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-foreground">
              Camera Initialization Timeout
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Camera took too long to start
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The camera didn't start within the expected time. This might be
              due to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Camera is being used by another application</li>
              <li>Browser permissions are pending</li>
              <li>Device camera is not responding</li>
            </ul>

            <div className="flex gap-3">
              <Button
                onClick={handleRetry}
                variant="outline"
                className="flex-1 border-white/10"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              {onSwitchToUpload && (
                <Button
                  onClick={handleSwitchToUpload}
                  className="flex-1 bg-gold hover:bg-gold/90 text-black"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Instead
                </Button>
              )}
            </div>

            <Button onClick={handleCancel} variant="ghost" className="w-full">
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Initializing state
  if (initState === "initializing" || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-16 h-16 text-gold animate-spin" />
              <div>
                <p className="text-lg font-medium text-foreground">
                  Starting Camera
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please wait...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main camera interface (ready state)
  return (
    <div className="max-w-4xl mx-auto space-y-4 px-4">
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Camera className="w-5 h-5 text-gold" />
                Capture Images
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Take photos from multiple angles for best results
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera preview with stable dimensions */}
          <div className="relative w-full" style={{ minHeight: "300px" }}>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: isActive ? "block" : "none" }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center text-white">
                    <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin" />
                    <p>Connecting to camera...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Captured images thumbnails */}
          {capturedImages.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {capturedImages.length} image(s) captured
              </p>
              <div className="grid grid-cols-4 gap-2">
                {imageUrls.map((url, idx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: no stable IDs
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden border-2 border-gold"
                  >
                    <img
                      src={url}
                      alt={`Capture ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleCapture}
              disabled={!isActive || isLoading}
              className="flex-1 bg-gold hover:bg-gold/90 text-black disabled:opacity-50"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
            {isMobile && (
              <Button
                onClick={handleSwitchCamera}
                disabled={!isActive || isLoading}
                variant="outline"
                className="border-white/10 disabled:opacity-50"
                title="Switch camera"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Done button */}
          {capturedImages.length > 0 && (
            <Button
              onClick={handleDone}
              className="w-full bg-trust hover:bg-trust/90 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Done ({capturedImages.length} images)
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
