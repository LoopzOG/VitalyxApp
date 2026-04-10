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

const barcodeLengthPattern = /^(8|12|13)$/;
const detectionConfirmationWindowMs = 1500;
const statusThrottleMs = 1200;
const preferredZoomLevel = 2;

function cleanBarcode(value: string) {
  const cleaned = value.replace(/[^\d]/g, "").trim();
  return barcodeLengthPattern.test(String(cleaned.length)) ? cleaned : "";
}

function formatCameraLabel(label: string, index: number) {
  const trimmed = label.trim();
  if (!trimmed) {
    return `Camera ${index + 1}`;
  }

  return trimmed.length > 42 ? `${trimmed.slice(0, 39)}...` : trimmed;
}

function getPreferredCameraId(cameras: Array<{ id: string; label: string }>) {
  return cameras.find((camera) => /back|rear|environment/i.test(camera.label))?.id ?? cameras[0]?.id ?? null;
}

export function LiveBarcodeScanner({ open, onDetected, onClose }: LiveBarcodeScannerProps) {
  const scannerId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingDetectionRef = useRef(false);
  const detectionStateRef = useRef<{ value: string; count: number; seenAt: number } | null>(null);
  const lastStatusAtRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasAutoZoomedRef = useRef(false);
  const [status, setStatus] = useState("Point the camera at a UPC barcode.");
  const [isStarting, setIsStarting] = useState(false);
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [zoomState, setZoomState] = useState<{ min: number; max: number; step: number; value: number } | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);

  useEffect(() => {
    if (open) {
      return;
    }

    handlingDetectionRef.current = false;
    detectionStateRef.current = null;
    lastStatusAtRef.current = 0;
    hasAutoZoomedRef.current = false;
    setAvailableCameras([]);
    setSelectedCameraId(null);
    setZoomState(null);
    setTorchSupported(false);
    setTorchEnabled(false);
    setStatus("Point the camera at a UPC barcode.");
  }, [open]);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    let cancelled = false;
    async function startScanner() {
      setIsStarting(true);
      setStatus("Starting camera...");

      try {
        const cameras = await Html5Qrcode.getCameras().catch(() => []);
        if (cancelled) {
          return;
        }

        setAvailableCameras(cameras);
        const resolvedCameraId = selectedCameraId && cameras.some((camera) => camera.id === selectedCameraId)
          ? selectedCameraId
          : getPreferredCameraId(cameras);

        if (!selectedCameraId && resolvedCameraId) {
          setSelectedCameraId(resolvedCameraId);
        }

        const scanner = new Html5Qrcode(scannerId, {
          useBarCodeDetectorIfSupported: true,
          formatsToSupport: supportedBarcodeFormats,
          verbose: false,
        });
        scannerRef.current = scanner;
        handlingDetectionRef.current = false;
        detectionStateRef.current = null;

        await scanner.start(
          resolvedCameraId ?? { facingMode: { ideal: "environment" } },
          {
            fps: 12,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const width = Math.min(viewfinderWidth * 0.9, 380);
              const height = Math.min(Math.max(viewfinderHeight * 0.2, 96), 148);
              return {
                width: Math.floor(width),
                height: Math.floor(height),
              };
            },
            disableFlip: true,
            aspectRatio: 1.7777777778,
            videoConstraints: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          async (decodedText) => {
            const cleaned = cleanBarcode(decodedText);
            if (!cleaned || handlingDetectionRef.current) {
              return;
            }

            const now = Date.now();
            const currentDetection = detectionStateRef.current;
            const nextCount =
              currentDetection?.value === cleaned && now - currentDetection.seenAt <= detectionConfirmationWindowMs
                ? currentDetection.count + 1
                : 1;

            detectionStateRef.current = {
              value: cleaned,
              count: nextCount,
              seenAt: now,
            };

            if (nextCount < 2) {
              setStatus(`Found ${cleaned}. Hold steady for one more read...`);
              return;
            }

            handlingDetectionRef.current = true;

            try {
              scanner.pause(true);
            } catch {
              // Best-effort pause before closing to avoid duplicate callbacks.
            }

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
              const now = Date.now();
              if (now - lastStatusAtRef.current >= statusThrottleMs) {
                lastStatusAtRef.current = now;
                setStatus("Looking for a UPC or EAN barcode...");
              }
            }
          },
        );

        if (!cancelled) {
          const capabilities = scanner.getRunningTrackCameraCapabilities();
          const zoomFeature = capabilities.zoomFeature();
          const torchFeature = capabilities.torchFeature();

          setTorchSupported(torchFeature.isSupported());
          setTorchEnabled(Boolean(torchFeature.value()));

          if (zoomFeature.isSupported()) {
            const min = zoomFeature.min();
            const max = zoomFeature.max();
            const step = zoomFeature.step() || 0.1;
            const currentValue = zoomFeature.value() ?? min;
            const autoZoom = Math.min(Math.max(preferredZoomLevel, min), max);

            if (!hasAutoZoomedRef.current && autoZoom > currentValue + step / 2) {
              await zoomFeature.apply(autoZoom).catch(() => undefined);
              hasAutoZoomedRef.current = true;
            }

            const value = zoomFeature.value() ?? autoZoom ?? currentValue;
            setZoomState({ min, max, step, value });
          } else {
            setZoomState(null);
          }

          setStatus("Scanner is live. Fill the guide left to right, hold still for a beat, and use zoom or flash if the code is small.");
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
  }, [open, onDetected, onClose, scannerId, selectedCameraId]);

  if (!open) {
    return null;
  }

  async function handleZoomChange(nextValue: number) {
    const scanner = scannerRef.current;
    if (!scanner) {
      return;
    }

    try {
      const zoomFeature = scanner.getRunningTrackCameraCapabilities().zoomFeature();
      if (!zoomFeature.isSupported()) {
        return;
      }

      await zoomFeature.apply(nextValue);
      setZoomState((current) => (current ? { ...current, value: nextValue } : current));
    } catch {
      setStatus("Zoom could not be adjusted on this camera.");
    }
  }

  async function handleTorchToggle() {
    const scanner = scannerRef.current;
    if (!scanner) {
      return;
    }

    try {
      const torchFeature = scanner.getRunningTrackCameraCapabilities().torchFeature();
      if (!torchFeature.isSupported()) {
        return;
      }

      const nextValue = !torchEnabled;
      await torchFeature.apply(nextValue);
      setTorchEnabled(nextValue);
    } catch {
      setStatus("Flash could not be toggled on this camera.");
    }
  }

  async function handlePhotoSelected(file: File) {
    setIsScanningPhoto(true);
    setStatus("Reading barcode from photo...");

    try {
      const result = await scanBarcodeFromImage(file);
      const cleaned = result ? cleanBarcode(result) : "";

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
                  Use good lighting, keep the barcode horizontal inside the guide, and hold steady until the same code is confirmed twice.
                </p>
              </div>
            </div>
          </div>

          {availableCameras.length > 1 ? (
            <label className="mt-4 block text-sm text-zinc-300">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-zinc-500">Camera</span>
              <select
                value={selectedCameraId ?? ""}
                onChange={(event) => {
                  handlingDetectionRef.current = false;
                  detectionStateRef.current = null;
                  hasAutoZoomedRef.current = false;
                  setZoomState(null);
                  setTorchSupported(false);
                  setTorchEnabled(false);
                  setStatus("Switching camera...");
                  setSelectedCameraId(event.target.value || null);
                }}
                className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              >
                {availableCameras.map((camera, index) => (
                  <option key={camera.id} value={camera.id}>
                    {formatCameraLabel(camera.label, index)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {zoomState || torchSupported ? (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              {zoomState ? (
                <label className="block rounded-[20px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-200">
                  <div className="flex items-center justify-between gap-3">
                    <span>Zoom</span>
                    <span className="text-zinc-400">{zoomState.value.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={zoomState.min}
                    max={zoomState.max}
                    step={zoomState.step}
                    value={zoomState.value}
                    onChange={(event) => {
                      void handleZoomChange(Number(event.target.value));
                    }}
                    className="mt-3 w-full accent-emerald-300"
                  />
                </label>
              ) : null}

              {torchSupported ? (
                <button
                  type="button"
                  onClick={() => {
                    void handleTorchToggle();
                  }}
                  className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-zinc-100"
                >
                  {torchEnabled ? "Flash on" : "Flash off"}
                </button>
              ) : null}
            </div>
          ) : null}
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
