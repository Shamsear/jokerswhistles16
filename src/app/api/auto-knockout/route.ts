import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Check if pool matches are complete and auto-generate Round of 16
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')
    
    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
    }

    // Check if Round of 16 already exists
    const existingKnockout = await prisma.match.findFirst({
      where: {
        tournamentId,
        knockoutStage: 'round_of_16'
      }
    })

    if (existingKnockout) {
      return NextResponse.json({ 
        ready: false,
        message: 'Round of 16 already generated',
        knockoutExists: true
      })
    }

    // Check if all pool matches are completed
    const poolMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        matchType: 'pool'
      }
    })

    if (poolMatches.length === 0) {
      return NextResponse.json({ 
        ready: false,
        message: 'No pool matches found'
      })
    }

    const allCompleted = poolMatches.every(m => m.status === 'completed')
    const completedCount = poolMatches.filter(m => m.status === 'completed').length

    if (!allCompleted) {
      return NextResponse.json({ 
        ready: false,
        message: `Pool matches still in progress (${completedCount}/${poolMatches.length} completed)`,
        progress: {
          completed: completedCount,
          total: poolMatches.length
        }
      })
    }

    // All pool matches are complete, ready to generate Round of 16
    return NextResponse.json({ 
      ready: true,
      message: 'All pool matches completed. Ready to generate Round of 16!',
      progress: {
        completed: completedCount,
        total: poolMatches.length
      }
    })

  } catch (error) {
    console.error('Error checking knockout readiness:', error)
    return NextResponse.json({ error: 'Failed to check knockout readiness' }, { status: 500 })
  }
}

// POST - Auto-generate Round of 16 if ready
export async function POST(request: NextRequest) {
  try {
    const { tournamentId } = await request.json()

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
    }

    // Check readiness first
    const readyCheck = await GET(request)
    const readyData = await readyCheck.json()

    if (!readyData.ready) {
      return NextResponse.json({ 
        error: readyData.message,
        generated: false
      }, { status: 400 })
    }

    // Generate Round of 16 by calling the knockout API
    const knockoutResponse = await fetch(`${request.nextUrl.origin}/api/knockout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId })
    })

    const knockoutData = await knockoutResponse.json()

    if (knockoutResponse.ok) {
      return NextResponse.json({
        success: true,
        generated: true,
        message: 'Round of 16 generated automatically based on pool standings!',
        matches: knockoutData.matches
      })
    } else {
      return NextResponse.json({
        error: knockoutData.error || 'Failed to generate Round of 16',
        generated: false
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error auto-generating knockout:', error)
    return NextResponse.json({ 
      error: 'Failed to auto-generate knockout stage',
      generated: false
    }, { status: 500 })
  }
}
