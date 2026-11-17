export const coverSizePx = 500;

export const bandPhotoSize = { width: 640, height: 360 } as const;

// `/medium` is TheAudioDB's suffix for the downscaled copy of an image.
export function getMediumPhotoUrl(photoUrl: string) {
  return `${photoUrl}/medium`;
}
