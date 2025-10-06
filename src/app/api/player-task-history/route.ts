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
