import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// PATCH update playbook
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { title, scenario, protocol, priority, userId } = await request.json()

    const playbook = await prisma.playbook.findUnique({
      where: { id: params.id },
    })

    if (!playbook) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 })
    }

    const updatedPlaybook = await prisma.playbook.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(scenario && { scenario }),
        ...(protocol && { protocol }),
        ...(priority && { priority }),
      },
    })

    // Add audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          type: "playbook_updated",
          action: "Playbook updated",
          details: `Playbook '${playbook.title}' updated`,
          severity: "info",
          userId,
        },
      })
    }

    return NextResponse.json({ playbook: updatedPlaybook, message: "Playbook updated successfully" })
  } catch (error) {
    console.error("Update playbook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE playbook
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    const playbook = await prisma.playbook.findUnique({
      where: { id: params.id },
    })

    if (!playbook) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 })
    }

    await prisma.playbook.delete({
      where: { id: params.id },
    })

    // Add audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          type: "playbook_deleted",
          action: "Playbook deleted",
          details: `Playbook '${playbook.title}' deleted`,
          severity: "warning",
          userId,
        },
      })
    }

    return NextResponse.json({ message: "Playbook deleted successfully" })
  } catch (error) {
    console.error("Delete playbook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

