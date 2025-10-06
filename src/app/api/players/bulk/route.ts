import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/players/bulk - Bulk add players
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { names, tournamentId } = body

    if (!names || !Array.isArray(names) || names.length === 0) {
      return NextResponse.json(
        { error: 'Names array is required' }, 
        { status: 400 }
      )
    }

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' }, 
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

    // Clean and validate names
    const cleanNames = names
      .map(name => name.trim())
      .filter(name => name.length > 0)

    if (cleanNames.length === 0) {
      return NextResponse.json(
        { error: 'No valid names provided' }, 
        { status: 400 }
      )
    }

    // Check for duplicates in the input
    const uniqueNames = [...new Set(cleanNames)]
    if (uniqueNames.length !== cleanNames.length) {
      return NextResponse.json(
        { error: 'Duplicate names found in the input' }, 
        { status: 400 }
      )
    }

    // Check for existing players with the same names
    const existingPlayers = await prisma.player.findMany({
      where: {
        name: { in: uniqueNames },
        tournamentId
      }
    })

    if (existingPlayers.length > 0) {
      const existingNames = existingPlayers.map(p => p.name)
      return NextResponse.json(
        { 
          error: 'Some players already exist', 
          existingNames 
        }, 
        { status: 400 }
      )
    }

    // Create players
    const players = await prisma.player.createMany({
      data: uniqueNames.map(name => ({
        name,
        tournamentId,
        isAdmin: false
      }))
    })

    // Fetch the created players to return them
    const createdPlayers = await prisma.player.findMany({
      where: {
        name: { in: uniqueNames },
        tournamentId
      },
      include: {
        tournament: true
      }
    })

    return NextResponse.json({ 
      message: `Successfully added ${players.count} players`,
      players: createdPlayers 
    }, { status: 201 })
  } catch (error) {
    console.error('Error bulk adding players:', error)
    return NextResponse.json({ error: 'Failed to add players' }, { status: 500 })
  }
}