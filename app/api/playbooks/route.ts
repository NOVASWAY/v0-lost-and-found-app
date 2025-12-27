import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET all playbooks
export async function GET() {
  try {
    const playbooks = await prisma.playbook.findMany({
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ playbooks })
  } catch (error) {
    console.error("Get playbooks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create playbook
export async function POST(request: NextRequest) {
  try {
    const { title, scenario, protocol, priority, userId } = await request.json()

    if (!title || !scenario || !protocol) {
      return NextResponse.json({ error: "Title, scenario, and protocol are required" }, { status: 400 })
    }

    const playbook = await prisma.playbook.create({
      data: {
        title,
        scenario,
        protocol,
        priority: priority || "medium",
      },
    })

    // Add audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          type: "playbook_created",
          action: "Playbook created",
          details: `Playbook '${title}' created`,
          severity: "info",
          userId,
        },
      })
    }

    return NextResponse.json({ playbook, message: "Playbook created successfully" })
  } catch (error) {
    console.error("Create playbook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

