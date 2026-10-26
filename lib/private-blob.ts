export const PRIVATE_BLOB_ROUTE = "/api/private-blobs"

export type PrivateBlobPurpose = "item" | "claim-proof" | "occurrence"

export function privateBlobPurposePath(purpose: PrivateBlobPurpose): string {
  if (purpose === "item") return "items"
  if (purpose === "claim-proof") return "claim-proofs"
  return "occurrence-book"
}

export function privateBlobUrl(pathname: string): string {
  return `${PRIVATE_BLOB_ROUTE}?pathname=${encodeURIComponent(pathname)}`
}

export function isAllowedPrivateBlobPathname(pathname: string): boolean {
  return (
    /^(items|claim-proofs|occurrence-book)\/[A-Za-z0-9_-]{1,100}\/[A-Za-z0-9][A-Za-z0-9._-]{0,200}$/.test(pathname) &&
    !pathname.includes("..")
  )
}

export function privateBlobPathname(value: string): string | null {
  if (!value.startsWith(`${PRIVATE_BLOB_ROUTE}?`)) return null

  try {
    const url = new URL(value, "https://vault.invalid")
    if (url.origin !== "https://vault.invalid" || url.pathname !== PRIVATE_BLOB_ROUTE || url.hash) return null
    if ([...url.searchParams.keys()].length !== 1) return null

    const pathname = url.searchParams.get("pathname")
    return pathname && isAllowedPrivateBlobPathname(pathname) ? pathname : null
  } catch {
    return null
  }
}

export function isPrivateBlobUrl(value: string): boolean {
  return privateBlobPathname(value) !== null
}

export function safePrivateBlobDisplayUrl(value: unknown): string {
  return typeof value === "string" && isPrivateBlobUrl(value) ? value : "/placeholder.svg"
}

export function safePrivateBlobAttachments(value: unknown): unknown {
  if (!Array.isArray(value)) return value

  return value.map((attachment) => {
    if (typeof attachment !== "object" || attachment === null || Array.isArray(attachment)) return attachment
    const record = attachment as Record<string, unknown>
    return { ...record, url: safePrivateBlobDisplayUrl(record.url) }
  })
}

export function isPrivateBlobPurposeUrl(value: string, purpose: PrivateBlobPurpose): boolean {
  const pathname = privateBlobPathname(value)
  return pathname !== null && pathname.startsWith(`${privateBlobPurposePath(purpose)}/`)
}

export function isOwnPrivateBlobUrl(
  value: string,
  userId: string,
  purpose: PrivateBlobPurpose,
): boolean {
  const pathname = privateBlobPathname(value)
  const prefix = `${privateBlobPurposePath(purpose)}/${userId}/`
  return pathname !== null && pathname.startsWith(prefix)
}

export function hasPrivateBlobUrlInJson(value: unknown, url: string): boolean {
  if (!Array.isArray(value)) return false

  return value.some((attachment) => {
    if (typeof attachment !== "object" || attachment === null || Array.isArray(attachment)) return false
    return (attachment as Record<string, unknown>).url === url
  })
}
