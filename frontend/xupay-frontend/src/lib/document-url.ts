/** The file types a KYC document can be (KycUploader.schema.ts and the user-service DTO agree). */
const VIEWABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

/**
 * A blob: URL for a KYC document stored as a base64 data URL, or null when it
 * is not a well-formed data URL of an accepted type.
 *
 * The app stores uploads as data URLs (there is no object storage), and
 * browsers refuse to open a data: URL from a link - top-frame navigation to
 * data: is blocked - so the review queue's "Open file" did nothing. A blob:
 * URL opens normally. It runs with this app's origin, which is why the type
 * is limited to images and PDF: an HTML or SVG "document" would execute as
 * the app, in an admin's session.
 */
export function documentBlobUrl(dataUrl: string): string | null {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return null;

  const header = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64$/i.exec(dataUrl.slice(0, comma));
  const type = header?.[1].toLowerCase();
  if (!type || !VIEWABLE_TYPES.has(type)) return null;

  let binary: string;
  try {
    binary = atob(dataUrl.slice(comma + 1));
  } catch {
    return null; // not valid base64
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return URL.createObjectURL(new Blob([bytes], { type }));
}
