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
// OPTIMIZED: Single query for maximum speed
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { homePlayerId, awayPlayerId, homeScore, awayScore, status, absentStatus } = body

    // Prepare update data directly without fetching first
    const updateData: any = {}

    // Handle home/away assignment updates
    if (homePlayerId && awayPlayerId) {
      updateData.homePlayerId = homePlayerId
      updateData.awayPlayerId = awayPlayerId
    }

    // Handle absentStatus updates
    if (absentStatus !== undefined) {
      updateData.absentStatus = absentStatus
    }

    // Handle score updates - calculate winner on the fly
    if (homeScore !== undefined || awayScore !== undefined) {
      updateData.homeScore = homeScore !== undefined ? (homeScore === null ? null : parseInt(homeScore)) : undefined
      updateData.awayScore = awayScore !== undefined ? (awayScore === null ? null : parseInt(awayScore)) : undefined

      // If both scores are being set, determine winner
      if (homeScore !== undefined && awayScore !== undefined) {
        const home = homeScore === null ? null : parseInt(homeScore)
        const away = awayScore === null ? null : parseInt(awayScore)
        
        // NULL match (both absent)
        if (home === null && away === null) {
          updateData.winnerId = null
          updateData.status = 'completed'
        }
        // Normal match or WO
        else if (home !== null && away !== null) {
          // Winner will be calculated below
          if (!status) {
            updateData.status = 'completed'
          }
        } else {
          updateData.winnerId = null
          updateData.status = status || 'pending'
        }
      }
    }

    // Handle status updates
    if (status !== undefined) {
      updateData.status = status
      if (status === 'pending') {
        updateData.winnerId = null
      }
    }

    // Calculate winnerId if both scores provided
    if (homeScore !== undefined && awayScore !== undefined && homeScore !== null && awayScore !== null) {
      const home = parseInt(homeScore)
      const away = parseInt(awayScore)
      
      // Get player IDs from the match (need one quick query)
      const matchData = await prisma.match.findUnique({
        where: { id },
        select: { homePlayerId: true, awayPlayerId: true }
      })
      
      if (matchData) {
        updateData.winnerId = home > away
          ? matchData.homePlayerId
          : away > home
          ? matchData.awayPlayerId
          : null
      }
    }

    // OPTIMIZED: Single update query
    const match = await prisma.match.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        homeScore: true,
        awayScore: true,
        status: true,
        winnerId: true,
        absentStatus: true,
        round: true,
        pool: true,
        homePlayer: {
          select: {
            id: true,
            name: true
          }
        },
        awayPlayer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ match }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    })
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
