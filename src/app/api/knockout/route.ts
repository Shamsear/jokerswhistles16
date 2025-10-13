import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Fetch knockout stage matches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')
    
    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
    }

    const knockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        knockoutStage: { not: null }
      },
      include: {
        homePlayer: true,
        awayPlayer: true
      },
      orderBy: [
        { knockoutStage: 'asc' },
        { pool: 'asc' }
      ]
    })

    return NextResponse.json({ matches: knockoutMatches })
  } catch (error) {
    console.error('Error fetching knockout matches:', error)
    return NextResponse.json({ error: 'Failed to fetch knockout matches' }, { status: 500 })
  }
}

// POST - Generate knockout stage matches
export async function POST(request: NextRequest) {
  try {
    const { tournamentId, stage } = await request.json()

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: true,
        matches: {
          include: {
            homePlayer: true,
            awayPlayer: true
          }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // If stage is specified, generate that specific stage
    if (stage) {
      const createdMatches = await generateKnockoutStage(tournament, stage)
      return NextResponse.json({ 
        success: true, 
        matches: createdMatches,
        message: `${stage} matches created successfully`
      })
    }

    // Otherwise, generate Round of 16 (initial knockout stage)
    const createdMatches = await generateRoundOf16(tournament)
    
    return NextResponse.json({ 
      success: true, 
      matches: createdMatches,
      message: 'Round of 16 matches created successfully'
    })
  } catch (error) {
    console.error('Error generating knockout matches:', error)
    return NextResponse.json({ 
      error: 'Failed to generate knockout matches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to calculate player standings
async function calculateStandings(tournamentId: string, pool: string) {
  const players = await prisma.player.findMany({
    where: {
      tournamentId,
      pool
    },
    include: {
      homeMatches: {
        where: {
          matchType: 'pool',
          status: 'completed'
        }
      },
      awayMatches: {
        where: {
          matchType: 'pool',
          status: 'completed'
        }
      }
    }
  })

  const standings = players.map(player => {
    let wins = 0
    let losses = 0
    let points = 0
    let totalScore = 0
    let totalConceded = 0

    // Home matches
    player.homeMatches.forEach(match => {
      totalScore += match.homeScore || 0
      totalConceded += match.awayScore || 0
      if (match.winnerId === player.id) {
        wins++
        points += 3
      } else {
        losses++
      }
    })

    // Away matches
    player.awayMatches.forEach(match => {
      totalScore += match.awayScore || 0
      totalConceded += match.homeScore || 0
      if (match.winnerId === player.id) {
        wins++
        points += 3
      } else {
        losses++
      }
    })

    const goalDifference = totalScore - totalConceded

    return {
      player,
      wins,
      losses,
      points,
      totalScore,
      totalConceded,
      goalDifference,
      matchesPlayed: wins + losses
    }
  })

  // Sort by: points > goal difference > total score
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    return b.totalScore - a.totalScore
  })

  return standings
}

// Generate Round of 16 matches
async function generateRoundOf16(tournament: any) {
  const poolA = await calculateStandings(tournament.id, 'A')
  const poolB = await calculateStandings(tournament.id, 'B')

  // Get top 16 from each pool
  const top16A = poolA.slice(0, 16)
  const top16B = poolB.slice(0, 16)

  if (top16A.length < 16 || top16B.length < 16) {
    throw new Error('Not enough qualified players in one or both pools')
  }

  const createdMatches = []

  // Create Round of 16 matches for Pool A
  // Seeding: 1st vs 16th, 2nd vs 15th, 3rd vs 14th, etc.
  for (let i = 0; i < 8; i++) {
    const topSeed = i // 0-indexed: 0 = 1st place, 1 = 2nd place, etc.
    const bottomSeed = 15 - i // 15 = 16th place, 14 = 15th place, etc.
    
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: top16A[topSeed].player.id,
        awayPlayerId: top16A[bottomSeed].player.id,
        round: 7, // Round 7 = Round of 16
        matchType: 'round_of_16',
        knockoutStage: 'round_of_16',
        pool: 'A',
        status: 'pending'
      },
      include: {
        homePlayer: true,
        awayPlayer: true
      }
    })
    createdMatches.push(match)
  }

  // Create Round of 16 matches for Pool B
  // Seeding: 1st vs 16th, 2nd vs 15th, 3rd vs 14th, etc.
  for (let i = 0; i < 8; i++) {
    const topSeed = i // 0-indexed: 0 = 1st place, 1 = 2nd place, etc.
    const bottomSeed = 15 - i // 15 = 16th place, 14 = 15th place, etc.
    
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: top16B[topSeed].player.id,
        awayPlayerId: top16B[bottomSeed].player.id,
        round: 7, // Round 7 = Round of 16
        matchType: 'round_of_16',
        knockoutStage: 'round_of_16',
        pool: 'B',
        status: 'pending'
      },
      include: {
        homePlayer: true,
        awayPlayer: true
      }
    })
    createdMatches.push(match)
  }

  return createdMatches
}

