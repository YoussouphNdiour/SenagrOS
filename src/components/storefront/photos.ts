export const PLACEHOLDER_PHOTO = '/storefront/products/placeholder.svg';

export function listingPhoto(photos: { url: string; alt?: string }[] | null | undefined): {
  url: string;
  alt?: string;
} {
  return photos?.[0]?.url ? photos[0] : { url: PLACEHOLDER_PHOTO };
}
