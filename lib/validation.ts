import { z } from "zod"

// User validation schemas
export const loginSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  password: z.string().min(1),
})

export const passwordStrengthSchema = z.string()
  .min(12, "Password must be at least 12 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character")

export const createUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: passwordStrengthSchema,
  role: z.enum(["user", "volunteer", "admin"]),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  role: z.enum(["user", "volunteer", "admin"]).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordStrengthSchema,
})

// Item validation schemas
export const createItemSchema = z.object({
  imageUrl: z
    .string()
    .max(5000)
    .refine(
      (url) => {
        if (url.startsWith("data:")) {
          // Base64-encoded client-side images (png/jpeg/gif/webp).
          return /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(url)
        }
        // Otherwise must be an http(s) URL without path traversal.
        return (
          /^https?:\/\//i.test(url) &&
          !url.includes("..") &&
          !url.startsWith("file://") &&
          !/^\/|^[A-Za-z]:\\/.test(url)
        )
      },
      { message: "Invalid image URL format" }
    ),
  category: z.string().min(1).max(100).trim().refine((val) => !val.includes(".."), {
    message: "Category contains invalid characters",
  }),
  color: z.string().max(50).trim().refine((val) => !val || !val.includes(".."), {
    message: "Color contains invalid characters",
  }).optional(),
  location: z.string().min(1).max(200).trim().refine((val) => !val.includes(".."), {
    message: "Location contains invalid characters",
  }),
  dateFounded: z.string().datetime(),
  description: z.string().max(1000).trim().refine((val) => !val || !val.includes(".."), {
    message: "Description contains invalid characters",
  }).optional(),
  uniqueMarkings: z.string().max(500).trim().refine((val) => !val || !val.includes(".."), {
    message: "Unique markings contains invalid characters",
  }).optional(),
})

export const updateItemSchema = z.object({
  status: z.enum(["available", "claimed", "released", "donated"]).optional(),
  description: z.string().max(1000).trim().optional(),
})

// Claim validation schemas
export const createClaimSchema = z.object({
  itemId: z
    .string()
    .min(1)
    .refine((val) => /^c[a-z0-9]{24}$/i.test(val) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val), {
      message: "Invalid item ID format",
    }),
  proofImage: z
    .string()
    .max(5000)
    .refine(
      (url) => {
        if (url.startsWith("data:")) {
          return /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(url)
        }
        return (
          /^https?:\/\//i.test(url) &&
          !url.includes("..") &&
          !url.startsWith("file://") &&
          !/^\/|^[A-Za-z]:\\/.test(url)
        )
      },
      { message: "Invalid proof image URL format" }
    ),
  claimantId: z
    .string()
    .min(1)
    .refine((val) => /^c[a-z0-9]{24}$/i.test(val) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val), {
      message: "Invalid claimant ID format",
    }),
  notes: z.string().max(500).trim().refine((val) => !val || !val.includes(".."), {
    message: "Notes contains invalid characters",
  }).optional(),
})

export const updateClaimSchema = z.object({
  status: z.enum(["pending", "released", "rejected"]).optional(),
  releaseNotes: z.string().max(500).trim().optional(),
  releasedBy: z.string().max(100).trim().optional(),
  volunteerId: z.string().min(1).optional(),
})

// Order validation schemas
export const updateOrderSchema = z.object({
  status: z.enum(["read"]),
})

// Mission validation schemas
const missionPriority = z.enum(["low", "medium", "high", "critical"])
const missionStatus = z.enum(["pending", "in_progress", "completed", "cancelled"])

export const createMissionSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().default(""),
  instructions: z.string().max(5000).trim().default(""),
  priority: missionPriority.default("medium"),
  status: missionStatus.default("pending"),
  dueDate: z.string().max(20).trim().optional().nullable(),
  location: z.string().max(200).trim().optional().nullable(),
  assignedTo: z.string().min(1),
})

export const updateMissionSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).trim().optional(),
  instructions: z.string().max(5000).trim().optional(),
  priority: missionPriority.optional(),
  status: missionStatus.optional(),
  dueDate: z.string().max(20).trim().optional().nullable(),
  location: z.string().max(200).trim().optional().nullable(),
  completionNotes: z.string().max(1000).trim().optional(),
  assignedTo: z.string().min(1).optional(),
})

// Meeting minutes validation schemas
const actionItemSchema = z.object({
  item: z.string().min(1).max(500).trim(),
  assignedTo: z.string().min(1).max(200).trim(),
  dueDate: z.string().max(20).trim().optional().nullable(),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
})

const stringArraySchema = z.array(z.string().min(1).max(500).trim()).max(200)

export const createMeetingMinutesSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  meetingDate: z.string().min(1).max(20).trim(),
  location: z.string().max(200).trim().optional().nullable(),
  attendees: stringArraySchema.default([]),
  agenda: stringArraySchema.default([]),
  discussion: z.string().max(10000).trim().default(""),
  actionItems: z.array(actionItemSchema).max(200).default([]),
  decisions: stringArraySchema.default([]),
  nextMeetingDate: z.string().max(20).trim().optional().nullable(),
})

export const updateMeetingMinutesSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  meetingDate: z.string().min(1).max(20).trim().optional(),
  location: z.string().max(200).trim().optional().nullable(),
  attendees: stringArraySchema.optional(),
  agenda: stringArraySchema.optional(),
  discussion: z.string().max(10000).trim().optional(),
  actionItems: z.array(actionItemSchema).max(200).optional(),
  decisions: stringArraySchema.optional(),
  nextMeetingDate: z.string().max(20).trim().optional().nullable(),
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