// Generate subsequent knockout stages
async function generateKnockoutStage(tournament: any, stage: string) {
  const previousStage = getPreviousStage(stage)
  if (!previousStage) {
    throw new Error('Invalid stage')
  }

  // Get completed matches from previous stage
  const previousMatches = await prisma.match.findMany({
    where: {
      tournamentId: tournament.id,
      knockoutStage: previousStage,
      status: 'completed',
      winnerId: { not: null }
    },
    include: {
      homePlayer: true,
      awayPlayer: true
    },
    orderBy: [
      { pool: 'asc' },
      { createdAt: 'asc' }
    ]
  })

  // For mega final, we need winners from both group finals
  if (stage === 'mega_final') {
    const groupFinalWinners = await prisma.match.findMany({
      where: {
        tournamentId: tournament.id,
        knockoutStage: 'group_final',
        status: 'completed',
        winnerId: { not: null }
      },
      include: {
        homePlayer: true,
        awayPlayer: true
      }
    })

    if (groupFinalWinners.length !== 2) {
      throw new Error('Both group finals must be completed before creating mega final')
    }

    const winnerA = groupFinalWinners.find(m => m.pool === 'A')
    const winnerB = groupFinalWinners.find(m => m.pool === 'B')

    if (!winnerA || !winnerB) {
      throw new Error('Could not find winners from both groups')
    }

    const megaFinal = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: winnerA.winnerId!,
        awayPlayerId: winnerB.winnerId!,
        round: 11, // Mega final round
        matchType: 'mega_final',
        knockoutStage: 'mega_final',
        pool: null, // No pool for mega final
        status: 'pending'
      },
      include: {
        homePlayer: true,
        awayPlayer: true
      }
    })

    return [megaFinal]
  }

  // For other stages, process each pool separately
  const poolAMatches = previousMatches.filter(m => m.pool === 'A')
  const poolBMatches = previousMatches.filter(m => m.pool === 'B')

  if (poolAMatches.length === 0 || poolBMatches.length === 0) {
    throw new Error(`Not all ${previousStage} matches are completed`)
  }

  const createdMatches = []
  const roundNumber = getRoundNumber(stage)

  // Create matches for Pool A
  for (let i = 0; i < poolAMatches.length; i += 2) {
    if (i + 1 >= poolAMatches.length) break
    
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: poolAMatches[i].winnerId!,
        awayPlayerId: poolAMatches[i + 1].winnerId!,
        round: roundNumber,
        matchType: stage,
        knockoutStage: stage,
        pool: 'A',
        status: 'pending'
      },
      include: {
        homePlayer: true,
        awayPlayer: true
      }
    })
    createdMatches.push(match)
  }

  // Create matches for Pool B
  for (let i = 0; i < poolBMatches.length; i += 2) {
    if (i + 1 >= poolBMatches.length) break
    
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: poolBMatches[i].winnerId!,
        awayPlayerId: poolBMatches[i + 1].winnerId!,
        round: roundNumber,
        matchType: stage,
        knockoutStage: stage,
        pool: 'B',
        status: 'pending'
      },
      include: {
        homePlayer: true,
        awayPlayer: true
      }
    })
    createdMatches.push(match)
  }

  return createdMatches
}

function getPreviousStage(stage: string): string | null {
  const stages: Record<string, string> = {
    'quarter_final': 'round_of_16',
    'semi_final': 'quarter_final',
    'group_final': 'semi_final',
    'mega_final': 'group_final'
  }
  return stages[stage] || null
}

function getRoundNumber(stage: string): number {
  const rounds: Record<string, number> = {
    'round_of_16': 7,
    'quarter_final': 8,
    'semi_final': 9,
    'group_final': 10,
    'mega_final': 11
  }
  return rounds[stage] || 7
}
