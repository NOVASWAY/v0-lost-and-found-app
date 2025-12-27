import { z } from "zod"

// User validation schemas
export const loginSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  password: z.string().min(1),
})

export const createUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6).max(100),
  role: z.enum(["user", "volunteer", "admin"]),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  role: z.enum(["user", "volunteer", "admin"]).optional(),
})

export const changePasswordSchema = z.object({
  userId: z.string().min(1),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
})

// Item validation schemas
export const createItemSchema = z.object({
  imageUrl: z.string().url().max(5000),
  category: z.string().min(1).max(100).trim(),
  color: z.string().max(50).trim().optional(),
  location: z.string().min(1).max(200).trim(),
  dateFounded: z.string().datetime(),
  description: z.string().max(1000).trim().optional(),
  uniqueMarkings: z.string().max(500).trim().optional(),
  uploadedById: z.string().min(1),
})

export const updateItemSchema = z.object({
  status: z.enum(["available", "claimed", "released", "donated"]).optional(),
  description: z.string().max(1000).trim().optional(),
})

// Claim validation schemas
export const createClaimSchema = z.object({
  itemId: z.string().min(1),
  proofImage: z.string().url().max(5000),
  claimantId: z.string().min(1),
  notes: z.string().max(500).trim().optional(),
})

export const updateClaimSchema = z.object({
  status: z.enum(["pending", "released", "rejected"]).optional(),
  releaseNotes: z.string().max(500).trim().optional(),
  releasedBy: z.string().max(100).trim().optional(),
  volunteerId: z.string().min(1).optional(),
})

// Location validation schemas
export const createLocationSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(500).trim().optional(),
  userId: z.string().min(1).optional(),
})

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(500).trim().optional().nullable(),
  userId: z.string().min(1).optional(),
})

// Playbook validation schemas
export const createPlaybookSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  scenario: z.string().min(1).max(1000).trim(),
  protocol: z.string().min(1).max(2000).trim(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  userId: z.string().min(1).optional(),
})

export const updatePlaybookSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  scenario: z.string().min(1).max(1000).trim().optional(),
  protocol: z.string().min(1).max(2000).trim().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  userId: z.string().min(1).optional(),
})

// Service record validation schemas
export const createServiceRecordSchema = z.object({
  userId: z.string().min(1),
  serviceDate: z.string().datetime(),
  attended: z.boolean().optional(),
  served: z.boolean().optional(),
  notes: z.string().max(500).trim().optional(),
  recordedBy: z.string().max(100).trim().optional(),
})

// Sanitization helper
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
}

// Validate and sanitize input
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ") }
    }
    return { success: false, error: "Validation failed" }
  }
}

