import { afterEach, describe, expect, it } from "vitest"

import { getSiteUrl } from "../../lib/site-url"

const ORIGINAL = process.env.NEXT_PUBLIC_SITE_URL

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL
})

describe("getSiteUrl", () => {
  it("falls back to the local origin when unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getSiteUrl()).toBe("http://localhost:3000")
  })

  it("returns a valid configured URL without a trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://vault.example.com/"
    expect(getSiteUrl()).toBe("https://vault.example.com")
  })

  it("falls back when the configured value is not a URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not-a-url"
    expect(getSiteUrl()).toBe("http://localhost:3000")
  })

  it("falls back when the configured value uses a non-http scheme", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "ftp://vault.example.com"
    expect(getSiteUrl()).toBe("http://localhost:3000")
  })

  it("falls back when the configured value is blank", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "   "
    expect(getSiteUrl()).toBe("http://localhost:3000")
  })
})
