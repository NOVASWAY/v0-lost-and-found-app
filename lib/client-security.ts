"use client"

/**
 * Client-side security utilities
 * These functions sanitize and validate user input to prevent XSS, injection attacks, and other security vulnerabilities
 */

/**
 * Sanitizes a string to prevent XSS attacks
 * Removes HTML tags, script tags, and dangerous characters
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") {
    return ""
  }

  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    // Remove javascript: protocol
    .replace(/javascript:/gi, "")
    // Remove data: protocol (except data:image for images)
    .replace(/data:(?!image\/)/gi, "")
    // Remove vbscript: protocol
    .replace(/vbscript:/gi, "")
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    // Remove object/embed tags
    .replace(/<(object|embed)[^>]*>.*?<\/\1>/gi, "")
    // Remove dangerous attributes
    .replace(/\s*(on\w+|href|src|action|formaction|style)\s*=\s*["'][^"']*["']/gi, "")
    // Limit length to prevent DoS
    .substring(0, 10000)
}

/**
 * Sanitizes text content for display (allows some safe formatting)
 */
export function sanitizeTextContent(input: string): string {
  if (!input || typeof input !== "string") {
    return ""
  }

  return input
    .trim()
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    // Remove javascript: protocol
    .replace(/javascript:/gi, "")
    // Remove dangerous protocols
    .replace(/(javascript|vbscript|data|file):/gi, "")
    // Limit length
    .substring(0, 50000)
}

/**
 * Validates and sanitizes a URL
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return ""
  }

  const trimmed = url.trim()

  // Allow data:image URLs for base64 images
  if (trimmed.startsWith("data:image/")) {
    // Validate base64 data URL format
    if (/^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
      return trimmed
    }
    return ""
  }

  // Only allow http/https URLs
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return ""
  }

  // Remove dangerous characters
  return trimmed
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/file:/gi, "")
    .substring(0, 2048)
}

/**
 * Sanitizes search query input
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== "string") {
    return ""
  }

  return query
    .trim()
    // Remove HTML/script injection characters
    .replace(/[<>'"\\]/g, "")
    // Remove SQL/NoSQL injection characters
    .replace(/[;{}]/g, "")
    // Remove path traversal patterns
    .replace(/\.\./g, "")
    // Limit length
    .substring(0, 200)
}

/**
 * Validates and sanitizes an ID parameter
 */
export function sanitizeId(id: string): string {
  if (!id || typeof id !== "string") {
    return ""
  }

  // Only allow alphanumeric, hyphens, and underscores
  const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, "")

  // Limit length
  return sanitized.substring(0, 100)
}

/**
 * Validates email format (basic validation)
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return ""
  }

  const trimmed = email.trim().toLowerCase()

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return ""
  }

  // Remove dangerous characters
  return trimmed.replace(/[<>'"\\]/g, "").substring(0, 255)
}

/**
 * Sanitizes a date string
 */
export function sanitizeDate(dateString: string): string {
  if (!dateString || typeof dateString !== "string") {
    return ""
  }

  // Only allow ISO date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    return ""
  }

  // Validate it's a real date
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return ""
  }

  return dateString
}

/**
 * Sanitizes an array of strings
 */
export function sanitizeStringArray(arr: string[]): string[] {
  if (!Array.isArray(arr)) {
    return []
  }

  return arr
    .filter((item) => typeof item === "string")
    .map((item) => sanitizeInput(item))
    .filter((item) => item.length > 0)
    .slice(0, 100) // Limit array size
}

/**
 * Validates that a string doesn't contain path traversal patterns
 */
export function isPathTraversalSafe(input: string): boolean {
  if (!input || typeof input !== "string") {
    return false
  }

  const dangerousPatterns = [
    /\.\./, // Parent directory
    /\.\.\\/, // Windows parent directory
    /%2E%2E/, // URL encoded
    /%252E/, // Double URL encoded
    /^\/|^[A-Z]:\\/, // Absolute paths
    /file:\/\//, // File protocol
  ]

  return !dangerousPatterns.some((pattern) => pattern.test(input))
}

/**
 * Escapes HTML special characters for safe display
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== "string") {
    return ""
  }

  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }

  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Validates JSON string before parsing
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    if (!jsonString || typeof jsonString !== "string") {
      return fallback
    }

    // Check for dangerous patterns before parsing
    if (/<script|javascript:|on\w+\s*=/i.test(jsonString)) {
      return fallback
    }

    const parsed = JSON.parse(jsonString)
    return parsed as T
  } catch {
    return fallback
  }
}
