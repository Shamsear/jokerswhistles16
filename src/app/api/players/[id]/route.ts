import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PATCH /api/players/[id] - Update player
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, pool } = body

    const player = await prisma.player.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(pool !== undefined && { pool })
      }
    })

    return NextResponse.json({ player })
  } catch (error) {
    console.error('Error updating player:', error)
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 })
  }
}

// GET /api/players/[id] - Get specific player
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        tournament: true,
        homeMatches: true,
        awayMatches: true
      }
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    return NextResponse.json({ player })
  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 })
  }
}
