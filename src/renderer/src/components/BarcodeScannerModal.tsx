import { useEffect, useRef, useState } from "react";
import { Camera, ScanLine, X } from "lucide-react";

type Props = {
  onDetected: (barcode: string) => void;
  onClose: () => void;
};

// BarcodeDetector is not yet in standard TypeScript lib
declare class BarcodeDetector {
  constructor(options?: { formats: string[] });
  static getSupportedFormats(): Promise<string[]>;
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>;
}

const PREFERRED_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "code_93",
  "itf",
  "qr_code",
];

export function BarcodeScannerModal({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const intervalRef = useRef<number | null>(null);
  const hasDetectedRef = useRef(false);

  const [status, setStatus] = useState<"loading" | "scanning" | "error" | "unsupported">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [detectedCode, setDetectedCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!("BarcodeDetector" in window)) {
        setStatus("unsupported");
        return;
      }

      // Build detector with supported formats
      try {
        const supported = await BarcodeDetector.getSupportedFormats();
        const formats = PREFERRED_FORMATS.filter((f) => supported.includes(f));
        detectorRef.current = new BarcodeDetector({
          formats: formats.length ? formats : ["ean_13", "upc_a"],
        });
      } catch {
        detectorRef.current = new BarcodeDetector({ formats: ["ean_13", "upc_a", "code_128"] });
      }

      // Request camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus("scanning");

        intervalRef.current = window.setInterval(async () => {
          if (hasDetectedRef.current || !videoRef.current || !detectorRef.current) return;
          if (videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

          try {
            const results = await detectorRef.current.detect(videoRef.current);
            if (results.length > 0 && !hasDetectedRef.current) {
              hasDetectedRef.current = true;
              const code = results[0].rawValue;
              setDetectedCode(code);

              // Brief pause so user sees the confirmation, then callback
              setTimeout(() => {
                if (!cancelled) {
                  stopScanning();
                  onDetected(code);
                }
              }, 600);
            }
          } catch {
            // Ignore per-frame detection errors
          }
        }, 250);
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Camera access was denied.");
          setStatus("error");
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      stopScanning();
    };
  }, [onDetected]);

  function stopScanning() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function handleClose() {
    stopScanning();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-t-[32px] bg-zinc-900 sm:rounded-[32px]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-4">
          <div>
            <p className="text-sm font-semibold text-white">Scan barcode</p>
            <p className="mt-0.5 text-xs text-zinc-400">Point your camera at a product barcode</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-white/10 bg-white/[0.06] p-2 text-zinc-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Camera viewport */}
        <div
          className="relative mx-5 overflow-hidden rounded-[24px] bg-zinc-950"
          style={{ aspectRatio: "4/3" }}
        >
          {status === "unsupported" && (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <Camera size={32} className="mb-3 text-zinc-600" />
              <p className="text-sm font-medium text-white">Camera scanning not supported</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                Your browser doesn't support the BarcodeDetector API. Try Chrome or Edge, or type
                the barcode number manually instead.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <Camera size={32} className="mb-3 text-zinc-600" />
              <p className="text-sm font-medium text-white">Camera unavailable</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">{errorMessage}</p>
            </div>
          )}

          {(status === "loading" || status === "scanning") && (
            <>
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                muted
                playsInline
                autoPlay
              />

              {status === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <p className="text-sm text-zinc-300">Starting camera…</p>
                </div>
              )}

              {/* Scanning reticle */}
              {status === "scanning" && !detectedCode && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-28 w-52">
                    <span className="absolute left-0 top-0 h-5 w-5 rounded-tl-lg border-l-2 border-t-2 border-emerald-400" />
                    <span className="absolute right-0 top-0 h-5 w-5 rounded-tr-lg border-r-2 border-t-2 border-emerald-400" />
                    <span className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-lg border-b-2 border-l-2 border-emerald-400" />
                    <span className="absolute bottom-0 right-0 h-5 w-5 rounded-br-lg border-b-2 border-r-2 border-emerald-400" />
                    <ScanLine
                      size={18}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400/50"
                    />
                  </div>
                </div>
              )}

              {/* Detection confirmation */}
              {detectedCode && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-400/20">
                  <div className="rounded-[18px] bg-emerald-400 px-5 py-3 text-center">
                    <p className="text-xs font-medium text-zinc-950">Barcode detected</p>
                    <p className="mt-0.5 text-sm font-bold text-zinc-950">{detectedCode}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-5 pt-3">
          <p className="text-center text-xs text-zinc-500">
            Supports UPC-A, EAN-13, Code 128, QR code, and more
          </p>
        </div>
      </div>
    </div>
  );
}
