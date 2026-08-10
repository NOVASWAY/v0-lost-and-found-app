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
} from "../../lib/security"

function makeRequest(headers: Record<string, string>): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest
}

describe("assertSameOrigin (CSRF)", () => {
  it("allows requests without an Origin header (curl/server-to-server)", () => {
    expect(assertSameOrigin(makeRequest({ host: "vault.example.com" }))).toBe(true)
  })

  it("allows matching origin + host", () => {
    expect(assertSameOrigin(makeRequest({ origin: "https://vault.example.com", host: "vault.example.com" }))).toBe(true)
  })

  it("rejects a cross-site origin", () => {
    expect(assertSameOrigin(makeRequest({ origin: "https://evil.example.com", host: "vault.example.com" }))).toBe(false)
  })

  it("rejects when host is missing", () => {
    expect(assertSameOrigin(makeRequest({ origin: "https://vault.example.com" }))).toBe(false)
  })

  it("rejects non-http(s) origins", () => {
    expect(assertSameOrigin(makeRequest({ origin: "ftp://vault.example.com", host: "vault.example.com" }))).toBe(false)
  })

  it("rejects an unparseable origin", () => {
    expect(assertSameOrigin(makeRequest({ origin: "not a url", host: "vault.example.com" }))).toBe(false)
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

  it("accepts valid base64 data URLs for images", () => {
    expect(validateUrl("data:image/png;base64,iVBORw0KGgo=").valid).toBe(true)
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
