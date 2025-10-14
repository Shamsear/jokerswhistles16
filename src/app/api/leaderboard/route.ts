import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tournamentId = searchParams.get('tournamentId')

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      )
    }

    // Fetch only pool matches for the tournament with player details
    // Exclude knockout matches from leaderboard calculations
    const matches = await prisma.match.findMany({
      where: {
        tournamentId: tournamentId,
        matchType: 'pool' // Only include pool matches, exclude all knockout stages
      },
      include: {
        homePlayer: true,
        awayPlayer: true
      },
      orderBy: {
        round: 'asc'
      }
    })

    // Calculate leaderboard statistics
    const playerStats = new Map<string, {
      playerId: string
      playerName: string
      pool: string | null
      matchesPlayed: number
      matchesWon: number
      matchesLost: number
      matchesDrawn: number
      goalsFor: number
      goalsAgainst: number
      goalDifference: number
      points: number
    }>()

    // Initialize all players from matches
    matches.forEach(match => {
      if (!playerStats.has(match.homePlayerId)) {
        playerStats.set(match.homePlayerId, {
          playerId: match.homePlayerId,
          playerName: match.homePlayer.name,
          pool: match.homePlayer.pool,
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          matchesDrawn: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        })
      }
      if (!playerStats.has(match.awayPlayerId)) {
        playerStats.set(match.awayPlayerId, {
          playerId: match.awayPlayerId,
          playerName: match.awayPlayer.name,
          pool: match.awayPlayer.pool,
          matchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          matchesDrawn: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        })
      }
    })

    // Calculate stats from completed matches
    matches
      .filter(m => m.status === 'completed' && m.homeScore !== null && m.awayScore !== null)
      .forEach(match => {
        const homeStats = playerStats.get(match.homePlayerId)!
        const awayStats = playerStats.get(match.awayPlayerId)!

        homeStats.matchesPlayed++
        awayStats.matchesPlayed++

        homeStats.goalsFor += match.homeScore!
        homeStats.goalsAgainst += match.awayScore!
        awayStats.goalsFor += match.awayScore!
        awayStats.goalsAgainst += match.homeScore!

        if (match.homeScore! > match.awayScore!) {
          homeStats.matchesWon++
          homeStats.points += 3
          awayStats.matchesLost++
        } else if (match.homeScore! < match.awayScore!) {
          awayStats.matchesWon++
          awayStats.points += 3
          homeStats.matchesLost++
        } else {
          homeStats.matchesDrawn++
          awayStats.matchesDrawn++
          homeStats.points += 1
          awayStats.points += 1
        }

        homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst
        awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst
      })

    // Convert to array and sort by points, goal difference, then goals for
    const leaderboard = Array.from(playerStats.values())
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
        return b.goalsFor - a.goalsFor
      })

    return NextResponse.json({
      leaderboard,
      totalPlayers: leaderboard.length
    })

  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
