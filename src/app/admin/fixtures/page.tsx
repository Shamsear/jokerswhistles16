'use client'

import { useState, useEffect, useMemo, useCallback, lazy, Suspense, memo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Calendar,
  Trophy,
  Check,
  Loader2,
  AlertCircle,
  Filter,
  Save,
  RefreshCw,
  Share2,
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react'

// Lazy load the share modal for better initial page load
const FixtureShareModal = lazy(() => import('@/components/FixtureShareModal'))

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
  absentStatus: string | null
  homePlayer: Player
  awayPlayer: Player
}

export default function FixturesManagement() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Filters
  const [selectedPool, setSelectedPool] = useState<string>('all')
  const [selectedRound, setSelectedRound] = useState<string>('1') // Default to round 1
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedAbsentStatus, setSelectedAbsentStatus] = useState<string>('all')
  const [homeTeamSearch, setHomeTeamSearch] = useState<string>('')
  const [awayTeamSearch, setAwayTeamSearch] = useState<string>('')
  const [debouncedHomeSearch, setDebouncedHomeSearch] = useState<string>('')
  const [debouncedAwaySearch, setDebouncedAwaySearch] = useState<string>('')
  
  // Edit state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null)
  const [editHomeScore, setEditHomeScore] = useState<string>('')
  const [editAwayScore, setEditAwayScore] = useState<string>('')
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null)
  const [resettingMatchId, setResettingMatchId] = useState<string | null>(null)
  const [isSavingToServer, setIsSavingToServer] = useState(false)
  
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareRound, setShareRound] = useState<string>('all')
  
  // Removed auto-refresh - using optimistic updates for instant UI
  
  // Collapsible stats
  const [isStatsExpanded, setIsStatsExpanded] = useState(false)
  
  // Collapsible filters
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  
  // Track recently updated matches for visual feedback
  const [recentlyUpdatedMatches, setRecentlyUpdatedMatches] = useState<Set<string>>(new Set())

  // Check authentication
  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    } else {
      router.push('/admin/login')
    }
  }, [router])

  // Fetch all data in parallel for faster loading
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData()
    }
  }, [isAuthenticated])
  
  // No auto-refresh polling - using optimistic updates for instant feedback
  // Manual refresh available via refresh button if needed
  
  // Prevent page refresh/navigation during save
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSavingToServer) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isSavingToServer])
  
  // Debounce search inputs to reduce lag
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHomeSearch(homeTeamSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [homeTeamSearch])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAwaySearch(awayTeamSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [awayTeamSearch])

  useEffect(() => {
    applyFilters()
  }, [matches, selectedPool, selectedRound, selectedStatus, selectedAbsentStatus, debouncedHomeSearch, debouncedAwaySearch])

  // Optimized parallel fetch with activeOnly parameter
  const fetchAllData = async () => {
    try {
      setLoading(true)
      
      // Fetch only active tournament (faster query)
      const tournamentResponse = await fetch('/api/tournaments?activeOnly=true', {
        cache: 'default', // Use browser cache
      })
      
      if (!tournamentResponse.ok) {
        throw new Error('Failed to fetch tournament')
      }
      
      const tournamentData = await tournamentResponse.json()
      const active = tournamentData.tournaments[0] // activeOnly returns array with 1 item
      
      if (active) {
        setActiveTournament(active)
        
        // Immediately fetch matches (without task assignments for speed)
        const matchesResponse = await fetch(`/api/matches?tournamentId=${active.id}`, {
          cache: 'default', // Use browser cache
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
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatches = useCallback(async (tournamentId: string, isBackgroundFetch = false) => {
    try {
      // Use cache for better performance, no-cache only for manual refresh
      const response = await fetch(`/api/matches?tournamentId=${tournamentId}`, {
        cache: isBackgroundFetch ? 'default' : 'no-cache',
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

    // Always filter by selected round (no 'all' option anymore)
    filtered = filtered.filter(m => m.round === parseInt(selectedRound))

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(m => m.status === selectedStatus)
    }

    // Filter by absent status (WO/NULL)
    if (selectedAbsentStatus !== 'all') {
      if (selectedAbsentStatus === 'wo') {
        filtered = filtered.filter(m => m.absentStatus && m.absentStatus !== 'both_absent')
      } else if (selectedAbsentStatus === 'null') {
        filtered = filtered.filter(m => m.absentStatus === 'both_absent')
      } else if (selectedAbsentStatus === 'normal') {
        filtered = filtered.filter(m => !m.absentStatus || m.absentStatus === null)
      }
    }

    // Apply debounced home team search
    if (debouncedHomeSearch.trim()) {
      filtered = filtered.filter(m => 
        m.homePlayer.name.toLowerCase().includes(debouncedHomeSearch.toLowerCase())
      )
    }

    // Apply debounced away team search
    if (debouncedAwaySearch.trim()) {
      filtered = filtered.filter(m => 
        m.awayPlayer.name.toLowerCase().includes(debouncedAwaySearch.toLowerCase())
      )
    }

    // Sort by round, then pool
    filtered.sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round
      if (a.pool && b.pool) return a.pool.localeCompare(b.pool)
      return 0
    })

    setFilteredMatches(filtered)
  }

  // Memoize callbacks to prevent unnecessary re-renders
  const startEditMatch = useCallback((match: Match) => {
    setEditingMatchId(match.id)
    setEditHomeScore(match.homeScore?.toString() || '')
    setEditAwayScore(match.awayScore?.toString() || '')
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingMatchId(null)
    setEditHomeScore('')
    setEditAwayScore('')
  }, [])

  const saveMatchResultWithAbsent = async (matchId: string, homeScoreValue: number | null, awayScoreValue: number | null, absentStatus: string) => {
    setSavingMatchId(matchId)
    setIsSavingToServer(true)
    
    // OPTIMISTIC UPDATE: Update UI immediately
    const optimisticMatches = matches.map(match => {
      if (match.id === matchId) {
        let status = 'completed'
        let winnerId = null
        
        if (absentStatus === 'both_absent') {
          winnerId = null
        } else if (homeScoreValue !== null && awayScoreValue !== null) {
          winnerId = homeScoreValue > awayScoreValue ? match.homePlayer.id : 
                    awayScoreValue > homeScoreValue ? match.awayPlayer.id : null
        }
        
        return {
          ...match,
          homeScore: homeScoreValue,
          awayScore: awayScoreValue,
          status,
          winnerId,
          absentStatus
        }
      }
      return match
    })
    
    setMatches(optimisticMatches)
    setSuccess('Match result saved!')
    setEditingMatchId(null)
    setEditHomeScore('')
    setEditAwayScore('')
    
    setRecentlyUpdatedMatches(prev => new Set(prev).add(matchId))
    setTimeout(() => {
      setRecentlyUpdatedMatches(prev => {
        const newSet = new Set(prev)
        newSet.delete(matchId)
        return newSet
      })
    }, 2000)
    
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore: homeScoreValue, awayScore: awayScoreValue, absentStatus })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setIsSavingToServer(false)
        setTimeout(() => setSuccess(''), 2000)
      } else {
        setError(data.error || 'Failed to save match result')
        if (activeTournament) {
          fetchMatches(activeTournament.id)
        }
        setIsSavingToServer(false)
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      setError('Failed to save match result')
      if (activeTournament) {
        fetchMatches(activeTournament.id)
      }
      setIsSavingToServer(false)
      setTimeout(() => setError(''), 5000)
    } finally {
      setSavingMatchId(null)
    }
  }

  const saveMatchResult = async (matchId: string) => {
    setSavingMatchId(matchId)
    setIsSavingToServer(true) // Prevent page refresh during save
    
    // Treat empty fields as 0 when saving (user left field blank = 0 score)
    // Only null if BOTH fields are empty (no result entered)
    const homeScore = editHomeScore !== '' ? parseInt(editHomeScore) : (editAwayScore !== '' ? 0 : null)
    const awayScore = editAwayScore !== '' ? parseInt(editAwayScore) : (editHomeScore !== '' ? 0 : null)
    
    // OPTIMISTIC UPDATE: Update UI immediately before API call
    const optimisticMatches = matches.map(match => {
      if (match.id === matchId) {
        let status = match.status
        let winnerId = match.winnerId
        
        // Calculate status and winner
        // NULL match: both absent (both scores null)
        if (homeScore === null && awayScore === null) {
          status = 'completed'
          winnerId = null
        }
        // Normal match (not WO - absentStatus will be null)
        else if (homeScore !== null && awayScore !== null) {
          status = 'completed'
          winnerId = homeScore > awayScore ? match.homePlayer.id : 
                    awayScore > homeScore ? match.awayPlayer.id : null
        } else {
          status = 'pending'
          winnerId = null
        }
        
        return {
          ...match,
          homeScore,
          awayScore,
          status,
          winnerId,
          absentStatus: null // Normal match, no absent players
        }
      }
      return match
    })
    
    // Update state immediately and synchronously
    setMatches(optimisticMatches)
    setSuccess('Match result saved!')
    
    // Clear edit mode synchronously
    setEditingMatchId(null)
    setEditHomeScore('')
    setEditAwayScore('')
    
    // Add visual feedback - highlight updated match
    setRecentlyUpdatedMatches(prev => new Set(prev).add(matchId))
    setTimeout(() => {
      setRecentlyUpdatedMatches(prev => {
        const newSet = new Set(prev)
        newSet.delete(matchId)
        return newSet
      })
    }, 2000) // Remove highlight after 2 seconds
    
    try {
      // Make API call in background
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          homeScore,
          awayScore
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Success - optimistic update was correct
        setIsSavingToServer(false) // Allow refresh now
        setTimeout(() => setSuccess(''), 2000)
      } else {
        // Error - revert optimistic update
        setError(data.error || 'Failed to save match result')
        if (activeTournament) {
          fetchMatches(activeTournament.id) // Revert to server state
        }
        setIsSavingToServer(false)
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      // Error - revert optimistic update
      setError('Failed to save match result')
      if (activeTournament) {
        fetchMatches(activeTournament.id) // Revert to server state
      }
      setIsSavingToServer(false)
      setTimeout(() => setError(''), 5000)
    } finally {
      setSavingMatchId(null)
    }
  }

  const resetMatchResult = async (matchId: string) => {
    if (!confirm('Are you sure you want to reset this match to pending? This will clear all scores and mark it as not completed.')) {
      return
    }

    setResettingMatchId(matchId)
    setIsSavingToServer(true) // Prevent page refresh during reset
    
    // OPTIMISTIC UPDATE: Update UI immediately
    const optimisticMatches = matches.map(match => {
      if (match.id === matchId) {
        return {
          ...match,
          homeScore: null,
          awayScore: null,
          status: 'pending',
          winnerId: null
        }
      }
      return match
    })
    
    // Update UI instantly
    setMatches(optimisticMatches)
    setSuccess('Match reset to pending!')
    
    // Add visual feedback
    setRecentlyUpdatedMatches(prev => new Set(prev).add(matchId))
    setTimeout(() => {
      setRecentlyUpdatedMatches(prev => {
        const newSet = new Set(prev)
        newSet.delete(matchId)
        return newSet
      })
    }, 2000)
    
    try {
      // Make API call in background
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          homeScore: null,
          awayScore: null,
          status: 'pending'
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Success
        setIsSavingToServer(false) // Allow refresh now
        setTimeout(() => setSuccess(''), 2000)
      } else {
        // Error - revert optimistic update
        setError(data.error || 'Failed to reset match')
        if (activeTournament) {
          fetchMatches(activeTournament.id)
        }
        setIsSavingToServer(false)
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      // Error - revert optimistic update
      setError('Failed to reset match')
      if (activeTournament) {
        fetchMatches(activeTournament.id)
      }
      setIsSavingToServer(false)
      setTimeout(() => setError(''), 5000)
    } finally {
      setResettingMatchId(null)
    }
  }

  // Memoize expensive computations
  const uniqueRounds = useMemo(() => {
    return [...new Set(matches.map(m => m.round))].sort((a, b) => a - b)
  }, [matches])

  const uniquePools = useMemo(() => {
    const pools = [...new Set(matches.map(m => m.pool).filter(p => p !== null))]
    return pools.sort()
  }, [matches])

  const matchStats = useMemo(() => {
    const total = matches.length
    const completed = matches.filter(m => m.status === 'completed').length
    const pending = matches.filter(m => m.status === 'pending').length
    const wo = matches.filter(m => m.absentStatus && m.absentStatus !== 'both_absent').length
    const nullMatches = matches.filter(m => m.absentStatus === 'both_absent').length
    const normal = matches.filter(m => !m.absentStatus || m.absentStatus === null).length
    return { total, completed, pending, wo, null: nullMatches, normal }
  }, [matches])

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background */}
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
        </div>
        
        {/* Skeleton Header */}
        <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-purple-500/20 shadow-lg shadow-purple-500/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex justify-between items-center h-14">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="h-4 w-16 bg-purple-500/20 rounded animate-pulse"></div>
                <div className="h-4 w-px bg-purple-500/20"></div>
                <div className="h-5 w-24 bg-gradient-to-r from-purple-500/20 to-emerald-500/20 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 bg-slate-500/20 rounded-lg animate-pulse"></div>
                <div className="h-8 w-20 bg-slate-500/20 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Skeleton Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {/* Tournament Info Skeleton */}
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 animate-pulse">
            <div className="h-6 w-48 bg-purple-500/20 rounded mb-2"></div>
            <div className="h-4 w-32 bg-slate-500/20 rounded"></div>
          </div>
          
          {/* Round Tabs Skeleton */}
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-xl p-4 mb-4 animate-pulse">
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-20 bg-emerald-500/20 rounded-lg"></div>
              ))}
            </div>
            <div className="h-10 w-full bg-yellow-500/20 rounded-xl"></div>
          </div>
          
          {/* Matches List Skeleton */}
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-xl p-4 mb-4">
            <div className="h-6 w-32 bg-purple-500/20 rounded mb-4 animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-black/40 border-2 border-purple-500/30 rounded-xl p-4 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 bg-slate-500/20 rounded"></div>
                      <div className="h-6 w-48 bg-slate-500/20 rounded"></div>
                    </div>
                    <div className="h-10 w-24 bg-emerald-500/20 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  const stats = matchStats

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
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-purple-500/20 shadow-lg shadow-purple-500/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 py-2 sm:py-0 sm:h-14">
            {/* Left Side - Navigation */}
            <div className="flex items-center justify-between sm:justify-start">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  href="/admin"
                  className="flex items-center space-x-1.5 text-purple-400 hover:text-purple-300 transition-all group"
                >
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-xs sm:text-sm font-semibold">Back</span>
                </Link>
                <div className="h-4 sm:h-5 w-px bg-purple-500/20"></div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                  <h1 className="text-sm sm:text-base md:text-lg font-black bg-gradient-to-r from-purple-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent">
                    FIXTURES
                  </h1>
                </div>
              </div>
              
              {/* Mobile Quick Stats Badge */}
              {activeTournament && (
                <div className="sm:hidden flex items-center gap-1.5">
                  <button
                    onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-500/20 border border-slate-500/30 rounded-md text-slate-400 text-xs"
                    title="Toggle Stats"
                  >
                    <Trophy className="h-3 w-3" />
                    <span>{stats.completed}/{stats.total}</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Right Side - Quick Actions (Desktop) */}
            {activeTournament && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/40 border border-slate-700/50 rounded-lg">
                  <Trophy className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-emerald-400">{stats.completed}</span>
                  <span className="text-xs text-slate-500">/</span>
                  <span className="text-xs font-bold text-slate-400">{stats.total}</span>
                </div>
                <button
                  onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/30 rounded-lg transition-all text-slate-400 hover:text-slate-300"
                  title={isStatsExpanded ? 'Hide Stats' : 'Show Stats'}
                >
                  {isStatsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  <span className="text-xs font-semibold">Stats</span>
                </button>
                <button
                  onClick={() => activeTournament && fetchMatches(activeTournament.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-all text-purple-400"
                  title="Manually refresh data"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">Refresh</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-500/5 border-2 border-red-500/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-emerald-500/5 border-2 border-emerald-500/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-start space-x-2">
              <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-300 text-sm font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Tournament Info */}
        {activeTournament ? (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
                  {activeTournament.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">Phase {activeTournament.phase}</p>
              </div>
            </div>

            {/* Collapsible Stats */}
            {isStatsExpanded && (
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-blue-400">{stats.total}</p>
                  <p className="text-xs sm:text-sm text-slate-400">Total</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <Check className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400">{stats.completed}</p>
                  <p className="text-xs sm:text-sm text-slate-400">Done</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-yellow-400">{stats.pending}</p>
                  <p className="text-xs sm:text-sm text-slate-400">Pending</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-8 text-center mb-6">
            <Calendar className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent mb-2">
              No Active Tournament
            </h2>
            <p className="text-slate-400 mb-6">Create a tournament and generate fixtures first</p>
            <Link
              href="/admin/tournament"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-purple-500/50"
            >
              <Trophy className="h-5 w-5" />
              <span>GO TO TOURNAMENT</span>
            </Link>
          </div>
        )}

        {/* Round Tabs & Filters */}
        {activeTournament && matches.length > 0 && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-4 md:p-6 mb-6">
            {/* Round Tabs */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-semibold text-white">Rounds</h3>
                <button
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/30 rounded-lg transition-all text-slate-400 hover:text-slate-300"
                  title={isFiltersExpanded ? 'Hide Filters' : 'Show Filters'}
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">{isFiltersExpanded ? 'Hide' : 'Show'} Filters</span>
                  {isFiltersExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueRounds.map(round => {
                  const roundMatches = matches.filter(m => m.round === round)
                  return (
                    <button
                      key={round}
                      onClick={() => setSelectedRound(round.toString())}
                      className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition-all text-sm md:text-base ${
                        selectedRound === round.toString()
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/50'
                          : 'bg-black/40 text-slate-400 hover:bg-black/60 border border-slate-700/50'
                      }`}
                    >
                      <span className="md:hidden">R{round}</span>
                      <span className="hidden md:inline">Round {round}</span>
                      <span className="ml-1 md:ml-2 text-xs opacity-75">({roundMatches.length})</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Share Button for Selected Round */}
            <div className="mb-4">
              <button
                onClick={() => {
                  setShareRound(selectedRound)
                  setIsShareModalOpen(true)
                }}
                className="w-full md:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 md:py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 border border-yellow-500/50 rounded-xl transition-all text-black font-bold shadow-lg shadow-yellow-500/30 text-sm md:text-base"
              >
                <Share2 className="h-4 w-4" />
                <span>Share Round {selectedRound} Fixtures</span>
              </button>
            </div>

            {/* Collapsible Filters */}
            {isFiltersExpanded && (
              <div className="border-t border-slate-700/50 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Pool</label>
                    <select
                      value={selectedPool}
                      onChange={(e) => setSelectedPool(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-black/20 border-2 border-purple-500/30 rounded-xl text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                      className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-black/20 border-2 border-purple-500/30 rounded-xl text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Match Type</label>
                    <select
                      value={selectedAbsentStatus}
                      onChange={(e) => setSelectedAbsentStatus(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 text-sm md:text-base bg-black/20 border-2 border-purple-500/30 rounded-xl text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    >
                      <option value="all">All Types</option>
                      <option value="normal">Normal Matches</option>
                      <option value="wo">WO (Walkover)</option>
                      <option value="null">NULL (Both Absent)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Home Team</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search home..."
                        value={homeTeamSearch}
                        onChange={(e) => setHomeTeamSearch(e.target.value)}
                        className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 text-sm md:text-base bg-black/20 border-2 border-purple-500/30 rounded-xl text-white placeholder-slate-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Away Team</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search away..."
                        value={awayTeamSearch}
                        onChange={(e) => setAwayTeamSearch(e.target.value)}
                        className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 text-sm md:text-base bg-black/20 border-2 border-purple-500/30 rounded-xl text-white placeholder-slate-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Matches List */}
        {activeTournament && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              Matches ({filteredMatches.length})
            </h3>
            
            {filteredMatches.length > 0 ? (
              <div className="space-y-3">
                {filteredMatches.map((match) => {
                  const isRecentlyUpdated = recentlyUpdatedMatches.has(match.id)
                  // Use compound key to force re-render on status change
                  const matchKey = `${match.id}-${match.status}-${match.homeScore}-${match.awayScore}`
                  return (
                  <div
                    key={matchKey}
                    className={`bg-black/40 border-2 rounded-xl p-4 transition-all ${
                      isRecentlyUpdated
                        ? 'border-yellow-400 shadow-lg shadow-yellow-400/50 animate-pulse'
                        : match.status === 'completed' 
                        ? 'border-emerald-500/30 hover:border-emerald-500/50' 
                        : 'border-purple-500/30 hover:border-purple-500/50'
                    }`}
                  >
                    {editingMatchId === match.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs font-bold text-purple-400">
                                R{match.round}
                              </span>
                              {match.pool && (
                                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs font-bold text-blue-400">
                                  Pool {match.pool}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400">{match.homePlayer.name} vs {match.awayPlayer.name}</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-emerald-400 mb-2">
                              🏠 {match.homePlayer.name} Score
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={editHomeScore}
                              onChange={(e) => setEditHomeScore(e.target.value)}
                              placeholder="0"
                              className="w-full px-4 py-2 bg-black/20 border-2 border-emerald-500/30 rounded-lg text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-purple-400 mb-2">
                              ✈️ {match.awayPlayer.name} Score
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={editAwayScore}
                              onChange={(e) => setEditAwayScore(e.target.value)}
                              placeholder="0"
                              className="w-full px-4 py-2 bg-black/20 border-2 border-purple-500/30 rounded-lg text-white placeholder-slate-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={async () => {
                              await saveMatchResultWithAbsent(match.id, null, null, 'both_absent')
                            }}
                            disabled={savingMatchId === match.id}
                            className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/30 rounded-lg transition-all text-slate-300 font-semibold text-sm disabled:opacity-50"
                            title="Both players absent - mark as NULL"
                          >
                            <span>NULL (Both Absent)</span>
                          </button>
                          <button
                            onClick={async () => {
                              await saveMatchResultWithAbsent(match.id, 1, 0, 'away_absent')
                            }}
                            disabled={savingMatchId === match.id}
                            className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition-all text-emerald-400 font-semibold text-sm disabled:opacity-50"
                            title="Home player wins by walkover"
                          >
                            <span>WO Home</span>
                          </button>
                          <button
                            onClick={async () => {
                              await saveMatchResultWithAbsent(match.id, 0, 1, 'home_absent')
                            }}
                            disabled={savingMatchId === match.id}
                            className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-all text-purple-400 font-semibold text-sm disabled:opacity-50"
                            title="Away player wins by walkover"
                          >
                            <span>WO Away</span>
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => saveMatchResult(match.id)}
                            disabled={savingMatchId === match.id}
                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingMatchId === match.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                <span>Save Result</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={savingMatchId === match.id}
                            className="px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 font-semibold rounded-lg transition-all disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
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
                            <div className="flex items-center justify-between sm:justify-start space-x-2">
                              <span className={`text-sm md:text-base lg:text-lg font-bold ${
                                match.winnerId === match.homePlayer.id ? 'text-emerald-400' : 'text-white'
                              }`}>
                                🏠 {match.homePlayer.name}
                              </span>
                              <span className="text-xl md:text-2xl font-black text-emerald-400">
                                {match.homeScore !== null ? match.homeScore : '-'}
                              </span>
                            </div>

                            <span className="text-slate-500 font-bold hidden sm:inline">vs</span>

                            <div className="flex items-center justify-between sm:justify-start space-x-2">
                              <span className="text-xl md:text-2xl font-black text-purple-400">
                                {match.awayScore !== null ? match.awayScore : '-'}
                              </span>
                              <span className={`text-sm md:text-base lg:text-lg font-bold ${
                                match.winnerId === match.awayPlayer.id ? 'text-emerald-400' : 'text-white'
                              }`}>
                                ✈️ {match.awayPlayer.name}
                              </span>
                            </div>
                          </div>

                          {match.winnerId && (
                            <p className="text-xs md:text-sm text-emerald-400 mt-2">
                              Winner: {match.winnerId === match.homePlayer.id ? match.homePlayer.name : match.awayPlayer.name}
                              {match.absentStatus && match.absentStatus !== 'both_absent' ? (
                                <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-xs font-bold">WO</span>
                              ) : null}
                            </p>
                          )}
                          {match.status === 'completed' && match.absentStatus === 'both_absent' && (
                            <p className="text-xs md:text-sm text-slate-400 mt-2">
                              <span className="px-2 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-slate-300 text-xs font-bold">NULL</span>
                              <span className="ml-2">Both players absent</span>
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto md:ml-4">
                          <button
                            onClick={() => startEditMatch(match)}
                            className="flex-1 md:flex-none px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-all text-purple-400 font-semibold text-sm md:text-base"
                          >
                            {match.status === 'completed' ? 'Edit' : 'Enter Result'}
                          </button>
                          
                          {match.status === 'completed' && (
                            <button
                              onClick={() => resetMatchResult(match.id)}
                              disabled={resettingMatchId === match.id}
                              className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg transition-all text-orange-400 font-semibold text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reset match to pending"
                            >
                              {resettingMatchId === match.id ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                                  <span className="text-xs md:text-sm">Resetting...</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                  <span className="text-xs md:text-sm">Reset</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {matches.length === 0 
                    ? 'No matches found. Create matches first in the opponent draw.'
                    : 'No matches match your filter criteria.'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Share Modal - Lazy loaded */}
      {activeTournament && isShareModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-yellow-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        }>
          <FixtureShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            matches={matches.filter(m => m.round === parseInt(shareRound))}
            tournamentName={activeTournament.name}
            selectedRound={shareRound}
          />
        </Suspense>
      )}
    </div>
  )
}
