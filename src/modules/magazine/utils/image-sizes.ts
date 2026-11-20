export const coverSizePx = 500;

export const bandPhotoSize = { width: 640, height: 360 } as const;

// Below this width the spread's body text drops under 9px (0.98cqw of a book narrower than ~920px).
export const readerLayoutQuery = '(max-width: 1023px)';

export const magazineImageSizes = `${readerLayoutQuery} 100vw, 50vw`;

// `/medium` is TheAudioDB's suffix for the downscaled copy of an image.
export function getMediumPhotoUrl(photoUrl: string) {
  return `${photoUrl}/medium`;
}
