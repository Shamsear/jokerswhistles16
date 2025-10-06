'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Trophy,
  Medal,
  TrendingUp,
  Loader2,
  AlertCircle,
  Check,
  RefreshCw,
  Share2,
  Download,
  Search,
  X as XIcon
} from 'lucide-react'
import html2canvas from 'html2canvas'

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
  homeScore: number | null
  awayScore: number | null
  status: string
  winnerId: string | null
  homePlayer: Player
  awayPlayer: Player
}

interface LeaderboardEntry {
  player: Player
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  pool: string | null
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Filters
  const [selectedPool, setSelectedPool] = useState<string>('')
  const [playerSearch, setPlayerSearch] = useState('')
  
  // Share modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

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

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh || !activeTournament) return
    
    const interval = setInterval(() => {
      fetchMatches(activeTournament.id, true)
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, activeTournament])

  // Optimized parallel data fetching
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
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatches = useCallback(async (tournamentId: string, isSilent = false) => {
    if (!isSilent) {
      setIsRefreshing(true)
    }
    
    try {
      const response = await fetch(`/api/matches?tournamentId=${tournamentId}`, {
        cache: isSilent ? 'default' : 'no-cache',
      })
      const data = await response.json()
      
      if (response.ok) {
        setMatches(data.matches || [])
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err)
    } finally {
      if (!isSilent) {
        setIsRefreshing(false)
      }
    }
  }, [])

  // Calculate leaderboard
  const leaderboard = useMemo(() => {
    const playerStats = new Map<string, LeaderboardEntry>()
    
    // Initialize all players from matches
    matches.forEach(match => {
      if (!playerStats.has(match.homePlayer.id)) {
        playerStats.set(match.homePlayer.id, {
          player: match.homePlayer,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          pool: match.homePlayer.pool ?? null
        })
      }
      if (!playerStats.has(match.awayPlayer.id)) {
        playerStats.set(match.awayPlayer.id, {
          player: match.awayPlayer,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          pool: match.awayPlayer.pool ?? null
        })
      }
    })
    
    // Calculate stats from completed matches
    matches.filter(m => m.status === 'completed' && m.homeScore !== null && m.awayScore !== null).forEach(match => {
      const homeStats = playerStats.get(match.homePlayer.id)!
      const awayStats = playerStats.get(match.awayPlayer.id)!
      
      homeStats.played++
      awayStats.played++
      
      homeStats.goalsFor += match.homeScore!
      homeStats.goalsAgainst += match.awayScore!
      awayStats.goalsFor += match.awayScore!
      awayStats.goalsAgainst += match.homeScore!
      
      if (match.homeScore! > match.awayScore!) {
        homeStats.won++
        homeStats.points += 3
        awayStats.lost++
      } else if (match.homeScore! < match.awayScore!) {
        awayStats.won++
        awayStats.points += 3
        homeStats.lost++
      } else {
        homeStats.drawn++
        awayStats.drawn++
        homeStats.points += 1
        awayStats.points += 1
      }
      
      homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst
      awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst
    })
    
    // Convert to array and sort
    return Array.from(playerStats.values())
      .sort((a, b) => {
        // Sort by points, then goal difference, then goals for
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
        return b.goalsFor - a.goalsFor
      })
  }, [matches])

  // Filter leaderboard - always filter by selected pool
  const filteredLeaderboard = useMemo(() => {
    let filtered = leaderboard.filter(entry => entry.pool === selectedPool)
    
    if (playerSearch.trim()) {
      filtered = filtered.filter(entry =>
        entry.player.name.toLowerCase().includes(playerSearch.toLowerCase())
      )
    }
    
    return filtered
  }, [leaderboard, selectedPool, playerSearch])

  const uniquePools = useMemo(() => {
    const pools = new Set(leaderboard.map(e => e.pool).filter(p => p !== null))
    return Array.from(pools).sort()
  }, [leaderboard])

  // Auto-select first pool when pools are available
  useEffect(() => {
    if (uniquePools.length > 0 && !selectedPool) {
      setSelectedPool(uniquePools[0] || '')
    }
  }, [uniquePools, selectedPool])

  // Share/Export functions
  const handleShare = async () => {
    setIsGeneratingImage(true)
    
    try {
      // Capture the shareable image container instead
      const element = document.getElementById('shareable-leaderboard-image')
      if (!element) {
        throw new Error('Shareable image container not found')
      }

      await new Promise(resolve => setTimeout(resolve, 800))
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        onclone: (clonedDoc, clonedElement) => {
          // Remove all stylesheets to prevent oklab parsing
          const stylesheets = clonedDoc.querySelectorAll('link[rel="stylesheet"], style')
          stylesheets.forEach((sheet: any) => {
            try {
              sheet.remove()
            } catch (e) {
              // Ignore
            }
          })
          
          // Remove all SVG elements that might have lab() colors
          const svgs = clonedDoc.querySelectorAll('svg')
          svgs.forEach((svg: any) => {
            try {
              svg.remove()
            } catch (e) {
              // Ignore
            }
          })
          
          // Apply inline styles directly to all elements
          const allElements = clonedDoc.querySelectorAll('*')
          allElements.forEach((el: any) => {
            try {
              const className = el.className && typeof el.className === 'string' ? el.className : ''
              
              // Remove backdrop filters
              el.style.backdropFilter = 'none'
              el.style.webkitBackdropFilter = 'none'
              el.style.filter = 'none'
              
              // Handle gradient text
              if (className.includes('bg-gradient') && (className.includes('bg-clip-text') || className.includes('text-transparent'))) {
                el.style.background = '#facc15'
                el.style.backgroundImage = 'none'
                el.style.webkitBackgroundClip = 'text'
                el.style.backgroundClip = 'text'
                el.style.webkitTextFillColor = 'transparent'
                el.style.color = 'transparent'
              }
              // Handle gradient backgrounds
              else if (className.includes('bg-gradient')) {
                el.style.background = '#10b981'
                el.style.backgroundImage = 'none'
              }
              
              // Handle specific color classes
              if (className.includes('text-yellow-400')) el.style.color = '#facc15'
              if (className.includes('text-emerald-400')) el.style.color = '#34d399'
              if (className.includes('text-white')) el.style.color = '#ffffff'
              if (className.includes('text-slate-300')) el.style.color = '#cbd5e1'
              if (className.includes('text-slate-400')) el.style.color = '#94a3b8'
              if (className.includes('text-red-400')) el.style.color = '#f87171'
              if (className.includes('text-blue-400')) el.style.color = '#60a5fa'
              
              // Handle background colors
              if (className.includes('bg-black')) el.style.background = '#000000'
              if (className.includes('bg-emerald-500/5')) el.style.background = 'rgba(16, 185, 129, 0.05)'
              if (className.includes('bg-yellow-500/10')) el.style.background = 'rgba(234, 179, 8, 0.1)'
              if (className.includes('bg-blue-500/20')) el.style.background = 'rgba(59, 130, 246, 0.2)'
              
            } catch (e) {
              // Skip elements that can't be styled
            }
          })
        }
      })
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'leaderboard.png', { type: 'image/png' })
          
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              title: `${activeTournament?.name} - Leaderboard`,
              text: 'Tournament Leaderboard',
              files: [file]
            }).catch(() => {
              downloadImage(canvas)
            })
          } else {
            downloadImage(canvas)
          }
        }
        setIsGeneratingImage(false)
        setIsShareModalOpen(false)
      }, 'image/png')
    } catch (err) {
      console.error('Failed to generate image:', err)
      setError('Failed to generate image')
      setIsGeneratingImage(false)
      setTimeout(() => setError(''), 3000)
    }
  }

  const downloadImage = (canvas: HTMLCanvasElement) => {
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `leaderboard-${Date.now()}.png`
    link.href = url
    link.click()
    setSuccess('Leaderboard downloaded successfully!')
    setTimeout(() => setSuccess(''), 3000)
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
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-yellow-500/20 shadow-lg shadow-yellow-500/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/admin"
                className="flex items-center space-x-1.5 text-yellow-400 hover:text-yellow-300 transition-all group"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs sm:text-sm font-semibold">Back</span>
              </Link>
              <div className="h-4 sm:h-5 w-px bg-yellow-500/20"></div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                <h1 className="text-sm sm:text-base md:text-lg font-black bg-gradient-to-r from-yellow-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent">
                  LEADERBOARD
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all text-xs font-semibold ${
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

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
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
                <p className="text-slate-400 mt-1 text-xs sm:text-sm">Tournament Standings - Phase {activeTournament.phase}</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => activeTournament && fetchMatches(activeTournament.id)}
                  disabled={isRefreshing}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg sm:rounded-xl transition-all text-yellow-400 disabled:opacity-50 touch-manipulation"
                >
                  <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="text-xs sm:text-sm font-semibold">Refresh</span>
                </button>
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-lg sm:rounded-xl transition-all shadow-lg shadow-emerald-500/30 touch-manipulation"
                >
                  <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Share</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-yellow-400">{leaderboard.length}</p>
                <p className="text-xs sm:text-sm text-slate-400">Players</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                  {matches.filter(m => m.status === 'completed').length}
                </p>
                <p className="text-xs sm:text-sm text-slate-400">Completed</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-purple-400">{uniquePools.length || 1}</p>
                <p className="text-xs sm:text-sm text-slate-400">Pools</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center mb-4 sm:mb-6">
            <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-yellow-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent mb-2 px-4">
              No Active Tournament
            </h2>
            <p className="text-slate-400 mb-6 text-sm sm:text-base px-4">Create a tournament first</p>
            <Link
              href="/admin/tournament"
              className="inline-flex items-center justify-center space-x-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg sm:rounded-xl transition-all shadow-xl shadow-yellow-500/50 w-full max-w-xs sm:w-auto touch-manipulation"
            >
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">GO TO TOURNAMENT</span>
            </Link>
          </div>
        )}

        {/* Pool Tabs */}
        {activeTournament && leaderboard.length > 0 && uniquePools.length > 0 && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Select Pool</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {uniquePools.map(pool => (
                <button
                  key={pool}
                  onClick={() => setSelectedPool(pool || '')}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all ${
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
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent mb-3 sm:mb-4">
              Standings ({filteredLeaderboard.length} {filteredLeaderboard.length === 1 ? 'Player' : 'Players'})
            </h3>
            
            {filteredLeaderboard.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <div id="leaderboard-table" className="bg-black/40 rounded-lg sm:rounded-xl overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-700/30">
                      <thead className="bg-black/60">
                        <tr>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                            Pos
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                            Player
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-yellow-400 uppercase tracking-wider hidden sm:table-cell">
                            Pool
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                            P
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-yellow-400 uppercase tracking-wider hidden md:table-cell">
                            W
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-yellow-400 uppercase tracking-wider hidden md:table-cell">
                            D
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-yellow-400 uppercase tracking-wider hidden md:table-cell">
                            L
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-yellow-400 uppercase tracking-wider hidden sm:table-cell">
                            GF
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-yellow-400 uppercase tracking-wider hidden sm:table-cell">
                            GA
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                            GD
                          </th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                            Pts
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30">
                        {filteredLeaderboard.map((entry, index) => {
                          const isTop3 = index < 3
                          const medalColor = index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : 'text-orange-400'
                          
                          return (
                            <tr
                              key={entry.player.id}
                              className={`hover:bg-white/5 transition-colors ${
                                isTop3 ? 'bg-emerald-500/5' : ''
                              }`}
                            >
                              <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  {isTop3 && (
                                    <Medal className={`h-3 w-3 sm:h-4 sm:w-4 ${medalColor}`} />
                                  )}
                                  <span className="text-white font-semibold text-xs sm:text-sm">{index + 1}</span>
                                </div>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                                <p className="text-white font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                                  {entry.player.name}
                                </p>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap hidden sm:table-cell">
                                <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400">
                                  {entry.pool || '-'}
                                </span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                                <span className="text-slate-300 text-xs sm:text-sm">{entry.played}</span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap hidden md:table-cell">
                                <span className="text-emerald-400 text-xs sm:text-sm">{entry.won}</span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap hidden md:table-cell">
                                <span className="text-yellow-400 text-xs sm:text-sm">{entry.drawn}</span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap hidden md:table-cell">
                                <span className="text-red-400 text-xs sm:text-sm">{entry.lost}</span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap hidden sm:table-cell">
                                <span className="text-slate-300 text-xs sm:text-sm">{entry.goalsFor}</span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap hidden sm:table-cell">
                                <span className="text-slate-300 text-xs sm:text-sm">{entry.goalsAgainst}</span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                                <span className={`font-semibold text-xs sm:text-sm ${
                                  entry.goalDifference > 0 ? 'text-emerald-400' : 
                                  entry.goalDifference < 0 ? 'text-red-400' : 'text-slate-400'
                                }`}>
                                  {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
                                </span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                                <span className="font-bold text-yellow-400 text-sm sm:text-base">{entry.points}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-sm sm:text-base px-4">
                  {playerSearch || selectedPool !== 'all'
                    ? 'No players match your filter criteria.'
                    : 'No matches played yet.'}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-black/90 border-2 border-yellow-500/30 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Share Leaderboard</h3>
            <p className="text-slate-400 text-sm mb-6">
              Generate and share the current leaderboard standings as an image.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                disabled={isGeneratingImage}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-5 w-5" />
                    <span>Share/Download</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setIsShareModalOpen(false)}
                disabled={isGeneratingImage}
                className="px-4 py-3 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Shareable Image Container - Professional Layout */}
      <div 
        id="shareable-leaderboard-image" 
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '1200px',
          background: 'white',
          padding: '40px',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '10px', letterSpacing: '2px' }}>
            SOUTH SOCCER'S PRESENTS
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: '900', margin: '0', lineHeight: '1' }}>
            <span style={{ color: '#facc15' }}>DUO</span>
            <span style={{ color: '#000', marginLeft: '15px' }}>Tournament</span>
          </h1>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            {activeTournament?.name || 'Tournament Standings'}
          </div>
        </div>

        {/* Tables by Pool */}
        {uniquePools.length > 0 && selectedPool !== 'all' ? (
          // Show only selected pool
          (() => {
            const poolEntries = filteredLeaderboard
            return (
              <div key={selectedPool} style={{ marginBottom: '40px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  marginBottom: '15px',
                  color: '#000',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  GROUP {selectedPool}
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>Rank</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>Team</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>P</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>MP</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>W</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>D</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>L</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>F</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>A</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>GD</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>%</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>EP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poolEntries.map((entry, index) => (
                      <tr key={entry.player.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #e5e5e5' }}>
                        <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '50%', 
                              background: index === 0 ? '#1e40af' : index === 1 ? '#1e40af' : index === 2 ? '#1e40af' : '#64748b',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {index + 1}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#e5e5e5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#666'
                            }}>
                              {entry.player.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', textTransform: 'uppercase' }}>
                              {entry.player.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{entry.points}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.played}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.won}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.drawn}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.lost}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.goalsFor}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.goalsAgainst}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: entry.goalDifference > 0 ? '#16a34a' : entry.goalDifference < 0 ? '#dc2626' : '#666' }}>
                          {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>0</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })()
        ) : uniquePools.length > 0 ? (
          // Show all pools when 'all' is selected
          uniquePools.map(pool => {
            const poolEntries = leaderboard.filter(e => e.pool === pool)
            return (
              <div key={pool} style={{ marginBottom: '40px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  marginBottom: '15px',
                  color: '#000',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  GROUP {pool}
                </h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>Rank</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>Team</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>P</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>MP</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>W</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>D</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>L</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>F</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>A</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>GD</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>%</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>EP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poolEntries.map((entry, index) => (
                      <tr key={entry.player.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #e5e5e5' }}>
                        <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '50%', 
                              background: index === 0 ? '#1e40af' : index === 1 ? '#1e40af' : index === 2 ? '#1e40af' : '#64748b',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {index + 1}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: '#e5e5e5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: '#666'
                            }}>
                              {entry.player.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', textTransform: 'uppercase' }}>
                              {entry.player.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{entry.points}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.played}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.won}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.drawn}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.lost}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.goalsFor}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.goalsAgainst}</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: entry.goalDifference > 0 ? '#16a34a' : entry.goalDifference < 0 ? '#dc2626' : '#666' }}>
                          {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>0</td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>0</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })
        ) : (
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>
              ALL PLAYERS
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>Rank</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>Team</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>P</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>MP</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>W</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>D</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>L</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>F</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>A</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>GD</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>%</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase' }}>EP</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={entry.player.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #e5e5e5' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '50%', 
                          background: index === 0 ? '#1e40af' : index === 1 ? '#1e40af' : index === 2 ? '#1e40af' : '#64748b',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#e5e5e5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#666'
                        }}>
                          {entry.player.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', textTransform: 'uppercase' }}>
                          {entry.player.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{entry.points}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.played}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.won}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.drawn}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.lost}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.goalsFor}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>{entry.goalsAgainst}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: entry.goalDifference > 0 ? '#16a34a' : entry.goalDifference < 0 ? '#dc2626' : '#666' }}>
                      {entry.goalDifference > 0 ? '+' : ''}{entry.goalDifference}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>0</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
