export function buildMediaResourcePath(mediaId: string | null | undefined): string | null {
  if (!mediaId) {
    return null;
  }

  return `/media/${mediaId}`;
}
