import { describe, expect, it } from "vitest"

import {
  loginSchema,
  createUserSchema,
  changePasswordSchema,
  createItemSchema,
  updateItemSchema,
  createClaimSchema,
  updateClaimSchema,
  createLocationSchema,
  createPlaybookSchema,
  createServiceRecordSchema,
  validateAndSanitize,
  sanitizeString,
} from "../../lib/validation"

const STRONG_PASSWORD = "Str0ng!Passw0rd"

describe("auth schemas", () => {
  it("accepts a valid login", () => {
    const r = loginSchema.safeParse({ username: "  alice  ", password: "x" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.username).toBe("alice")
  })

  it("rejects a too-short username", () => {
    expect(loginSchema.safeParse({ username: "ab", password: "x" }).success).toBe(false)
  })

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ username: "alice", password: "" }).success).toBe(false)
  })

  it("rejects a weak new password and accepts a strong one", () => {
    const weak = changePasswordSchema.safeParse({ currentPassword: "x", newPassword: "short" })
    expect(weak.success).toBe(false)
    const strong = changePasswordSchema.safeParse({ currentPassword: "x", newPassword: STRONG_PASSWORD })
    expect(strong.success).toBe(true)
  })

  it("enforces username charset and role enum on user creation", () => {
    const badChars = createUserSchema.safeParse({ name: "Ana", username: "bad-name!", password: STRONG_PASSWORD, role: "admin" })
    expect(badChars.success).toBe(false)
    const badRole = createUserSchema.safeParse({ name: "Ana", username: "okname", password: STRONG_PASSWORD, role: "superadmin" })
    expect(badRole.success).toBe(false)
    const ok = createUserSchema.safeParse({ name: "Ana", username: "okname", password: STRONG_PASSWORD, role: "admin" })
    expect(ok.success).toBe(true)
  })
})

describe("item schema", () => {
  const baseItem = {
    imageUrl: "https://example.com/photo.jpg",
    category: "wallet",
    location: "Sanctuary",
    dateFounded: "2026-08-01T12:00:00.000Z",
  }

  it("accepts a valid item", () => {
    expect(createItemSchema.safeParse(baseItem).success).toBe(true)
  })

  it("rejects path traversal in imageUrl", () => {
    for (const url of [
      "https://example.com/../../etc/passwd",
      "file:///etc/passwd",
      "/etc/passwd",
      "C:\\Windows\\system32",
    ]) {
      expect(createItemSchema.safeParse({ ...baseItem, imageUrl: url }).success).toBe(false)
    }
  })

  it("rejects a non-URL imageUrl", () => {
    expect(createItemSchema.safeParse({ ...baseItem, imageUrl: "not a url" }).success).toBe(false)
  })

  it("accepts a base64 image data URL and rejects a non-image one", () => {
    expect(createItemSchema.safeParse({ ...baseItem, imageUrl: "data:image/png;base64,iVBORw0KGgo=" }).success).toBe(true)
    expect(createItemSchema.safeParse({ ...baseItem, imageUrl: "data:text/html;base64,PHNjcmlwdD4=" }).success).toBe(false)
  })

  it("rejects path traversal in category/location", () => {
    expect(createItemSchema.safeParse({ ...baseItem, category: "../etc" }).success).toBe(false)
    expect(createItemSchema.safeParse({ ...baseItem, location: "..\\secret" }).success).toBe(false)
  })

  it("rejects an invalid dateFounded", () => {
    expect(createItemSchema.safeParse({ ...baseItem, dateFounded: "yesterday" }).success).toBe(false)
  })

  it("only allows known statuses on update", () => {
    expect(updateItemSchema.safeParse({ status: "claimed" }).success).toBe(true)
    expect(updateItemSchema.safeParse({ status: "hacked" }).success).toBe(false)
  })
})

describe("claim schema", () => {
  it("accepts cuid and uuid item IDs", () => {
    const body = {
      itemId: "c123456789012345678901234",
      proofImage: "https://example.com/proof.png",
      claimantId: "123e4567-e89b-12d3-a456-426614174000",
    }
    expect(createClaimSchema.safeParse(body).success).toBe(true)
  })

  it("rejects malformed item/claimant IDs", () => {
    const body = {
      itemId: "not-an-id",
      proofImage: "https://example.com/proof.png",
      claimantId: "c123456789012345678901234",
    }
    expect(createClaimSchema.safeParse(body).success).toBe(false)
  })

  it("rejects a file:// proof image", () => {
    const body = {
      itemId: "c123456789012345678901234",
      proofImage: "file:///etc/shadow",
      claimantId: "c123456789012345678901234",
    }
    expect(createClaimSchema.safeParse(body).success).toBe(false)
  })

  it("only allows known claim statuses", () => {
    expect(updateClaimSchema.safeParse({ status: "released" }).success).toBe(true)
    expect(updateClaimSchema.safeParse({ status: "cancelled" }).success).toBe(false)
  })
})

describe("misc schemas", () => {
  it("accepts a valid location", () => {
    expect(createLocationSchema.safeParse({ name: "West Wing" }).success).toBe(true)
    expect(createLocationSchema.safeParse({ name: "" }).success).toBe(false)
  })

  it("accepts a valid playbook", () => {
    expect(createPlaybookSchema.safeParse({ title: "Lost Child", scenario: "Child separated", protocol: "Notify head usher" }).success).toBe(true)
    expect(createPlaybookSchema.safeParse({ title: "", scenario: "x", protocol: "y" }).success).toBe(false)
  })

  it("requires a valid service date", () => {
    expect(createServiceRecordSchema.safeParse({ userId: "u1", serviceDate: "2026-08-01T10:00:00.000Z" }).success).toBe(true)
    expect(createServiceRecordSchema.safeParse({ userId: "u1", serviceDate: "sunday" }).success).toBe(false)
  })
})

describe("validateAndSanitize", () => {
  it("returns typed data on success", () => {
    const r = validateAndSanitize(loginSchema, { username: " alice ", password: "pw" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.username).toBe("alice")
  })

  it("returns a flattened error string on failure", () => {
    const r = validateAndSanitize(loginSchema, { username: "ab", password: "" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toContain("username")
  })
})

describe("sanitizeString", () => {
  it("strips HTML, event handlers, and javascript: protocol", () => {
    const clean = sanitizeString("<script>alert(1)</script> onerror=alert javascript:alert(1) hello")
    expect(clean).not.toContain("<")
    expect(clean).not.toContain(">")
    expect(clean).not.toContain("onerror=")
    expect(clean).not.toContain("javascript:")
    expect(clean).toContain("hello")
  })
})
