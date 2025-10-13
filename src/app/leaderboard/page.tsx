'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Loader2, Home, RefreshCw, Medal } from 'lucide-react'

interface Tournament {
  id: string
  name: string
  phase: number
  isActive: boolean
}

interface LeaderboardEntry {
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
}

export default function PublicLeaderboardPage() {
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPool, setSelectedPool] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch all data in parallel
  useEffect(() => {
    fetchAllData()
  }, [])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh || !activeTournament) return
    
    const interval = setInterval(() => {
      fetchLeaderboard(activeTournament.id)
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, activeTournament])

  useEffect(() => {
    applyFilters()
  }, [leaderboard, selectedPool])

  // Optimized parallel fetch
  const fetchAllData = async () => {
    try {
      setLoading(true)
      
      const tournamentResponse = await fetch('/api/tournaments?activeOnly=true', {
        cache: 'default',
      })
      
      if (!tournamentResponse.ok) {
        throw new Error('Failed to fetch tournament')
      }
      
      const tournamentData = await tournamentResponse.json()
      const active = tournamentData.tournaments[0]
      
      if (active) {
        setActiveTournament(active)
        
        const leaderboardResponse = await fetch(`/api/leaderboard?tournamentId=${active.id}`, {
          cache: 'default',
        })
        
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json()
          setLeaderboard(leaderboardData.leaderboard || [])
        }
      } else {
        setActiveTournament(null)
        setLeaderboard([])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderboard = useCallback(async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/leaderboard?tournamentId=${tournamentId}`, {
        cache: 'default',
      })
      const data = await response.json()
      
      if (response.ok) {
        setLeaderboard(data.leaderboard || [])
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    }
  }, [])

  const uniquePools = useMemo(() => 
    [...new Set(leaderboard.map(entry => entry.pool).filter(p => p !== null))].sort(),
    [leaderboard]
  )

  const applyFilters = () => {
    let filtered = leaderboard.filter(entry => entry.pool === selectedPool)
    setFilteredLeaderboard(filtered)
  }

  // Auto-select first pool when pools are available
  useEffect(() => {
    if (uniquePools.length > 0 && !selectedPool) {
      setSelectedPool(uniquePools[0] || '')
    }
  }, [uniquePools, selectedPool])

  const getRankColor = (index: number) => {
    if (index === 0) return 'text-yellow-400' // Gold
    if (index === 1) return 'text-slate-300' // Silver
    if (index === 2) return 'text-amber-600' // Bronze
    return 'text-slate-400'
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <Image src="/logo.png" alt="Background" width={600} height={600} className="animate-spin-slow" style={{ animationDuration: '60s' }} priority={false} loading="lazy" quality={50} />
          </div>
        </div>
        
        {/* Skeleton Header */}
        <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="h-4 w-16 bg-yellow-500/20 rounded animate-pulse"></div>
                <div className="h-5 w-32 bg-gradient-to-r from-yellow-500/20 to-emerald-500/20 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Skeleton Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-2xl p-6 mb-6 animate-pulse">
            <div className="h-6 w-48 bg-yellow-500/20 rounded mb-2"></div>
            <div className="h-4 w-32 bg-slate-500/20 rounded"></div>
          </div>
          <div className="bg-black/30 border-2 border-yellow-500/30 rounded-2xl p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex justify-between items-center p-4 bg-black/40 rounded-xl animate-pulse">
                  <div className="h-5 w-32 bg-slate-500/20 rounded"></div>
                  <div className="h-5 w-16 bg-yellow-500/20 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Image
            src="/logo.png"
            alt="Background"
            width={600}
            height={600}
            className="animate-spin-slow"
            style={{ animationDuration: '60s' }}
            priority={false}
            loading="lazy"
            quality={50}
          />
        </div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Link
                href="/"
                className="flex items-center space-x-1 sm:space-x-2 text-yellow-400 hover:text-yellow-300 transition-all shrink-0"
              >
                <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Home</span>
              </Link>
              <div className="h-4 sm:h-6 w-px bg-yellow-500/20 shrink-0"></div>
              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 shrink-0" />
                <h1 className="text-xs sm:text-sm md:text-lg font-black bg-gradient-to-r from-yellow-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent truncate">
                  <span className="hidden sm:inline">TOURNAMENT </span>LEADERBOARD
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all text-xs font-semibold ${
                  autoRefresh 
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' 
                    : 'bg-slate-500/20 border border-slate-500/30 text-slate-400'
                }`}
                title={autoRefresh ? 'Live updates ON (every 10s)' : 'Live updates OFF'}
              >
                <div className={`w-2 h-2 rounded-full ${
                  autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}></div>
                <span className="hidden sm:inline">Live</span>
              </button>
              <button
                onClick={() => activeTournament && fetchLeaderboard(activeTournament.id)}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg sm:rounded-xl transition-all text-yellow-400 text-xs sm:text-sm font-semibold touch-manipulation"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Tournament Info */}
        {activeTournament ? (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent">
                  {activeTournament.name}
                </h2>
                <p className="text-slate-400 mt-1 text-xs sm:text-sm">Live Tournament Standings</p>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center mb-4 sm:mb-6">
            <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-yellow-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent mb-2">
              No Active Tournament
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">Check back later for tournament standings</p>
          </div>
        )}

        {/* Pool Tabs */}
        {activeTournament && uniquePools.length > 0 && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
              <h3 className="text-sm sm:text-base font-semibold text-white">Select Pool</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniquePools.map(pool => (
                <button
                  key={pool}
                  onClick={() => setSelectedPool(pool || '')}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all touch-manipulation ${
                    selectedPool === pool
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/30'
                      : 'bg-black/40 text-slate-300 hover:bg-black/60 border border-slate-600'
                  }`}
                >
                  Pool {pool}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        {activeTournament && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              Standings ({filteredLeaderboard.length} Players)
            </h3>
            
            {filteredLeaderboard.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-700/50">
                      <thead>
                        <tr className="bg-black/40">
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">
                            Player
                          </th>
                          <th className="hidden sm:table-cell px-2 sm:px-4 py-3 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                            Pool
                          </th>
                          <th className="px-2 sm:px-4 py-3 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                            <span className="hidden sm:inline">Played</span>
                            <span className="sm:hidden">P</span>
                          </th>
                          <th className="px-2 sm:px-4 py-3 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                            <span className="hidden sm:inline">Won</span>
                            <span className="sm:hidden">W</span>
                          </th>
                          <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                            <span className="hidden lg:inline">Drawn</span>
                            <span className="lg:hidden">D</span>
                          </th>
                          <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                            <span className="hidden lg:inline">Lost</span>
                            <span className="lg:hidden">L</span>
                          </th>
                          <th className="hidden lg:table-cell px-2 sm:px-4 py-3 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                            GF
                          </th>
                          <th className="hidden lg:table-cell px-2 sm:px-4 py-3 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                            GA
                          </th>
                          <th className="px-2 sm:px-4 py-3 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                            <span className="hidden sm:inline">GD</span>
                            <span className="sm:hidden">+/-</span>
                          </th>
                          <th className="px-2 sm:px-4 py-3 text-center text-xs font-bold text-yellow-400 uppercase tracking-wider">
                            <span className="hidden sm:inline">Points</span>
                            <span className="sm:hidden">Pts</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30">
                        {filteredLeaderboard.map((entry, index) => {
                          const isQualified = index < 16
                          return (
                          <tr 
                            key={entry.playerId}
                            className={`transition-all hover:bg-black/60 ${
                              isQualified 
                                ? 'bg-emerald-500/10 border-l-4 border-emerald-500/50' 
                                : index < 3 ? 'bg-yellow-500/5' : 'bg-black/20'
                            }`}
                          >
                            <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                              <span className={`text-base sm:text-lg font-black ${getRankColor(index)}`}>
                                {getRankIcon(index)}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] sm:max-w-none inline-block">
                                {entry.playerName}
                              </span>
                            </td>
                            <td className="hidden sm:table-cell px-2 sm:px-4 py-3 whitespace-nowrap text-center">
                              {entry.pool && (
                                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs font-bold text-blue-400">
                                  {entry.pool}
                                </span>
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-center text-xs sm:text-sm font-semibold text-slate-300">
                              {entry.matchesPlayed}
                            </td>
                            <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-center text-xs sm:text-sm font-semibold text-emerald-400">
                              {entry.matchesWon}
                            </td>
                            <td className="hidden md:table-cell px-2 sm:px-4 py-3 whitespace-nowrap text-center text-xs sm:text-sm font-semibold text-yellow-400">
                              {entry.matchesDrawn}
                            </td>
                            <td className="hidden md:table-cell px-2 sm:px-4 py-3 whitespace-nowrap text-center text-xs sm:text-sm font-semibold text-red-400">
                              {entry.matchesLost}
                            </td>
                            <td className="hidden lg:table-cell px-2 sm:px-4 py-3 whitespace-nowrap text-center text-xs sm:text-sm font-semibold text-slate-300">
                              {entry.goalsFor}
                            </td>
                            <td className="hidden lg:table-cell px-2 sm:px-4 py-3 whitespace-nowrap text-center text-xs sm:text-sm font-semibold text-slate-300">
                              {entry.goalsAgainst}
                            </td>
                            <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-center">
                              <span className={`text-xs sm:text-sm font-bold ${
                                entry.goalDifference > 0 ? 'text-emerald-400' : 
                                entry.goalDifference < 0 ? 'text-red-400' : 'text-slate-400'
                              }`}>
                                {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-center">
                              <span className="text-sm sm:text-base font-black text-yellow-400">
                                {entry.points}
                              </span>
                            </td>
                          </tr>
                        )})
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-sm sm:text-base">No standings available yet</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
