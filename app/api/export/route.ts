import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        accounts: {
          include: {
            trades: {
              include: {
                tags: { include: { tag: true } },
                mistakes: true,
                strategy: true,
                images: true,
              }
            },
            snapshots: true,
          }
        },
        strategies: true,
        mistakes: true,
        tags: true,
        journalEntries: true,
      }
    })

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const exportData = JSON.stringify(userData, null, 2)

    return new NextResponse(exportData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename=jornaling-export-${new Date().toISOString().split('T')[0]}.json`,
      },
    })
  } catch (error) {
    console.error("EXPORT_ERROR", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
