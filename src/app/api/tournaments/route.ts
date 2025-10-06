import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/tournaments - Get all tournaments or current active tournament
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Optimized query - only fetch essential data
    const tournaments = await prisma.tournament.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      select: {
        id: true,
        name: true,
        description: true,
        phase: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            players: true,
            matches: true,
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      // If activeOnly, we only need 1 result
      take: activeOnly ? 1 : undefined
    })

    // Add aggressive cache headers
    const headers = new Headers()
    headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=20')
    headers.set('Content-Type', 'application/json')

    return new NextResponse(JSON.stringify({ tournaments }), {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json({ error: 'Failed to fetch tournaments' }, { status: 500 })
  }
}

// POST /api/tournaments - Create new tournament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Tournament name is required' }, { status: 400 })
    }

    // Deactivate any existing active tournaments
    await prisma.tournament.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description: description || null,
        phase: 1,
        isActive: true
      },
      include: {
        players: true,
        matches: true,
        tasks: {
          select: {
            id: true,
            name: true,
            homeDescription: true,
            awayDescription: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json({ tournament }, { status: 201 })
  } catch (error) {
    console.error('Error creating tournament:', error)
    return NextResponse.json({ error: 'Failed to create tournament' }, { status: 500 })
  }
}