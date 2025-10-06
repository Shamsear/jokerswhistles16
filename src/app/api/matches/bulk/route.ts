import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/matches/bulk - Create multiple matches at once
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tournamentId, matches } = body

    if (!tournamentId || !matches || !Array.isArray(matches)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Prepare all match data
    const matchData = matches.map((m: any) => ({
      tournamentId,
      homePlayerId: m.homePlayerId,
      awayPlayerId: m.awayPlayerId,
      round: parseInt(m.round),
      pool: m.pool || null,
      status: 'pending'
    }))

    // Use createMany for bulk insert
    const result = await prisma.match.createMany({
      data: matchData,
      skipDuplicates: true // Skip any duplicates that might exist
    })

    return NextResponse.json({ 
      created: result.count,
      message: `Successfully created ${result.count} matches`
    }, { status: 201 })
  } catch (error) {
    console.error('Bulk create error:', error)
    return NextResponse.json({ 
      error: 'Failed to create matches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
