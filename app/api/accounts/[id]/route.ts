import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const account = await prisma.account.findUnique({
      where: { id: params.id },
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
  try {
    const body = await req.json()
    const { name, initialBalance, currency, profitTarget, maxDrawdown, dailyLossLimit, accountType, status } = body

    const account = await prisma.account.update({
      where: { id: params.id },
      data: {
        name,
        initialBalance,
        currency,
        profitTarget,
        maxDrawdown,
        dailyLossLimit,
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
  try {
    await prisma.account.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Account deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
