import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/matches/[id] - Get a single match by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homePlayer: true,
        awayPlayer: true,
        tournament: true,
        matchTasks: {
          include: {
            task: true
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Format the response to match what the player page expects
    const formattedMatch = {
      id: match.id,
      homePlayerId: match.homePlayerId,
      homePlayerName: match.homePlayer.name,
      awayPlayerId: match.awayPlayerId,
      awayPlayerName: match.awayPlayer.name,
      round: match.round,
      pool: match.pool,
      tournamentId: match.tournamentId
    }

    return NextResponse.json({ match: formattedMatch })
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch match',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PATCH /api/matches/[id] - Update match (home/away assignment or scores)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { homePlayerId, awayPlayerId, homeScore, awayScore, status } = body

    // Get the existing match
    const existingMatch = await prisma.match.findUnique({
      where: { id }
    })

    if (!existingMatch) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    // Handle home/away assignment updates
    if (homePlayerId && awayPlayerId) {
      updateData.homePlayerId = homePlayerId
      updateData.awayPlayerId = awayPlayerId
    }

    // Handle score updates
    if (homeScore !== undefined || awayScore !== undefined) {
      const finalHomeScore = homeScore !== undefined ? parseInt(homeScore) : existingMatch.homeScore
      const finalAwayScore = awayScore !== undefined ? parseInt(awayScore) : existingMatch.awayScore

      updateData.homeScore = finalHomeScore
      updateData.awayScore = finalAwayScore

      // Determine winner if both scores are available
      if (finalHomeScore !== null && finalAwayScore !== null) {
        if (finalHomeScore > finalAwayScore) {
          updateData.winnerId = existingMatch.homePlayerId
        } else if (finalAwayScore > finalHomeScore) {
          updateData.winnerId = existingMatch.awayPlayerId
        } else {
          updateData.winnerId = null // Draw
        }
        
        // Mark as completed if scores are entered
        if (!status) {
          updateData.status = 'completed'
        }
      }
    }

    // Handle status updates
    if (status) {
      updateData.status = status
    }

    const match = await prisma.match.update({
      where: { id },
      data: updateData,
      include: {
        homePlayer: true,
        awayPlayer: true,
        taskAssignments: {
          include: {
            task: true,
            player: true
          }
        }
      }
    })

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update match',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/matches/[id] - Delete a specific match
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.match.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Match deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting match:', error)
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    )
  }
}
