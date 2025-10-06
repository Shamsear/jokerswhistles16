import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/task-assignments - Get task assignments for a player or match
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const matchId = searchParams.get('matchId')
    const round = searchParams.get('round')

    if (!playerId && !matchId) {
      return NextResponse.json(
        { error: 'Either playerId or matchId is required' },
        { status: 400 }
      )
    }

    const whereClause: any = {}
    if (playerId) whereClause.playerId = playerId
    if (matchId) whereClause.matchId = matchId
    if (round) whereClause.round = parseInt(round)

    const assignments = await prisma.taskAssignment.findMany({
      where: whereClause,
      include: {
        task: true,
        player: true,
        match: {
          include: {
            homePlayer: true,
            awayPlayer: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching task assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch task assignments' }, { status: 500 })
  }
}

// POST /api/task-assignments - Create task assignment (after spin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerId, matchId, taskId, round } = body

    if (!playerId || !matchId || !taskId || round === undefined) {
      return NextResponse.json(
        { error: 'playerId, matchId, taskId, and round are required' },
        { status: 400 }
      )
    }

    // Check if player already has a task assignment for this match and round
    const existing = await prisma.taskAssignment.findUnique({
      where: {
        matchId_playerId_round: {
          matchId,
          playerId,
          round: parseInt(round)
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Player already has a task assignment for this match and round' },
        { status: 400 }
      )
    }

    // Verify match exists and includes this player
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homePlayer: true,
        awayPlayer: true
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.homePlayerId !== playerId && match.awayPlayerId !== playerId) {
      return NextResponse.json(
        { error: 'Player is not part of this match' },
        { status: 400 }
      )
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Create task assignment
    const assignment = await prisma.taskAssignment.create({
      data: {
        playerId,
        matchId,
        taskId,
        round: parseInt(round)
      },
      include: {
        task: true,
        player: true,
        match: {
          include: {
            homePlayer: true,
            awayPlayer: true
          }
        }
      }
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('Error creating task assignment:', error)
    return NextResponse.json({ error: 'Failed to create task assignment' }, { status: 500 })
  }
}

// GET /api/task-assignments/available - Get available tasks for a player (excludes already assigned)
export async function OPTIONS(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    const tournamentId = searchParams.get('tournamentId')

    if (!playerId || !tournamentId) {
      return NextResponse.json(
        { error: 'playerId and tournamentId are required' },
        { status: 400 }
      )
    }

    // Get all tasks for this tournament
    const allTasks = await prisma.task.findMany({
      where: {
        tournamentId,
        isActive: true
      }
    })

    // Get tasks already assigned to this player
    const assignedTasks = await prisma.taskAssignment.findMany({
      where: { playerId },
      include: { task: true }
    })

    const assignedTaskIds = assignedTasks.map(a => a.taskId)

    // Filter out already assigned tasks
    const availableTasks = allTasks.filter(task => !assignedTaskIds.includes(task.id))

    return NextResponse.json({ tasks: availableTasks })
  } catch (error) {
    console.error('Error fetching available tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch available tasks' }, { status: 500 })
  }
}