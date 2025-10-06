import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/tasks - Get all tasks for a tournament
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' }, 
        { status: 400 }
      )
    }

    const tasks = await prisma.task.findMany({
      where: { tournamentId },
      include: {
        tournament: true,
        taskAssignments: {
          include: {
            player: true,
            match: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, homeDescription, awayDescription, tournamentId } = body

    if (!name || !homeDescription || !awayDescription || !tournamentId) {
      return NextResponse.json(
        { error: 'Name, home description, away description, and tournament ID are required' }, 
        { status: 400 }
      )
    }

    // Check if tournament exists and is in task creation phase
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.phase < 2) {
      return NextResponse.json(
        { error: 'Tasks can only be created in Phase 2 or later' }, 
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        name: name.trim(),
        homeDescription: homeDescription.trim(),
        awayDescription: awayDescription.trim(),
        tournamentId,
        isActive: true
      },
      include: {
        tournament: true
      }
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

// PATCH /api/tasks - Update task
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    const { name, homeDescription, awayDescription } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' }, 
        { status: 400 }
      )
    }

    if (!name || !homeDescription || !awayDescription) {
      return NextResponse.json(
        { error: 'Name, home description, and away description are required' }, 
        { status: 400 }
      )
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        name: name.trim(),
        homeDescription: homeDescription.trim(),
        awayDescription: awayDescription.trim()
      },
      include: {
        tournament: true
      }
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE /api/tasks - Delete task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' }, 
        { status: 400 }
      )
    }

    await prisma.task.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
