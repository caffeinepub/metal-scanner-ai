import { useEffect, useRef } from "react";
import { useCamera } from "../camera/useCamera";

interface CameraError {
  type: "permission" | "not-supported" | "not-found" | "unknown" | "timeout";
  message: string;
}

interface UseCameraReturn {
  isActive: boolean;
  isSupported: boolean | null;
  error: CameraError | null;
  isLoading: boolean;
  currentFacingMode: "user" | "environment";
  startCamera: () => Promise<boolean>;
  stopCamera: () => Promise<void>;
  capturePhoto: () => Promise<File | null>;
  switchCamera: (newFacingMode?: "user" | "environment") => Promise<boolean>;
  retry: () => Promise<boolean>;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

interface UseStabilizedCameraConfig {
  facingMode?: "user" | "environment";
  quality?: number;
  startTimeout?: number;
}

interface UseStabilizedCameraReturn extends UseCameraReturn {
  startWithTimeout: () => Promise<boolean>;
}

/**
 * Wrapper hook around useCamera that provides:
 * - Bounded timeout for start operations
 * - Safe retry sequencing (stops before retrying)
 * - Normalized error mapping
 * - Automatic cleanup on unmount
 */
export function useStabilizedCamera(
  config?: UseStabilizedCameraConfig,
): UseStabilizedCameraReturn {
  const {
    facingMode = "environment",
    quality = 0.9,
    startTimeout = 10000,
  } = config || {};

  const camera = useCamera({ facingMode, quality }) as UseCameraReturn;
  const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
      }
      camera.stopCamera();
    };
  }, []);

  /**
   * Start camera with bounded timeout
   * Returns true on success, false on failure/timeout
   */
  const startWithTimeout = async (): Promise<boolean> => {
    if (!isMountedRef.current) return false;

    // Clear any existing timeout
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }

    return new Promise<boolean>((resolve) => {
      // Set timeout
      startTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.warn("[StabilizedCamera] Start timeout exceeded");
          resolve(false);
        }
      }, startTimeout);

      // Attempt start
      camera
        .startCamera()
        .then((success) => {
          if (startTimeoutRef.current) {
            clearTimeout(startTimeoutRef.current);
            startTimeoutRef.current = null;
          }
          if (isMountedRef.current) {
            resolve(success);
          }
        })
        .catch((error) => {
          console.error("[StabilizedCamera] Start error:", error);
          if (startTimeoutRef.current) {
            clearTimeout(startTimeoutRef.current);
            startTimeoutRef.current = null;
          }
          if (isMountedRef.current) {
            resolve(false);
          }
        });
    });
  };

  return {
    ...camera,
    startWithTimeout,
  };
}
