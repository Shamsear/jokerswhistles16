import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/players - Get all players (with optional tournament filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')

    const players = await prisma.player.findMany({
      where: tournamentId ? { tournamentId } : undefined,
      include: {
        tournament: true,
        homeMatches: {
          include: {
            awayPlayer: true,
            taskAssignments: {
              include: { task: true }
            }
          }
        },
        awayMatches: {
          include: {
            homePlayer: true,
            taskAssignments: {
              include: { task: true }
            }
          }
        },
        taskAssignments: {
          include: {
            task: true,
            match: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ players })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}

// POST /api/players - Register new player
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, tournamentId, registrationToken, isAdmin } = body

    if (!name || !tournamentId) {
      return NextResponse.json(
        { error: 'Name and tournament ID are required' }, 
        { status: 400 }
      )
    }

    // Check if tournament exists and is in registration phase
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.phase !== 1) {
      return NextResponse.json(
        { error: 'Tournament registration is closed' }, 
        { status: 400 }
      )
    }

    // Validate registration token if provided
    if (registrationToken) {
      const validToken = await prisma.registrationLink.findFirst({
        where: {
          token: registrationToken,
          tournamentId,
          isActive: true
        }
      })

      if (!validToken) {
        return NextResponse.json(
          { error: 'Invalid registration token' }, 
          { status: 400 }
        )
      }
    }

    // Check if player with same name already exists in this tournament
    const existingPlayer = await prisma.player.findFirst({
      where: {
        name: name.trim(),
        tournamentId
      }
    })

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Player with this name already exists' }, 
        { status: 400 }
      )
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.player.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          tournamentId
        }
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Player with this email already exists' }, 
          { status: 400 }
        )
      }
    }

    const player = await prisma.player.create({
      data: {
        name: name.trim(),
        email: email ? email.toLowerCase().trim() : null,
        tournamentId,
        isAdmin: isAdmin || false
      },
      include: {
        tournament: true
      }
    })

    return NextResponse.json({ player }, { status: 201 })
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json({ error: 'Failed to register player' }, { status: 500 })
  }
}