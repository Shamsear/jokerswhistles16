import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateRegistrationToken } from '@/lib/utils'

// GET /api/registration-links - Get registration links for a tournament OR get by token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')
    const token = searchParams.get('token')

    // If token provided, return single link by token
    if (token) {
      const link = await prisma.registrationLink.findUnique({
        where: { token },
        include: {
          tournament: true
        }
      })

      if (!link) {
        return NextResponse.json({ error: 'Registration link not found' }, { status: 404 })
      }

      if (!link.isActive) {
        return NextResponse.json({ error: 'Registration link is inactive' }, { status: 400 })
      }

      return NextResponse.json({ link })
    }

    // Otherwise, return all links for tournament
    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID or token is required' }, 
        { status: 400 }
      )
    }

    const registrationLinks = await prisma.registrationLink.findMany({
      where: { tournamentId },
      include: {
        tournament: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ registrationLinks })
  } catch (error) {
    console.error('Error fetching registration links:', error)
    return NextResponse.json({ error: 'Failed to fetch registration links' }, { status: 500 })
  }
}

// POST /api/registration-links - Create new registration link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tournamentId, expiresAt } = body

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' }, 
        { status: 400 }
      )
    }

    // Check if tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.phase !== 1) {
      return NextResponse.json(
        { error: 'Cannot create registration links after registration phase' }, 
        { status: 400 }
      )
    }

    const token = generateRegistrationToken()
    
    const registrationLink = await prisma.registrationLink.create({
      data: {
        token,
        tournamentId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true
      },
      include: {
        tournament: true
      }
    })

    return NextResponse.json({ registrationLink }, { status: 201 })
  } catch (error) {
    console.error('Error creating registration link:', error)
    return NextResponse.json({ error: 'Failed to create registration link' }, { status: 500 })
  }
}

// PATCH /api/registration-links - Update registration link (activate/deactivate)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Registration link ID is required' }, 
        { status: 400 }
      )
    }

    const registrationLink = await prisma.registrationLink.update({
      where: { id },
      data: { isActive },
      include: {
        tournament: true
      }
    })

    return NextResponse.json({ registrationLink })
  } catch (error) {
    console.error('Error updating registration link:', error)
    return NextResponse.json({ error: 'Failed to update registration link' }, { status: 500 })
  }
}