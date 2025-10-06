'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, Trophy, Loader2, AlertCircle, Filter, RefreshCw, Home } from 'lucide-react'

interface Tournament {
  id: string
  name: string
  phase: number
  isActive: boolean
}

interface Player {
  id: string
  name: string
  pool?: string | null
}

interface Match {
  id: string
  round: number
  matchType: string
  pool: string | null
  homeScore: number | null
  awayScore: number | null
  status: string
  winnerId: string | null
  homePlayer: Player
  awayPlayer: Player
}

export default function PublicFixturesPage() {
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [selectedPool, setSelectedPool] = useState<string>('all')
  const [selectedRound, setSelectedRound] = useState<string>('1')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  
  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch all data in parallel
  useEffect(() => {
    fetchAllData()
  }, [])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh || !activeTournament) return
    
    const interval = setInterval(() => {
      fetchMatches(activeTournament.id)
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, activeTournament])

  useEffect(() => {
    applyFilters()
  }, [matches, selectedPool, selectedRound, selectedStatus])

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
        
        const matchesResponse = await fetch(`/api/matches?tournamentId=${active.id}`, {
          cache: 'default',
        })
        
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json()
          setMatches(matchesData.matches || [])
        }
      } else {
        setActiveTournament(null)
        setMatches([])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchMatches = useCallback(async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/matches?tournamentId=${tournamentId}`, {
        cache: 'default',
      })
      const data = await response.json()
      
      if (response.ok) {
        setMatches(data.matches || [])
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err)
    }
  }, [])

  const applyFilters = () => {
    let filtered = [...matches]

    if (selectedPool !== 'all') {
      filtered = filtered.filter(m => m.pool === selectedPool)
    }

    filtered = filtered.filter(m => m.round === parseInt(selectedRound))

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(m => m.status === selectedStatus)
    }

    filtered.sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round
      if (a.pool && b.pool) return a.pool.localeCompare(b.pool)
      return 0
    })

    setFilteredMatches(filtered)
  }

  const uniqueRounds = useMemo(() => 
    [...new Set(matches.map(m => m.round))].sort((a, b) => a - b),
    [matches]
  )
  
  const uniquePools = useMemo(() => 
    [...new Set(matches.map(m => m.pool).filter(p => p !== null))].sort(),
    [matches]
  )
  
  const matchStats = useMemo(() => ({
    total: matches.length,
    completed: matches.filter(m => m.status === 'completed').length,
    pending: matches.filter(m => m.status === 'pending').length
  }), [matches])

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
        <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="h-4 w-16 bg-purple-500/20 rounded animate-pulse"></div>
                <div className="h-5 w-32 bg-gradient-to-r from-purple-500/20 to-emerald-500/20 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Skeleton Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6 mb-6 animate-pulse">
            <div className="h-6 w-48 bg-purple-500/20 rounded mb-2"></div>
            <div className="h-4 w-32 bg-slate-500/20 rounded"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-black/30 border-2 border-purple-500/30 rounded-xl p-4 animate-pulse">
                <div className="h-6 w-full bg-slate-500/20 rounded"></div>
              </div>
            ))}
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
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Link
                href="/"
                className="flex items-center space-x-1 sm:space-x-2 text-purple-400 hover:text-purple-300 transition-all shrink-0"
              >
                <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Home</span>
              </Link>
              <div className="h-4 sm:h-6 w-px bg-purple-500/20 shrink-0"></div>
              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 shrink-0" />
                <h1 className="text-xs sm:text-sm md:text-lg font-black bg-gradient-to-r from-purple-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent truncate">
                  <span className="hidden sm:inline">TOURNAMENT </span>FIXTURES
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
                onClick={() => activeTournament && fetchMatches(activeTournament.id)}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg sm:rounded-xl transition-all text-purple-400 text-xs sm:text-sm font-semibold touch-manipulation"
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
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
                  {activeTournament.name}
                </h2>
                <p className="text-slate-400 mt-1 text-xs sm:text-sm">Live Tournament Fixtures</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-blue-400 mb-2" />
                <p className="text-lg sm:text-2xl font-bold text-blue-400">{matchStats.total}</p>
                <p className="text-xs sm:text-sm text-slate-400">Total</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-400 mb-2" />
                <p className="text-lg sm:text-2xl font-bold text-emerald-400">{matchStats.completed}</p>
                <p className="text-xs sm:text-sm text-slate-400">Complete</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-400 mb-2" />
                <p className="text-lg sm:text-2xl font-bold text-yellow-400">{matchStats.pending}</p>
                <p className="text-xs sm:text-sm text-slate-400">Pending</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center mb-4 sm:mb-6">
            <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent mb-2">
              No Active Tournament
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">Check back later for tournament fixtures</p>
          </div>
        )}

        {/* Filters */}
        {activeTournament && matches.length > 0 && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            {/* Round Tabs */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-3">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                <h3 className="text-sm sm:text-base font-semibold text-white">Select Round</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueRounds.map(round => {
                  const roundMatches = matches.filter(m => m.round === round)
                  return (
                    <button
                      key={round}
                      onClick={() => setSelectedRound(round.toString())}
                      className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base touch-manipulation ${
                        selectedRound === round.toString()
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/50'
                          : 'bg-black/40 text-slate-400 hover:bg-black/60 border border-slate-700/50'
                      }`}
                    >
                      <span className="sm:hidden">R{round}</span>
                      <span className="hidden sm:inline">Round {round}</span>
                      <span className="ml-1 sm:ml-2 text-xs opacity-75">({roundMatches.length})</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Other Filters */}
            <div className="border-t border-slate-700/50 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Pool</label>
                  <select
                    value={selectedPool}
                    onChange={(e) => setSelectedPool(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-black/20 border-2 border-purple-500/30 rounded-lg sm:rounded-xl text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  >
                    <option value="all">All Pools</option>
                    {uniquePools.map(pool => (
                      <option key={pool} value={pool || ''}>{pool ? `Pool ${pool}` : 'No Pool'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-black/20 border-2 border-purple-500/30 rounded-lg sm:rounded-xl text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Matches List */}
        {activeTournament && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              Matches ({filteredMatches.length})
            </h3>
            
            {filteredMatches.length > 0 ? (
              <div className="space-y-3">
                {filteredMatches.map((match) => (
                  <div
                    key={match.id}
                    className={`bg-black/40 border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all ${
                      match.status === 'completed' 
                        ? 'border-emerald-500/30 hover:border-emerald-500/50' 
                        : 'border-purple-500/30 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs font-bold text-purple-400">
                          R{match.round}
                        </span>
                        {match.pool && (
                          <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs font-bold text-blue-400">
                            Pool {match.pool}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          match.status === 'completed' 
                            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                            : 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                        }`}>
                          {match.status === 'completed' ? '✓ Completed' : 'Pending'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center justify-between sm:justify-start space-x-2 flex-1">
                          <span className={`text-sm sm:text-base lg:text-lg font-bold truncate ${
                            match.winnerId === match.homePlayer.id ? 'text-emerald-400' : 'text-white'
                          }`}>
                            🏠 {match.homePlayer.name}
                          </span>
                          <span className="text-xl sm:text-2xl font-black text-emerald-400 shrink-0">
                            {match.homeScore !== null ? match.homeScore : '-'}
                          </span>
                        </div>

                        <span className="text-slate-500 font-bold text-center hidden sm:inline shrink-0">vs</span>

                        <div className="flex items-center justify-between sm:justify-start space-x-2 flex-1">
                          <span className="text-xl sm:text-2xl font-black text-purple-400 shrink-0">
                            {match.awayScore !== null ? match.awayScore : '-'}
                          </span>
                          <span className={`text-sm sm:text-base lg:text-lg font-bold truncate ${
                            match.winnerId === match.awayPlayer.id ? 'text-emerald-400' : 'text-white'
                          }`}>
                            ✈️ {match.awayPlayer.name}
                          </span>
                        </div>
                      </div>

                      {match.winnerId && (
                        <p className="text-xs sm:text-sm text-emerald-400">
                          Winner: {match.winnerId === match.homePlayer.id ? match.homePlayer.name : match.awayPlayer.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-sm sm:text-base">
                  {matches.length === 0 
                    ? 'No matches found.'
                    : 'No matches match your filter criteria.'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
