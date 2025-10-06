import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateMatches } from '@/lib/utils'

// GET /api/tournaments/[id] - Get specific tournament
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: true,
        matches: {
          include: {
            homePlayer: true,
            awayPlayer: true,
            taskAssignments: {
              include: {
                task: {
                  select: {
                    id: true,
                    name: true,
                    homeDescription: true,
                    awayDescription: true,
                    isActive: true,
                    createdAt: true
                  }
                },
                player: true
              }
            }
          }
        },
        tasks: {
          select: {
            id: true,
            name: true,
            homeDescription: true,
            awayDescription: true,
            isActive: true,
            createdAt: true
          }
        },
        registrationLinks: true
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json({ error: 'Failed to fetch tournament' }, { status: 500 })
  }
}

// PATCH /api/tournaments/[id] - Update tournament (phase progression, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { phase, name, description } = body

    const currentTournament = await prisma.tournament.findUnique({
      where: { id },
      include: { players: true, matches: true }
    })

    if (!currentTournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Handle phase-specific logic
    if (phase !== undefined) {
      // Phase 2: Opponent draw is now done via interactive wheel
      // No automatic match generation

      // Validate phase progression
      if (phase < 1 || phase > 6) {
        return NextResponse.json({ error: 'Invalid phase number' }, { status: 400 })
      }

      if (phase > currentTournament.phase + 1) {
        return NextResponse.json({ 
          error: 'Cannot skip phases. Please progress one phase at a time' 
        }, { status: 400 })
      }
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        ...(phase !== undefined && { phase }),
        ...(name && { name }),
        ...(description !== undefined && { description })
      },
      include: {
        players: true,
        matches: {
          include: {
            homePlayer: true,
            awayPlayer: true
          }
        },
        tasks: {
          select: {
            id: true,
            name: true,
            homeDescription: true,
            awayDescription: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Error updating tournament:', error)
    return NextResponse.json({ error: 'Failed to update tournament' }, { status: 500 })
  }
}

// DELETE /api/tournaments/[id] - Delete tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.tournament.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Tournament deleted successfully' })
  } catch (error) {
    console.error('Error deleting tournament:', error)
    return NextResponse.json({ error: 'Failed to delete tournament' }, { status: 500 })
  }
}