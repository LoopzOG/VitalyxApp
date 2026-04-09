import { useEffect, useId, useRef, useState } from "react";
import { Camera, ImagePlus, LoaderCircle, ScanLine, X } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { scanBarcodeFromImage } from "@/lib/barcodeScanner";

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
];

export function LiveBarcodeScanner({ open, onDetected, onClose }: LiveBarcodeScannerProps) {
  const scannerId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingDetectionRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState("Point the camera at a UPC barcode.");
  const [isStarting, setIsStarting] = useState(false);
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);

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
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const width = Math.min(viewfinderWidth * 0.88, 360);
              const height = Math.min(Math.max(viewfinderHeight * 0.24, 110), 170);
              return {
                width: Math.floor(width),
                height: Math.floor(height),
              };
            },
            disableFlip: true,
            videoConstraints: {
              facingMode: { ideal: "environment" },
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
            setStatus(`Detected ${cleaned}. Closing scanner...`);

            if (!cancelled) {
              onClose();
            }

            Promise.resolve(onDetected(cleaned)).catch(() => {
              // The parent form handles lookup fallback and messaging after the scanner closes.
            });
          },
          () => {
            if (!cancelled && !handlingDetectionRef.current) {
              setStatus("Looking for a UPC or EAN barcode...");
            }
          },
        );

        if (!cancelled) {
          setStatus("Scanner is live. Hold the barcode steady, fill the guide left to right, and move slightly closer if it does not catch.");
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

  async function handlePhotoSelected(file: File) {
    setIsScanningPhoto(true);
    setStatus("Reading barcode from photo...");

    try {
      const result = await scanBarcodeFromImage(file);
      const cleaned = result?.replace(/[^\d]/g, "").trim();

      if (!cleaned) {
        setStatus("No UPC was found in that photo. Try a sharper image with the barcode filling more of the frame.");
        return;
      }

      handlingDetectionRef.current = true;
      setStatus(`Detected ${cleaned} from photo. Closing scanner...`);
      onClose();
      void Promise.resolve(onDetected(cleaned));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to read barcode from photo.");
    } finally {
      setIsScanningPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              void handlePhotoSelected(file);
            }}
          />
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
                  Use good lighting, keep the barcode horizontal inside the guide, and if live scanning misses it, try the photo fallback below.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanningPhoto}
              className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isScanningPhoto ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              Scan From Photo
            </button>
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
    </div>
  );
}
