import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/db"

// GET all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { username: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        itemsUploaded: true,
        claimsSubmitted: true,
        joinedAt: true,
        vaultPoints: true,
        rank: true,
        attendanceCount: true,
        serviceCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const { name, username, password, role } = await request.json()

    if (!name || !username || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        itemsUploaded: true,
        claimsSubmitted: true,
        joinedAt: true,
        vaultPoints: true,
        rank: true,
        attendanceCount: true,
        serviceCount: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Add audit log
    await prisma.auditLog.create({
      data: {
        type: "user_created",
        action: "User account created",
        details: `User '${username}' created with role '${role}'`,
        severity: "info",
        userId: user.id,
      },
    })

    return NextResponse.json({ user, message: "User created successfully" })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

