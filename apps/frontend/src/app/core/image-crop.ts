import type { ImageCrop } from '@wortomat/shared';

/** Seitenverhältnis der Bildergalerie (Breite / Höhe) – Ausschnitte haben dasselbe. */
export const GALLERY_ASPECT = 4 / 3;

/** Größter mittiger Ausschnitt mit dem Seitenverhältnis `aspect` (in Bildpixeln). */
export function centeredCrop(aspect: number, imageWidth: number, imageHeight: number): ImageCrop {
  const imageAspect = imageWidth / imageHeight;
  // relativ: Breite / Höhe des Ausschnitts in Anteilen des Bilds
  const width = Math.min(1, aspect / imageAspect);
  const height = Math.min(1, imageAspect / aspect);
  return { x: (1 - width) / 2, y: (1 - height) / 2, width, height };
}

/**
 * Den Ausschnitt (oder das ganze Bild) so anpassen, dass er einen Rahmen mit dem
 * Seitenverhältnis `boxAspect` füllt – wie `object-fit: cover`, mittig im Ausschnitt.
 */
export function coverCrop(
  crop: ImageCrop | null,
  imageWidth: number,
  imageHeight: number,
  boxAspect: number,
): ImageCrop {
  const region = crop ?? { x: 0, y: 0, width: 1, height: 1 };
  const regionAspect = (region.width * imageWidth) / (region.height * imageHeight);
  let { width, height } = region;
  if (regionAspect > boxAspect) width = region.width * (boxAspect / regionAspect);
  else height = region.height * (regionAspect / boxAspect);
  return {
    x: region.x + (region.width - width) / 2,
    y: region.y + (region.height - height) / 2,
    width,
    height,
  };
}

/**
 * Lage eines `<img>` (absolut positioniert in einem Rahmen mit `overflow: hidden`), damit
 * genau der Ausschnitt den Rahmen füllt. Passt das Seitenverhältnis nicht, wird verzerrt –
 * vorher also mit {@link coverCrop} anpassen.
 */
export function cropStyle(crop: ImageCrop): Record<string, string> {
  const percent = (value: number) => `${value * 100}%`;
  return {
    width: percent(1 / crop.width),
    height: percent(1 / crop.height),
    left: percent(-crop.x / crop.width),
    top: percent(-crop.y / crop.height),
  };
}
