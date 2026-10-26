export const PRIVATE_BLOB_ROUTE = "/api/private-blobs"

export type PrivateBlobPurpose = "item" | "claim-proof"

export function privateBlobUrl(pathname: string): string {
  return `${PRIVATE_BLOB_ROUTE}?pathname=${encodeURIComponent(pathname)}`
}

export function isAllowedPrivateBlobPathname(pathname: string): boolean {
  return (
    /^(items|claim-proofs)\/[A-Za-z0-9_-]{1,100}\/[A-Za-z0-9][A-Za-z0-9._-]{0,200}$/.test(pathname) &&
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

export function isOwnPrivateBlobUrl(
  value: string,
  userId: string,
  purpose: PrivateBlobPurpose,
): boolean {
  const pathname = privateBlobPathname(value)
  const prefix = purpose === "item" ? `items/${userId}/` : `claim-proofs/${userId}/`
  return pathname !== null && pathname.startsWith(prefix)
}
