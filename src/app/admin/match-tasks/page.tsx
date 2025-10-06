'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  CheckSquare,
  Trophy,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  X as XIcon
} from 'lucide-react'

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
  pool: string | null
  status: string
  homePlayer: Player
  awayPlayer: Player
  matchTasks?: MatchTask[]
}

interface MatchTask {
  id: string
  taskId: string
  playerId: string
  playerType: string
  cardNumber: number | null
  task: {
    id: string
    name: string
  }
}

export default function MatchTasksAdmin() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copiedMatchId, setCopiedMatchId] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [allRounds, setAllRounds] = useState<number[]>([])
  
  // Filters
  const [selectedPool, setSelectedPool] = useState<string>('all')
  const [selectedRound, setSelectedRound] = useState<number | null>(null)
  const [homeTeamSearch, setHomeTeamSearch] = useState('')
  const [awayTeamSearch, setAwayTeamSearch] = useState('')

  // Check authentication
  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    } else {
      router.push('/admin/login')
    }
  }, [router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveTournament()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (activeTournament) {
      fetchAllRounds(activeTournament.id)
    }
  }, [activeTournament])

  useEffect(() => {
    if (activeTournament && selectedRound !== null) {
      fetchMatches(activeTournament.id, selectedRound)
    }
  }, [activeTournament, selectedRound])

  // Auto-refresh every 10 seconds for live updates
  useEffect(() => {
    if (!autoRefresh || !activeTournament || selectedRound === null) return
    
    const interval = setInterval(() => {
      fetchMatches(activeTournament.id, selectedRound, true) // true = silent background fetch
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, activeTournament, selectedRound])

  useEffect(() => {
    applyFilters()
  }, [matches, selectedPool, homeTeamSearch, awayTeamSearch])

  const fetchActiveTournament = async () => {
    try {
      const response = await fetch('/api/tournaments', {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const data = await response.json()
      
      if (response.ok) {
        const active = data.tournaments.find((t: Tournament) => t.isActive)
        setActiveTournament(active || null)
      } else {
        setError(data.error || 'Failed to fetch tournament')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllRounds = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/matches?tournamentId=${tournamentId}`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const data = await response.json()
      
      if (response.ok && data.matches) {
        const rounds: number[] = [...new Set(data.matches.map((m: Match) => m.round))].sort((a, b) => (a as number) - (b as number)) as number[]
        setAllRounds(rounds)
        // Auto-select first round
        if (rounds.length > 0) {
          setSelectedRound(rounds[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch rounds:', err)
    }
  }

  const fetchMatches = async (tournamentId: string, round: number, isSilent = false) => {
    if (!isSilent) {
      setIsRefreshing(true)
    }
    
    try {
      const response = await fetch(`/api/matches?tournamentId=${tournamentId}`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const data = await response.json()
      
      if (response.ok) {
        // Filter matches for selected round only
        const roundMatches = data.matches.filter((m: Match) => m.round === round)
        
        // Fetch match tasks for each match in parallel for speed
        const matchesWithTasks = await Promise.all(
          roundMatches.map(async (match: Match) => {
            try {
              const tasksResponse = await fetch(`/api/match-tasks?matchId=${match.id}`, {
                cache: 'no-cache',
                headers: { 'Cache-Control': 'no-cache' }
              })
              const tasksData = await tasksResponse.json()
              return {
                ...match,
                matchTasks: tasksData.matchTasks || []
              }
            } catch {
              return match
            }
          })
        )
        setMatches(matchesWithTasks)
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err)
    } finally {
      if (!isSilent) {
        setIsRefreshing(false)
      }
    }
  }

  const applyFilters = () => {
    let filtered = [...matches]

    if (selectedPool !== 'all') {
      filtered = filtered.filter(m => m.pool === selectedPool)
    }

    if (homeTeamSearch.trim()) {
      filtered = filtered.filter(m => 
        m.homePlayer.name.toLowerCase().includes(homeTeamSearch.toLowerCase())
      )
    }

    if (awayTeamSearch.trim()) {
      filtered = filtered.filter(m => 
        m.awayPlayer.name.toLowerCase().includes(awayTeamSearch.toLowerCase())
      )
    }

    // Sort by pool
    filtered.sort((a, b) => {
      if (a.pool && b.pool) return a.pool.localeCompare(b.pool)
      return 0
    })

    setFilteredMatches(filtered)
  }

  const copyMatchLink = async (matchId: string) => {
    const link = `${window.location.origin}/match/${matchId}/task`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedMatchId(matchId)
      setSuccess('Link copied to clipboard!')
      setTimeout(() => {
        setCopiedMatchId(null)
        setSuccess('')
      }, 2000)
    } catch (err) {
      setError('Failed to copy link')
      setTimeout(() => setError(''), 3000)
    }
  }

  const openMatchLink = (matchId: string) => {
    window.open(`/match/${matchId}/task`, '_blank')
  }

  const getUniquePools = () => {
    const pools = [...new Set(matches.map(m => m.pool).filter(p => p !== null))]
    return pools.sort()
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2 text-emerald-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg font-semibold">Loading...</span>
        </div>
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
                href="/admin"
                className="flex items-center space-x-1 sm:space-x-2 text-yellow-400 hover:text-yellow-300 transition-all shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Back</span>
              </Link>
              <div className="h-4 sm:h-6 w-px bg-yellow-500/20 shrink-0"></div>
              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 shrink-0" />
                <h1 className="text-xs sm:text-sm md:text-lg font-black bg-gradient-to-r from-yellow-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent truncate">
                  <span className="hidden sm:inline">MATCH </span>TASKS
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
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-500/5 border-2 border-red-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs sm:text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 sm:mb-6 bg-emerald-500/5 border-2 border-emerald-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
            <div className="flex items-start space-x-2">
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-300 text-xs sm:text-sm font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Tournament Info */}
        {activeTournament ? (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent break-words">
                  {activeTournament.name}
                </h2>
                <p className="text-slate-400 mt-1 text-xs sm:text-sm">Share match links with players for task assignment</p>
              </div>
              <button
                onClick={() => activeTournament && selectedRound !== null && fetchMatches(activeTournament.id, selectedRound)}
                disabled={isRefreshing || selectedRound === null}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg sm:rounded-xl transition-all text-yellow-400 disabled:opacity-50 w-full sm:w-auto touch-manipulation"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-xs sm:text-sm font-semibold">Refresh</span>
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-blue-300 text-xs sm:text-sm">
                <strong>📋 How it works:</strong> Share the link with players. One player opens the link, identifies themselves, picks a card (lot), and a random task is assigned to the match. Both players receive their respective home/away tasks. The link becomes disabled after task assignment.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center mb-4 sm:mb-6">
            <CheckSquare className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-yellow-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent mb-2 px-4">
              No Active Tournament
            </h2>
            <p className="text-slate-400 mb-6 text-sm sm:text-base px-4">Create a tournament and generate matches first</p>
            <Link
              href="/admin/tournament"
              className="inline-flex items-center justify-center space-x-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg sm:rounded-xl transition-all shadow-xl shadow-yellow-500/50 w-full max-w-xs sm:w-auto touch-manipulation"
            >
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">GO TO TOURNAMENT</span>
            </Link>
          </div>
        )}

        {/* Round Tabs */}
        {activeTournament && allRounds.length > 0 && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
              <h3 className="text-sm sm:text-base font-semibold text-white">Select Round</h3>
            </div>
            
            {/* Round Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {allRounds.map((round) => (
                <button
                  key={round}
                  onClick={() => setSelectedRound(round)}
                  className={`px-4 sm:px-6 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all touch-manipulation ${
                    selectedRound === round
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/50'
                      : 'bg-black/40 border-2 border-yellow-500/30 text-yellow-400 hover:border-yellow-500/50 hover:bg-yellow-500/10'
                  }`}
                >
                  Round {round}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        {activeTournament && selectedRound !== null && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Search & Filter</h3>
            </div>
            
            <div className="grid gap-3 sm:gap-4">
              {/* Pool Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Pool</label>
                <select
                  value={selectedPool}
                  onChange={(e) => setSelectedPool(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 bg-black/20 border-2 border-yellow-500/30 rounded-lg sm:rounded-xl text-white text-sm focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                >
                  <option value="all">All Pools</option>
                  {getUniquePools().map(pool => (
                    <option key={pool} value={pool || ''}>{pool ? `Pool ${pool}` : 'No Pool'}</option>
                  ))}
                </select>
              </div>

              {/* Search Bars */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-2">🏠 Home Team Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={homeTeamSearch}
                      onChange={(e) => setHomeTeamSearch(e.target.value)}
                      placeholder="Search home team..."
                      className="w-full pl-10 pr-10 py-2 bg-black/20 border-2 border-emerald-500/30 rounded-lg sm:rounded-xl text-white text-sm placeholder-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    {homeTeamSearch && (
                      <button
                        onClick={() => setHomeTeamSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700/50 rounded transition-all"
                      >
                        <XIcon className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-400 mb-2">✈️ Away Team Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={awayTeamSearch}
                      onChange={(e) => setAwayTeamSearch(e.target.value)}
                      placeholder="Search away team..."
                      className="w-full pl-10 pr-10 py-2 bg-black/20 border-2 border-purple-500/30 rounded-lg sm:rounded-xl text-white text-sm placeholder-slate-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                    {awayTeamSearch && (
                      <button
                        onClick={() => setAwayTeamSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700/50 rounded transition-all"
                      >
                        <XIcon className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {(homeTeamSearch || awayTeamSearch || selectedPool !== 'all') && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/30">
                  <span className="text-xs text-slate-400">Active filters:</span>
                  {homeTeamSearch && (
                    <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-400">
                      Home: {homeTeamSearch}
                    </span>
                  )}
                  {awayTeamSearch && (
                    <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400">
                      Away: {awayTeamSearch}
                    </span>
                  )}
                  {selectedPool !== 'all' && (
                    <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400">
                      Pool: {selectedPool}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setHomeTeamSearch('')
                      setAwayTeamSearch('')
                      setSelectedPool('all')
                    }}
                    className="px-2 py-1 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400 hover:bg-red-500/30 transition-all"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Matches List */}
        {activeTournament && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent mb-3 sm:mb-4">
              Match Links ({filteredMatches.length})
            </h3>
            
            {filteredMatches.length > 0 ? (
              <div className="space-y-3 sm:space-y-3">
                {filteredMatches.map((match) => {
                  const hasTask = match.matchTasks && match.matchTasks.length > 0
                  const taskInfo = hasTask && match.matchTasks ? match.matchTasks[0] : null
                  const pickedByPlayer = hasTask && match.matchTasks && match.matchTasks[0]?.playerId
                  const pickerName = pickedByPlayer === match.homePlayer.id ? match.homePlayer.name : match.awayPlayer.name
                  
                  return (
                    <div
                      key={match.id}
                      className={`bg-black/40 border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all ${
                        hasTask ? 'border-emerald-500/30 hover:border-emerald-500/50' : 'border-yellow-500/30 hover:border-yellow-500/50'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row items-start justify-between gap-3">
                        <div className="flex-1 w-full min-w-0">
                          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-2">
                            <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs font-bold text-yellow-400">
                              R{match.round}
                            </span>
                            {match.pool && (
                              <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs font-bold text-blue-400">
                                Pool {match.pool}
                              </span>
                            )}
                            {hasTask && (
                              <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs font-bold text-emerald-400">
                                ✓ Lot Assigned
                              </span>
                            )}
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-white font-semibold text-sm sm:text-base lg:text-lg break-words">
                              🏠 <span className="break-words">{match.homePlayer.name}</span> <span className="text-slate-500">vs</span> ✈️ <span className="break-words">{match.awayPlayer.name}</span>
                            </p>
                          </div>

                          {hasTask ? (
                            // Show task information
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 sm:p-3 mb-3">
                              <div className="flex items-center space-x-2 mb-1.5">
                                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                                <p className="text-xs sm:text-sm font-bold text-emerald-400 break-words">Lot: {taskInfo?.task?.name}</p>
                              </div>
                              <p className="text-xs text-slate-400 break-words">
                                Picked by: <span className="text-emerald-400 font-semibold">{pickerName}</span>
                                {taskInfo?.cardNumber && ` • Card ${taskInfo.cardNumber}`}
                              </p>
                            </div>
                          ) : (
                            // Show link to assign task
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5 sm:p-3 mb-3">
                              <p className="text-xs text-slate-400 mb-1">Task Assignment Link:</p>
                              <p className="text-emerald-400 text-xs sm:text-sm font-mono break-all">
                                {window.location.origin}/match/{match.id}/task
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="w-full lg:w-auto flex lg:flex-col gap-2">
                          {!hasTask ? (
                            // Show copy and open buttons only if task not assigned
                            <>
                              <button
                                onClick={() => copyMatchLink(match.id)}
                                className={`flex-1 lg:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all font-semibold text-xs sm:text-sm touch-manipulation ${
                                  copiedMatchId === match.id
                                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                                    : 'bg-yellow-500/20 hover:bg-yellow-500/30 active:bg-yellow-500/40 border border-yellow-500/30 text-yellow-400'
                                }`}
                              >
                                {copiedMatchId === match.id ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => openMatchLink(match.id)}
                                className="flex-1 lg:flex-none flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 active:bg-purple-500/40 border border-purple-500/30 rounded-lg transition-all text-purple-400 font-semibold text-xs sm:text-sm touch-manipulation"
                              >
                                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span>Open</span>
                              </button>
                            </>
                          ) : (
                            // Show completed indicator
                            <div className="px-3 sm:px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs sm:text-sm font-semibold text-center">
                              ✓ Complete
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <CheckSquare className="h-12 w-12 sm:h-16 sm:w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-sm sm:text-base px-4">
                  {matches.length === 0 
                    ? 'No matches found. Create matches first in the opponent draw.'
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
