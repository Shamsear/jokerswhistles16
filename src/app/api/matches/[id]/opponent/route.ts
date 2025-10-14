import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PATCH - Update match opponent (away player)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { awayPlayerId } = await request.json()
    const matchId = params.id

    if (!awayPlayerId) {
      return NextResponse.json({ error: 'Away player ID is required' }, { status: 400 })
    }

    // Get the existing match
    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homePlayer: true,
        awayPlayer: true
      }
    })

    if (!existingMatch) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Prevent changing opponent if match is already completed
    if (existingMatch.status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot change opponent of a completed match. Reset the match first.' 
      }, { status: 400 })
    }

    // Get the new opponent
    const newOpponent = await prisma.player.findUnique({
      where: { id: awayPlayerId }
    })

    if (!newOpponent) {
      return NextResponse.json({ error: 'New opponent not found' }, { status: 404 })
    }

    // Check if players are in the same pool
    if (existingMatch.pool && newOpponent.pool !== existingMatch.pool) {
      return NextResponse.json({ 
        error: 'Players must be in the same pool' 
      }, { status: 400 })
    }

    // Check for duplicate matchup in the same stage
    if (existingMatch.knockoutStage) {
      const duplicateMatch = await prisma.match.findFirst({
        where: {
          id: { not: matchId },
          tournamentId: existingMatch.tournamentId,
          knockoutStage: existingMatch.knockoutStage,
          OR: [
            {
              homePlayerId: existingMatch.homePlayerId,
              awayPlayerId: awayPlayerId
            },
            {
              homePlayerId: awayPlayerId,
              awayPlayerId: existingMatch.homePlayerId
            }
          ]
        }
      })

      if (duplicateMatch) {
        return NextResponse.json({ 
          error: 'This matchup already exists in this knockout stage' 
        }, { status: 400 })
      }
    }

    // Update the match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        awayPlayerId: awayPlayerId
      },
      include: {
        homePlayer: true,
        awayPlayer: true
      }
    })

    return NextResponse.json({ 
      success: true,
      match: updatedMatch,
      message: `Opponent updated to ${updatedMatch.awayPlayer.name}`
    })

  } catch (error) {
    console.error('Error updating match opponent:', error)
    return NextResponse.json({ 
      error: 'Failed to update match opponent',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
