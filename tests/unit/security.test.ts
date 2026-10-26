import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

import {
  assertSameOrigin,
  isPathTraversalSafe,
  isValidCUID,
  sanitizePath,
  validateUrl,
  sanitizeSearchQuery,
  validateRouteId,
  parsePagination,
  readJsonBody,
} from "../../lib/security"
import { safeCompare } from "../../lib/secret"

function makeRequest(
  headers: Record<string, string>,
  url = "https://vault.example.com/api/test",
): NextRequest {
  return { url, nextUrl: new URL(url), headers: new Headers(headers) } as unknown as NextRequest
}

describe("assertSameOrigin (CSRF)", () => {
  it("rejects headless requests without Origin or Referer", () => {
    expect(assertSameOrigin(makeRequest({ host: "vault.example.com" }))).toBe(false)
  })

  it("accepts a matching Referer when Origin is absent", () => {
    expect(
      assertSameOrigin(makeRequest({ referer: "https://vault.example.com/login" }))
    ).toBe(true)
  })

  it("matches the request origin and ignores the Host header", () => {
    expect(
      assertSameOrigin(
        makeRequest({ origin: "https://vault.example.com", host: "evil.example.com" }),
      ),
    ).toBe(true)
  })

  it("allows the request's exact origin", () => {
    expect(assertSameOrigin(makeRequest({ origin: "https://vault.example.com" }))).toBe(true)
  })

  it("rejects a cross-site origin", () => {
    expect(assertSameOrigin(makeRequest({ origin: "https://evil.example.com" }))).toBe(false)
  })

  it("rejects an origin that does not match the request origin", () => {
    expect(
      assertSameOrigin(
        makeRequest({ origin: "https://vault.example.com" }, "https://other.example.com/api/test"),
      ),
    ).toBe(false)
  })

  it("rejects non-http(s) origins", () => {
    expect(assertSameOrigin(makeRequest({ origin: "ftp://vault.example.com" }))).toBe(false)
  })

  it("rejects an unparseable origin", () => {
    expect(assertSameOrigin(makeRequest({ origin: "not a url" }))).toBe(false)
  })
})

describe("isPathTraversalSafe", () => {
  it("flags parent-directory patterns", () => {
    for (const s of ["../etc/passwd", "..\\etc", "/etc/passwd", "C:\\Windows", "a/../../b", "..%2Fetc", "..%5Cetc", "%2E%2E%2F"]) {
      expect(isPathTraversalSafe(s), s).toBe(false)
    }
  })

  it("flags file:// protocol", () => {
    expect(isPathTraversalSafe("file:///etc/shadow")).toBe(false)
  })

  it("accepts benign strings", () => {
    expect(isPathTraversalSafe("a-normal-string")).toBe(true)
    expect(isPathTraversalSafe("")).toBe(false)
  })
})

describe("isValidCUID", () => {
  it("accepts cuid and uuid formats", () => {
    expect(isValidCUID("c123456789012345678901234")).toBe(true)
    expect(isValidCUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true)
  })

  it("rejects garbage and empty ids", () => {
    expect(isValidCUID("not-an-id")).toBe(false)
    expect(isValidCUID("")).toBe(false)
    expect(isValidCUID("c12345678901234567890123")).toBe(false) // 24 chars, not 25
  })
})

describe("sanitizePath", () => {
  it("strips traversal and absolute-path markers", () => {
    expect(sanitizePath("../../etc/passwd")).toBe("etc/passwd")
    expect(sanitizePath("C:\\Windows\\system32")).toBe("Windows\\system32")
    expect(sanitizePath("file:///etc/shadow")).toBe("/etc/shadow")
    expect(sanitizePath("plain-name")).toBe("plain-name")
  })
})

