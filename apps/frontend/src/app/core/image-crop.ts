import type { ImageCrop } from '@wortomat/shared';

/** Gallery aspect ratio (width / height) – crops have the same. */
export const GALLERY_ASPECT = 4 / 3;

/** Largest centred crop with the aspect ratio `aspect` (in image pixels). */
export function centeredCrop(aspect: number, imageWidth: number, imageHeight: number): ImageCrop {
  const imageAspect = imageWidth / imageHeight;
  // relative: width / height of the crop as fractions of the image
  const width = Math.min(1, aspect / imageAspect);
  const height = Math.min(1, imageAspect / aspect);
  return { x: (1 - width) / 2, y: (1 - height) / 2, width, height };
}

/**
 * Adjusts the crop (or the whole image) to fill a box with the aspect ratio `boxAspect` – like
 * `object-fit: cover`, centred in the crop.
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
 * Position of an `<img>` (absolutely positioned in a box with `overflow: hidden`) so exactly the
 * crop fills the box. If the aspect ratio does not match, it is distorted – so adjust with {@link
 * coverCrop} first.
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
