import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/matches/[id]/result - Submit match result
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { homeScore, awayScore, submittedBy } = body

    if (homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: 'Both homeScore and awayScore are required' },
        { status: 400 }
      )
    }

    if (homeScore < 0 || awayScore < 0) {
      return NextResponse.json(
        { error: 'Scores cannot be negative' },
        { status: 400 }
      )
    }

    // Get the match
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homePlayer: true,
        awayPlayer: true,
        tournament: true
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Verify tournament is in Phase 6
    if (match.tournament.phase < 6) {
      return NextResponse.json(
        { error: 'Cannot submit results until tournament is in Phase 6' },
        { status: 400 }
      )
    }

    // Verify submittedBy is one of the players (if provided)
    if (submittedBy) {
      if (submittedBy !== match.homePlayerId && submittedBy !== match.awayPlayerId) {
        return NextResponse.json(
          { error: 'Only players in this match can submit results' },
          { status: 403 }
        )
      }
    }

    // Update match with results
    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        status: 'completed'
      },
      include: {
        homePlayer: true,
        awayPlayer: true,
        matchTasks: {
          include: {
            task: true
          }
        }
      }
    })

    return NextResponse.json({ match: updatedMatch })
  } catch (error) {
    console.error('Error submitting match result:', error)
    return NextResponse.json({ error: 'Failed to submit match result' }, { status: 500 })
  }
}

// GET /api/matches/[id]/result - Get match result
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
        matchTasks: {
          include: {
            task: true
          }
        },
        tournament: true
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Error fetching match result:', error)
    return NextResponse.json({ error: 'Failed to fetch match result' }, { status: 500 })
  }
}