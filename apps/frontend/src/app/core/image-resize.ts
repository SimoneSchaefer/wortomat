export interface PreparedImage {
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
}

/** Größer braucht kein Buch – auch nicht für den Druck einer Abbildung im Satzspiegel. */
const MAX_DIMENSION = 2400;
const SUPPORTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

/**
 * Formate, die auch Word und pdfLaTeX verstehen. WebP und AVIF werden daher beim Hochladen
 * umgewandelt – sonst fehlen die Bilder später im Export.
 */
const EXPORT_COMPATIBLE = new Set(['image/jpeg', 'image/png', 'image/gif']);

export function isSupportedImage(file: File): boolean {
  return SUPPORTED_TYPES.has(file.type);
}

/**
 * Verkleinert große Fotos vor dem Upload (Handyfotos haben oft 5–8 MB) und wandelt Formate um,
 * die der Export nicht kann. GIFs bleiben unverändert, damit Animationen erhalten bleiben.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const needsConversion = !EXPORT_COMPATIBLE.has(file.type);
    if ((scale === 1 && !needsConversion) || file.type === 'image/gif') {
      return { blob: file, fileName: file.name, width, height };
    }

    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const context = canvas.getContext('2d');
    if (!context) {
      return { blob: file, fileName: file.name, width, height };
    }
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    // JPEG für Fotos; PNG, wo Transparenz vorkommen kann (PNG, WebP, AVIF).
    const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await canvas.convertToBlob({ type, quality: 0.88 });
    const fileName = file.name.replace(/\.[^.]+$/, '') + (type === 'image/jpeg' ? '.jpg' : '.png');
    return { blob, fileName, width: targetWidth, height: targetHeight };
  } finally {
    bitmap.close();
  }
}
