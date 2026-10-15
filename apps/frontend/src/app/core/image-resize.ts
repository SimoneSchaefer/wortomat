export interface PreparedImage {
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
}

/** No book needs more – not even for printing a figure in the type area. */
const MAX_DIMENSION = 2400;
const SUPPORTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

/**
 * Formats Word and pdfLaTeX understand too. WebP and AVIF are therefore converted on upload –
 * otherwise the images would be missing from the export later.
 */
const EXPORT_COMPATIBLE = new Set(['image/jpeg', 'image/png', 'image/gif']);

export function isSupportedImage(file: File): boolean {
  return SUPPORTED_TYPES.has(file.type);
}

/**
 * Shrinks large photos before upload (phone photos are often 5–8 MB) and converts formats the
 * export cannot handle. GIFs stay unchanged so animations survive.
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
    // JPEG for photos; PNG where transparency may occur (PNG, WebP, AVIF).
    const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await canvas.convertToBlob({ type, quality: 0.88 });
    const fileName = file.name.replace(/\.[^.]+$/, '') + (type === 'image/jpeg' ? '.jpg' : '.png');
    return { blob, fileName, width: targetWidth, height: targetHeight };
  } finally {
    bitmap.close();
  }
}