describe("validateUrl", () => {
  beforeAll(() => {
    vi.stubEnv("NODE_ENV", "production")
  })
  afterAll(() => {
    vi.unstubAllEnvs()
  })

  it("accepts public https URLs", () => {
    expect(validateUrl("https://images.example.com/photo.png").valid).toBe(true)
  })

  it("rejects javascript: and other protocols", () => {
    expect(validateUrl("javascript:alert(1)").valid).toBe(false)
    expect(validateUrl("ftp://example.com/x").valid).toBe(false)
  })

  it("rejects private/internal hosts in production", () => {
    expect(validateUrl("http://localhost/x.png").valid).toBe(false)
    expect(validateUrl("http://192.168.1.10/x.png").valid).toBe(false)
    expect(validateUrl("http://10.0.0.5/x.png").valid).toBe(false)
  })

  it("rejects traversal and oversized URLs", () => {
    expect(validateUrl("https://example.com/../../etc").valid).toBe(false)
    expect(validateUrl(`https://example.com/${"a".repeat(5001)}`).valid).toBe(false)
  })

  it("rejects base64 data URLs", () => {
    expect(validateUrl("data:image/png;base64,iVBORw0KGgo=").valid).toBe(false)
    expect(validateUrl("data:text/html;base64,PHNjcmlwdD4=").valid).toBe(false)
  })
})

describe("sanitizeSearchQuery", () => {
  it("strips HTML/SQL injection characters", () => {
    const clean = sanitizeSearchQuery(`<script>alert(1)</script>; DROP TABLE "users";'`)
    expect(clean).not.toMatch(/[<>'"\\;{}]/)
  })

  it("truncates long queries to 200 chars", () => {
    expect(sanitizeSearchQuery("a".repeat(500))).toHaveLength(200)
  })

  it("returns empty string for non-strings", () => {
    expect(sanitizeSearchQuery("")).toBe("")
  })
})

describe("validateRouteId", () => {
  it("accepts a valid cuid", () => {
    expect(validateRouteId("c123456789012345678901234").valid).toBe(true)
  })

  it("rejects traversal and malformed ids", () => {
    expect(validateRouteId("../../etc/passwd").valid).toBe(false)
    expect(validateRouteId("garbage").valid).toBe(false)
    expect(validateRouteId("").valid).toBe(false)
  })
})

describe("safeCompare", () => {
  it("returns true for identical strings", () => {
    expect(safeCompare("Bearer s3cret", "Bearer s3cret")).toBe(true)
  })

  it("returns false for differing strings of equal length", () => {
    expect(safeCompare("Bearer s3cret", "Bearer s3crev")).toBe(false)
    expect(safeCompare("Bearer s3cret", "Bearer s3cre")).toBe(false)
  })

  it("returns false for strings of different lengths without throwing", () => {
    expect(safeCompare("short", "much longer secret")).toBe(false)
    expect(safeCompare("", "x")).toBe(false)
  })

  it("returns false for non-string inputs", () => {
    expect(safeCompare(undefined as unknown as string, "x")).toBe(false)
    expect(safeCompare("x", null as unknown as string)).toBe(false)
  })
})

describe("parsePagination", () => {
  const params = (query: string) => new URLSearchParams(query)

  it("uses defaults when params are absent", () => {
    expect(parsePagination(params(""))).toEqual({ page: 1, limit: 20, skip: 0 })
    expect(parsePagination(params(""), { defaultLimit: 50, maxLimit: 200 })).toEqual({
      page: 1,
      limit: 50,
      skip: 0,
    })
  })

  it("computes skip from page and limit", () => {
    expect(parsePagination(params("page=3&limit=10"))).toEqual({ page: 3, limit: 10, skip: 20 })
  })

  it("clamps the limit to the cap", () => {
    expect(parsePagination(params("limit=99999"), { maxLimit: 100 }).limit).toBe(100)
  })

  it("falls back instead of producing NaN or negatives", () => {
    for (const bad of ["abc", "-1", "0", "1.5", "1e5", " ", "999999999999999999999"]) {
      expect(parsePagination(params(`limit=${encodeURIComponent(bad)}`))).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
      })
      expect(parsePagination(params(`page=${encodeURIComponent(bad)}`))).toEqual({
        page: 1,
        limit: 20,
        skip: 0,
      })
    }
  })
})

describe("readJsonBody", () => {
  it("parses a valid JSON body", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true }),
    })
    await expect(readJsonBody(request)).resolves.toEqual({ ok: true, data: { ok: true } })
  })

  it("returns ok:false for malformed JSON instead of throwing", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    })
    await expect(readJsonBody(request)).resolves.toEqual({ ok: false })
  })

  it("returns ok:false for an empty body", async () => {
    const request = new Request("http://localhost/api/test", { method: "POST" })
    await expect(readJsonBody(request)).resolves.toEqual({ ok: false })
  })
})
