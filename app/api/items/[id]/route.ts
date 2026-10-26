import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { assertSameOrigin, readJsonBody, validateRouteId } from "@/lib/security"
import { requireAuth } from "@/lib/auth-middleware"
import { requireAdmin } from "@/lib/auth-middleware"
import { updateItemSchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { safePrivateBlobDisplayUrl } from "@/lib/private-blob"

class ItemUpdateError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

// GET item by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require authentication: item details (and claims) contain personal data.
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id } = await params
    
    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }

    const isStaff = authResult.user.role === "admin" || authResult.user.role === "volunteer"

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          // Public responses never expose uploader PII; only staff see name/username.
          select: isStaff
            ? { id: true, name: true, username: true }
            : { id: true },
        },
        claims: {
          where: isStaff ? undefined : { claimantId: authResult.user.id },
          include: isStaff
            ? {
                claimant: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              }
            : undefined,
          ...(isStaff ? {} : { select: { id: true, itemName: true, status: true, claimedAt: true } }),
          orderBy: { claimedAt: "desc" },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const visibleClaims = isStaff
      ? item.claims.map((claim) => ({
          ...claim,
          claimantEmail: undefined,
          proofImage: safePrivateBlobDisplayUrl(claim.proofImage),
          itemImage: safePrivateBlobDisplayUrl(claim.itemImage),
        }))
      : item.claims
    const visibleItem = isStaff ? item : { ...item, uniqueMarkings: undefined }

    return NextResponse.json(
      {
        item: {
          ...visibleItem,
          imageUrl: safePrivateBlobDisplayUrl(item.imageUrl),
          claims: visibleClaims,
        },
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  } catch (error) {
    console.error("Get item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH update item
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!assertSameOrigin(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const { id } = await params
    
    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }
    
    const jsonBody = await readJsonBody(request)
    if (!jsonBody.ok) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const validation = validateAndSanitize(updateItemSchema, jsonBody.data)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { description, status } = validation.data
    const isAdmin = authResult.user.role === "admin"
    if (!isAdmin && status !== undefined) {
      return NextResponse.json({ error: "Only admins may change item status" }, { status: 403 })
    }
    if (status !== undefined && status !== "donated" && status !== "expired") {
      return NextResponse.json({ error: "Item status must be changed through the claim workflow" }, { status: 400 })
    }

    const item = await prisma.$transaction(async (tx) => {
      const currentItem = await tx.item.findUnique({ where: { id } })
      if (!currentItem) throw new ItemUpdateError("Item not found", 404)
      if (!isAdmin && currentItem.uploadedById !== authResult.user.id) {
        throw new ItemUpdateError("Forbidden - Insufficient permissions", 403)
      }

      if (status !== undefined) {
        if (currentItem.status !== "available") {
          throw new ItemUpdateError("Only available items may be marked donated or expired", 409)
        }
        const activeClaim = await tx.claim.findFirst({
          where: { itemId: id, status: { in: ["pending", "approved"] } },
          select: { id: true },
        })
        if (activeClaim) {
          throw new ItemUpdateError("Resolve active claims before changing item status", 409)
        }
      }

      const updateData: Prisma.ItemUpdateManyMutationInput = {}
      if (description !== undefined) updateData.description = description
      if (status !== undefined) updateData.status = status

      const updateResult = await tx.item.updateMany({
        where: { id, status: currentItem.status },
        data: updateData,
      })
      if (updateResult.count !== 1) {
        throw new ItemUpdateError("Item changed before the update could be applied", 409)
      }

      const updatedItem = await tx.item.findUnique({
        where: { id },
        include: {
          uploadedBy: {
            select: isAdmin || authResult.user.role === "volunteer"
              ? { id: true, name: true, username: true }
              : { id: true },
          },
        },
      })
      if (!updatedItem) throw new ItemUpdateError("Item not found", 404)

      if (status !== undefined) {
        await tx.auditLog.create({
          data: {
            type: "item_status_changed",
            action: "Item status changed",
            details: `Item '${updatedItem.category}' marked ${status}`,
            severity: "warning",
            userId: authResult.user.id,
          },
        })
      }

      return updatedItem
    })

    const itemWithoutMarkings = authResult.user.role === "user" ? { ...item, uniqueMarkings: undefined } : item
    const visibleItem = {
      ...itemWithoutMarkings,
      imageUrl: safePrivateBlobDisplayUrl(item.imageUrl),
    }

    return NextResponse.json(
      { item: visibleItem, message: "Item updated successfully" },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  } catch (error) {
    if (error instanceof ItemUpdateError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Update item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE item
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!assertSameOrigin(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const { id } = await params
    
    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }
    const existingItem = await prisma.item.findUnique({ where: { id } })
    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Claims reference the item with ON DELETE RESTRICT, so deleting an item
    // that has claims would fail at the database level. Surface it as a 409
    // instead of an unhandled 500.
    const claimCount = await prisma.claim.count({ where: { itemId: id } })
    if (claimCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete item: ${claimCount} claim${claimCount !== 1 ? "s" : ""} reference it. Resolve or reject the claims first.`,
        },
        { status: 409 },
      )
    }

    await prisma.item.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Item deleted successfully" })
  } catch (error) {
    console.error("Delete item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
