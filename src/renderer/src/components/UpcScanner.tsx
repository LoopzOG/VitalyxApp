import { useEffect, useRef, useState } from "react";
import { X, Flashlight, ScanLine } from "lucide-react";

// BarcodeDetector is not yet in TypeScript's lib — declare it minimally
declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>;
  static getSupportedFormats(): Promise<string[]>;
}

export type UpcScannerProps = {
  onDetected: (barcode: string) => void;
  onClose: () => void;
};

function isSupported() {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

export function UpcScanner({ onDetected, onClose }: UpcScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "error">("starting");
  const [errorMsg, setErrorMsg] = useState("");
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    if (!isSupported()) {
      setStatus("error");
      setErrorMsg("Camera barcode scanning isn't supported in this browser. Type the barcode manually below.");
      return;
    }

    let active = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"] });

        setStatus("scanning");

        async function scan() {
          if (!active || !videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          if (video.readyState < 2) {
            rafRef.current = requestAnimationFrame(scan);
            return;
          }

          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(video, 0, 0);

          try {
            const results = await detector.detect(canvas);
            if (results.length > 0 && active) {
              const raw = results[0].rawValue;
              const cleaned = raw.replace(/[^\d]/g, "");
              if (cleaned.length >= 8) {
                onDetected(cleaned);
                return;
              }
            }
          } catch {
            // detect() throws on empty frames — ignore
          }

          rafRef.current = requestAnimationFrame(scan);
        }

        rafRef.current = requestAnimationFrame(scan);
      } catch (err) {
        if (!active) return;
        setStatus("error");
        setErrorMsg(
          err instanceof Error && err.name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access and try again, or type the barcode manually."
            : "Camera could not be started. Type the barcode manually instead.",
        );
      }
    }

    start();

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] });
      setTorch((v) => !v);
    } catch {
      // torch not supported on this device — ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-3">
        <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/10 p-2">
          <X size={20} className="text-white" />
        </button>
        <p className="text-sm font-medium text-white">Scan barcode</p>
        <button
          type="button"
          onClick={toggleTorch}
          className={`rounded-full border p-2 ${torch ? "border-emerald-400 bg-emerald-400/20" : "border-white/10 bg-white/10"}`}
        >
          <Flashlight size={20} className={torch ? "text-emerald-300" : "text-white"} />
        </button>
      </div>

      {/* viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        {status !== "error" ? (
          <>
            <video
              ref={videoRef}
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* scanning overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative h-52 w-72">
                {/* corner brackets */}
                <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-2 border-t-2 border-emerald-400" />
                <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-2 border-t-2 border-emerald-400" />
                <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-2 border-l-2 border-emerald-400" />
                <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-2 border-r-2 border-emerald-400" />

                {status === "scanning" ? (
                  <div className="absolute inset-x-0 top-0 animate-[scanline_2s_ease-in-out_infinite]">
                    <ScanLine size={288} className="text-emerald-400/70" />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  </div>
                )}
              </div>
              <p className="mt-6 text-sm text-white/70">
                {status === "scanning" ? "Point the camera at a barcode" : "Starting camera…"}
              </p>
            </div>

            {/* dark vignette outside frame */}
            <div className="pointer-events-none absolute inset-0 bg-black/50 [mask-image:radial-gradient(ellipse_288px_208px_at_center,transparent_100%,black_100%)]" />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              {errorMsg}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[22px] bg-emerald-400 px-6 py-3 text-sm font-semibold text-zinc-950"
            >
              Type barcode instead
            </button>
          </div>
        )}
      </div>

      <div className="px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-3 text-center text-xs text-white/40">
        Supports UPC-A, UPC-E, EAN-8, EAN-13, Code 128
      </div>
    </div>
  );
}
