import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createClient } from '@/lib/supabase-server'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const account = await prisma.account.findUnique({
      where: {
        id: params.id,
        userId: user.id // أمان: التأكد من الملكية
      },
      include: {
        _count: {
          select: { trades: true }
        }
      }
    })

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { name, initialBalance, currency, profitTarget, maxDrawdown, dailyLossLimit, accountType, status } = body

    const account = await prisma.account.update({
      where: {
        id: params.id,
        userId: user.id // أمان: التأكد من الملكية
      },
      data: {
        name,
        initialBalance: parseFloat(initialBalance),
        currency,
        profitTarget: parseFloat(profitTarget) || null,
        maxDrawdown: parseFloat(maxDrawdown) || null,
        dailyLossLimit: parseFloat(dailyLossLimit) || null,
        accountType,
        status,
      }
    })

    return NextResponse.json(account)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    await prisma.account.delete({
      where: {
        id: params.id,
        userId: user.id // أمان: التأكد من الملكية
      }
    })

    return NextResponse.json({ message: "Account deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
