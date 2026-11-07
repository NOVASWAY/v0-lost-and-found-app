import { describe, expect, it } from "vitest"
import {
  isOurBlobUrl,
  toProxiedMediaUrl,
  withProxiedMedia,
  withProxiedMediaList,
} from "../../lib/media"

describe("isOurBlobUrl", () => {
  it("accepts public and private Vercel Blob hosts", () => {
    expect(isOurBlobUrl("https://abc.blob.vercel-storage.com/items/u/a.png")).toBe(true)
    expect(isOurBlobUrl("https://abc.private.blob.vercel-storage.com/items/u/a.png")).toBe(true)
  })

  it("rejects foreign hosts and non-https", () => {
    expect(isOurBlobUrl("https://evil.example.com/a.png")).toBe(false)
    expect(isOurBlobUrl("http://abc.blob.vercel-storage.com/a.png")).toBe(false)
    expect(isOurBlobUrl("not-a-url")).toBe(false)
  })
})

describe("toProxiedMediaUrl", () => {
  it("rewrites our blob URLs through /api/media", () => {
    const raw = "https://abc.private.blob.vercel-storage.com/items/u/a.png"
    expect(toProxiedMediaUrl(raw)).toBe(`/api/media?u=${encodeURIComponent(raw)}`)
  })

  it("leaves non-blob URLs alone (fixtures / placeholders)", () => {
    expect(toProxiedMediaUrl("https://example.com/a.png")).toBe("https://example.com/a.png")
    expect(toProxiedMediaUrl("")).toBe("")
  })
})

describe("withProxiedMedia", () => {
  it("rewrites imageUrl, proofImage, itemImage, and nested item.imageUrl", () => {
    const raw = "https://abc.blob.vercel-storage.com/items/u/a.png"
    const proxied = withProxiedMedia({
      imageUrl: raw,
      proofImage: raw,
      itemImage: raw,
      item: { imageUrl: raw },
      id: "x",
    })
    expect(proxied.imageUrl).toContain("/api/media?u=")
    expect(proxied.proofImage).toContain("/api/media?u=")
    expect(proxied.itemImage).toContain("/api/media?u=")
    expect(proxied.item?.imageUrl).toContain("/api/media?u=")
    expect(proxied.id).toBe("x")
  })

  it("maps lists", () => {
    const raw = "https://abc.blob.vercel-storage.com/items/u/a.png"
    const list = withProxiedMediaList([{ imageUrl: raw }, { imageUrl: "https://example.com/x.png" }])
    expect(list[0].imageUrl).toContain("/api/media?u=")
    expect(list[1].imageUrl).toBe("https://example.com/x.png")
  })
})
