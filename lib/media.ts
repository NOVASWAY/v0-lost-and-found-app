/**
 * Private Blob media helpers.
 *
 * Uploads are stored with access: "private". API responses rewrite blob URLs to
 * /api/media?u=... so browsers never hit the raw storage URL. The media route
 * re-authorizes and streams bytes with the server token.
 */

export const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com"

export function isOurBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" && parsed.hostname.endsWith(BLOB_HOST_SUFFIX)
  } catch {
    return false
  }
}

/** Turn a stored blob URL into a same-origin proxy URL for <img> / next/image. */
export function toProxiedMediaUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return ""
  if (!isOurBlobUrl(url)) return url
  return `/api/media?u=${encodeURIComponent(url)}`
}

type MediaFields = {
  imageUrl?: string | null
  proofImage?: string | null
  itemImage?: string | null
  item?: { imageUrl?: string | null } | null
}

/** Rewrite known media fields on a response object (shallow + one nested item). */
export function withProxiedMedia<T extends MediaFields>(row: T): T {
  const next: MediaFields = { ...row }
  if (typeof row.imageUrl === "string") next.imageUrl = toProxiedMediaUrl(row.imageUrl)
  if (typeof row.proofImage === "string") next.proofImage = toProxiedMediaUrl(row.proofImage)
  if (typeof row.itemImage === "string") next.itemImage = toProxiedMediaUrl(row.itemImage)
  if (row.item && typeof row.item === "object") {
    next.item = {
      ...row.item,
      imageUrl:
        typeof row.item.imageUrl === "string"
          ? toProxiedMediaUrl(row.item.imageUrl)
          : row.item.imageUrl,
    }
  }
  return next as T
}

export function withProxiedMediaList<T extends MediaFields>(rows: T[]): T[] {
  return rows.map((row) => withProxiedMedia(row))
}
