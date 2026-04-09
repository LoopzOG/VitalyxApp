import { useEffect, useId, useRef, useState } from "react";
import { Camera, LoaderCircle, ScanLine, X } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

type LiveBarcodeScannerProps = {
  open: boolean;
  onDetected: (barcode: string) => void | Promise<void>;
  onClose: () => void;
};

const supportedBarcodeFormats = [
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
];

export function LiveBarcodeScanner({ open, onDetected, onClose }: LiveBarcodeScannerProps) {
  const scannerId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingDetectionRef = useRef(false);
  const [status, setStatus] = useState("Point the camera at a UPC barcode.");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    let cancelled = false;
    const scanner = new Html5Qrcode(scannerId, {
      useBarCodeDetectorIfSupported: true,
      formatsToSupport: supportedBarcodeFormats,
      verbose: false,
    });
    scannerRef.current = scanner;
    handlingDetectionRef.current = false;

    async function startScanner() {
      setIsStarting(true);
      setStatus("Starting camera...");

      try {
        const cameras = await Html5Qrcode.getCameras().catch(() => []);
        const preferredCamera =
          cameras.find((camera) => /back|rear|environment/i.test(camera.label))?.id ??
          cameras[0]?.id ??
          { facingMode: { ideal: "environment" } };

        await scanner.start(
          preferredCamera,
          {
            fps: 6,
            aspectRatio: 1.777778,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const width = Math.min(viewfinderWidth * 0.96, 420);
              const height = Math.min(Math.max(viewfinderHeight * 0.2, 96), 140);
              return {
                width: Math.floor(width),
                height: Math.floor(height),
              };
            },
            disableFlip: true,
            videoConstraints: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          async (decodedText) => {
            const cleaned = decodedText.replace(/[^\d]/g, "").trim();
            if (!cleaned || handlingDetectionRef.current) {
              return;
            }

            handlingDetectionRef.current = true;
            setStatus(`Detected ${cleaned}. Loading item...`);

            try {
              await onDetected(cleaned);
              if (!cancelled) {
                onClose();
              }
            } catch {
              handlingDetectionRef.current = false;
              if (!cancelled) {
                setStatus("UPC detected, but lookup failed. Try again or enter the barcode manually.");
              }
            }
          },
          () => {
            if (!cancelled && !handlingDetectionRef.current) {
              setStatus("Looking for a UPC or EAN barcode...");
            }
          },
        );

        if (!cancelled) {
          setStatus("Scanner is live. Hold the barcode steady and fill the guide from left to right.");
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Camera access failed.";
          setStatus(message.includes("Permission") ? "Camera access was blocked. Allow camera access and try again." : message);
        }
      } finally {
        if (!cancelled) {
          setIsStarting(false);
        }
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      handlingDetectionRef.current = false;

      const activeScanner = scannerRef.current;
      scannerRef.current = null;

      if (!activeScanner) {
        return;
      }

      void (async () => {
        try {
          if (activeScanner.isScanning) {
            await activeScanner.stop();
          }
        } catch {
          // Best-effort cleanup.
        }

        try {
          await activeScanner.clear();
        } catch {
          // Best-effort cleanup.
        }
      })();
    };
  }, [open, onDetected, onClose, scannerId]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-md flex-col rounded-[30px] border border-white/10 bg-zinc-950 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">Live UPC Scanner</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Scan with camera</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300"
            aria-label="Close barcode scanner"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-5 py-5">
          <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black">
            <div id={scannerId} className="min-h-[360px] w-full bg-black" />
            <div className="pointer-events-none absolute inset-x-6 top-1/2 h-28 -translate-y-1/2 rounded-[24px] border-2 border-emerald-300/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]" />
            <div className="pointer-events-none absolute inset-x-10 top-1/2 -translate-y-1/2 border-t-2 border-emerald-300/80" />
          </div>

          <div className="mt-4 rounded-[22px] border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            <div className="flex items-start gap-3">
              {isStarting ? <LoaderCircle size={18} className="mt-0.5 shrink-0 animate-spin" /> : <Camera size={18} className="mt-0.5 shrink-0" />}
              <div>
                <p>{status}</p>
                <p className="mt-2 text-emerald-100/75">
                  Use good lighting and center the barcode inside the guide so Vitalyx can read it without taking a photo.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-100"
          >
            <ScanLine size={16} />
            Close scanner
          </button>
        </div>
      </div>
    </div>
  );
}
