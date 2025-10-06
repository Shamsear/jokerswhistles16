import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/matches - Create a new match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tournamentId, homePlayerId, awayPlayerId, round, pool } = body

    if (!tournamentId || !homePlayerId || !awayPlayerId || !round) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if match already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        tournamentId,
        OR: [
          { homePlayerId, awayPlayerId },
          { homePlayerId: awayPlayerId, awayPlayerId: homePlayerId }
        ]
      }
    })

    if (existingMatch) {
      return NextResponse.json(
        { error: 'Match between these players already exists' },
        { status: 400 }
      )
    }

    const match = await prisma.match.create({
      data: {
        tournamentId,
        homePlayerId,
        awayPlayerId,
        round: parseInt(round),
        pool: pool || null,
        status: 'pending'
      },
      include: {
        homePlayer: true,
        awayPlayer: true
      }
    })

    return NextResponse.json({ match }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to create match',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/matches - Get all matches (optionally filtered)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')
    const includeTaskAssignments = searchParams.get('includeTasks') === 'true'

    // Optimized query - only fetch what's needed
    const matches = await prisma.match.findMany({
      where: tournamentId ? { tournamentId } : undefined,
      select: {
        id: true,
        round: true,
        matchType: true,
        pool: true,
        homeScore: true,
        awayScore: true,
        status: true,
        winnerId: true,
        homePlayerId: true,
        awayPlayerId: true,
        homePlayer: {
          select: {
            id: true,
            name: true,
            pool: true
          }
        },
        awayPlayer: {
          select: {
            id: true,
            name: true,
            pool: true
          }
        },
        // Only include task assignments if requested
        ...(includeTaskAssignments && {
          taskAssignments: {
            select: {
              id: true,
              task: {
                select: {
                  id: true,
                  name: true,
                  homeDescription: true,
                  awayDescription: true
                }
              },
              player: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        })
      },
      orderBy: [
        { round: 'asc' },
        { pool: 'asc' }
      ]
    })

    // Add cache headers for better performance
    const headers = new Headers()
    headers.set('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=10')
    headers.set('Content-Type', 'application/json')

    return new NextResponse(JSON.stringify({ matches }), {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
  }
}

// DELETE /api/matches - Delete all matches for a tournament
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      )
    }

    const result = await prisma.match.deleteMany({
      where: { tournamentId }
    })

    return NextResponse.json({ 
      message: `Successfully deleted ${result.count} matches`,
      count: result.count
    })
  } catch (error) {
    console.error('Error deleting matches:', error)
    return NextResponse.json({ error: 'Failed to delete matches' }, { status: 500 })
  }
}
