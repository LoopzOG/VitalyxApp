import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const supportedFormats = [
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
];

export async function scanBarcodeFromImage(file: File) {
  if (typeof document === "undefined") {
    return null;
  }

  const elementId = `barcode-scan-${crypto.randomUUID()}`;
  const container = document.createElement("div");
  container.id = elementId;
  container.style.position = "fixed";
  container.style.width = "1px";
  container.style.height = "1px";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.overflow = "hidden";
  document.body.appendChild(container);

  const scanner = new Html5Qrcode(elementId, {
    formatsToSupport: supportedFormats,
    verbose: false,
  });

  try {
    const result = await scanner.scanFile(file, false);
    return result.trim() || null;
  } catch {
    return null;
  } finally {
    try {
      await scanner.clear();
    } catch {
      // `scanFile` does not always create an active scanner surface to clear.
    }
    container.remove();
  }
}
