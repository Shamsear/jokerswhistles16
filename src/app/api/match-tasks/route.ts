import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST - Assign a task to a player for a match
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { matchId, taskId, playerId, playerType, cardNumber, pickedBy } = body

    if (!matchId || !taskId || !playerId || !playerType) {
      return NextResponse.json({ 
        error: 'Match ID, Task ID, Player ID, and Player Type are required' 
      }, { status: 400 })
    }

    // Check if task already assigned for this match and player
    const existingAssignment = await prisma.matchTask.findFirst({
      where: {
        matchId: matchId,
        playerId: playerId
      }
    })

    if (existingAssignment) {
      return NextResponse.json({ 
        success: true,
        matchTask: existingAssignment,
        message: 'Task already assigned'
      })
    }

    // Create the task assignment
    const matchTask = await prisma.matchTask.create({
      data: {
        matchId: matchId,
        taskId: taskId,
        playerId: playerId,
        playerType: playerType,
        cardNumber: cardNumber || null
      }
    })

    return NextResponse.json({ 
      success: true,
      matchTask: matchTask
    })
  } catch (error) {
    console.error('Error assigning task:', error)
    return NextResponse.json({ error: 'Failed to assign task' }, { status: 500 })
  }
}

// GET - Fetch task assignments for a match
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
    }

    const matchTasks = await prisma.matchTask.findMany({
      where: {
        matchId: matchId
      },
      include: {
        task: true
      }
    })

    return NextResponse.json({ matchTasks })
  } catch (error) {
    console.error('Error fetching match tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch match tasks' }, { status: 500 })
  }
}

// DELETE - Remove all task assignments for a match (admin reset)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 })
    }

    // Delete all match tasks for this match
    await prisma.matchTask.deleteMany({
      where: {
        matchId: matchId
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Match tasks reset successfully'
    })
  } catch (error) {
    console.error('Error deleting match tasks:', error)
    return NextResponse.json({ error: 'Failed to delete match tasks' }, { status: 500 })
  }
}
