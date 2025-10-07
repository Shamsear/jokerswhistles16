import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch player's task history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }

    // Fetch all task assignments for this player
    const taskAssignments = await prisma.matchTask.findMany({
      where: {
        playerId: playerId
      },
      select: {
        taskId: true
      }
    })

    const taskIds = taskAssignments.map(ta => ta.taskId)

    return NextResponse.json({
      history: {
        playerId: playerId,
        taskIds: taskIds
      }
    })
  } catch (error) {
    console.error('Error fetching player task history:', error)
    return NextResponse.json({ error: 'Failed to fetch task history' }, { status: 500 })
  }
}

// POST - Add task to player's history
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { playerId, taskId } = body

    if (!playerId || !taskId) {
      return NextResponse.json({ error: 'Player ID and Task ID are required' }, { status: 400 })
    }

    // The task is already saved via match-tasks endpoint
    // This endpoint is just for confirmation/logging if needed
    
    return NextResponse.json({ 
      success: true,
      message: 'Task added to player history' 
    })
  } catch (error) {
    console.error('Error updating player task history:', error)
    return NextResponse.json({ error: 'Failed to update task history' }, { status: 500 })
  }
}

// DELETE - Reset task history for a player or all players in a tournament
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const tournamentId = searchParams.get('tournamentId')

    if (!playerId && !tournamentId) {
      return NextResponse.json({ 
        error: 'Either Player ID or Tournament ID is required' 
      }, { status: 400 })
    }

    let deletedCount = 0

    if (playerId) {
      // Reset task history for a specific player
      const result = await prisma.matchTask.deleteMany({
        where: {
          playerId: playerId
        }
      })
      deletedCount = result.count
    } else if (tournamentId) {
      // Reset task history for all players in a tournament
      // First, get all matches in the tournament
      const matches = await prisma.match.findMany({
        where: {
          tournamentId: tournamentId
        },
        select: {
          id: true
        }
      })

      const matchIds = matches.map(m => m.id)

      // Delete all match tasks for these matches
      const result = await prisma.matchTask.deleteMany({
        where: {
          matchId: {
            in: matchIds
          }
        }
      })
      deletedCount = result.count
    }

    return NextResponse.json({ 
      success: true,
      message: `Task history reset successfully. ${deletedCount} records deleted.`,
      deletedCount
    })
  } catch (error) {
    console.error('Error resetting task history:', error)
    return NextResponse.json({ error: 'Failed to reset task history' }, { status: 500 })
  }
}
