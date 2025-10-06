'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users, Loader2, Check, AlertCircle, Shuffle, RefreshCw } from 'lucide-react'

interface Player {
  id: string
  name: string
  pool: string | null
}

export default function PoolAssignmentPage() {
  const router = useRouter()
  const [tournament, setTournament] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [poolA, setPoolA] = useState<Player[]>([])
  const [poolB, setPoolB] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchTournamentData()
  }, [])

  // Auto-refresh every 10 seconds for live updates
  useEffect(() => {
    if (!autoRefresh || loading || !tournament) return
    
    const interval = setInterval(() => {
      fetchTournamentData()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, loading, tournament])

  const fetchTournamentData = async () => {
    try {
      const response = await fetch('/api/tournaments')
      const data = await response.json()
      
      if (response.ok) {
        const activeTournament = data.tournaments.find((t: any) => t.isActive)
        
        if (!activeTournament) {
          setError('No active tournament found')
          setLoading(false)
          return
        }

        if (activeTournament.phase !== 1) {
          setError('Tournament must be in Phase 1 for pool assignment')
          setLoading(false)
          return
        }

        setTournament(activeTournament)
        
        // Separate players by pool
        const poolAPlayers = activeTournament.players.filter((p: Player) => p.pool === 'A')
        const poolBPlayers = activeTournament.players.filter((p: Player) => p.pool === 'B')
        const unassigned = activeTournament.players.filter((p: Player) => !p.pool)
        
        setPoolA(poolAPlayers)
        setPoolB(poolBPlayers)
        setPlayers(unassigned)
        setLoading(false)
      } else {
        setError(data.error || 'Failed to fetch tournament')
        setLoading(false)
      }
    } catch (err) {
      setError('Failed to connect to server')
      setLoading(false)
    }
  }

  const randomAssignment = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5)
    const mid = Math.floor(shuffled.length / 2)
    
    setPoolA([...poolA, ...shuffled.slice(0, mid)])
    setPoolB([...poolB, ...shuffled.slice(mid)])
    setPlayers([])
  }

  const moveToPool = (player: Player, targetPool: 'A' | 'B') => {
    setPlayers(players.filter(p => p.id !== player.id))
    
    if (targetPool === 'A') {
      setPoolA([...poolA, player])
    } else {
      setPoolB([...poolB, player])
    }
  }

  const removeFromPool = (player: Player, fromPool: 'A' | 'B') => {
    if (fromPool === 'A') {
      setPoolA(poolA.filter(p => p.id !== player.id))
    } else {
      setPoolB(poolB.filter(p => p.id !== player.id))
    }
    setPlayers([...players, player])
  }

  const savePoolAssignments = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Update all players with their pool assignments
      const updates = [
        ...poolA.map(p => ({ id: p.id, pool: 'A' })),
        ...poolB.map(p => ({ id: p.id, pool: 'B' }))
      ]

      for (const update of updates) {
        const response = await fetch(`/api/players/${update.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pool: update.pool })
        })
        
        if (!response.ok) {
          throw new Error('Failed to update player')
        }
      }

      setSuccess('Pool assignments saved successfully! Redirecting...')
      setLoading(false)
      
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/admin')
      }, 1000)
    } catch (err) {
      setError('Failed to save pool assignments')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2 text-emerald-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg font-semibold">Loading tournament...</span>
        </div>
      </div>
    )
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/60 backdrop-blur-xl border-2 border-emerald-500/30 rounded-2xl p-8 max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-center bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent mb-2">Error</h2>
          <p className="text-center text-slate-400 mb-6">{error}</p>
          <Link
            href="/admin"
            className="block w-full text-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl transition-all shadow-xl shadow-emerald-500/50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const totalPlayers = tournament?.players.length || 0
  const isBalanced = Math.abs(poolA.length - poolB.length) <= 1
  const canSave = players.length === 0 && poolA.length > 0 && poolB.length > 0

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background with Logo Pattern */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Large faded logo background */}
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
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Link
                href="/admin"
                className="flex items-center space-x-1 sm:space-x-2 text-emerald-400 hover:text-emerald-300 transition-all shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Back</span>
              </Link>
              <div className="h-4 sm:h-6 w-px bg-emerald-500/20 shrink-0"></div>
              <h1 className="text-xs sm:text-sm md:text-lg font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent truncate">POOL ASSIGNMENT</h1>
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
              <p className="text-red-300 text-xs sm:text-sm font-medium break-words">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 sm:mb-6 bg-emerald-500/5 border-2 border-emerald-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
            <div className="flex items-start space-x-2">
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-300 text-xs sm:text-sm font-medium break-words">{success}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 hover:border-emerald-500/50 transition-all">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-black bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent mb-2">Divide Players into 2 Pools</h2>
          <p className="text-slate-400 mb-4 text-xs sm:text-sm">
            Assign players to Pool A and Pool B. Each pool will play separately until the finals.
          </p>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-slate-400">Total Players: <span className="font-semibold text-white">{totalPlayers}</span></p>
              <p className="text-xs sm:text-sm text-slate-400">
                Balance: {isBalanced ? 
                  <span className="text-emerald-400 font-semibold">✓ Balanced</span> : 
                  <span className="text-yellow-400 font-semibold">⚠ Unbalanced</span>
                }
              </p>
            </div>
            
            {players.length > 0 && (
              <button
                onClick={randomAssignment}
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl transition-all shadow-xl shadow-purple-500/50 w-full sm:w-auto touch-manipulation"
              >
                <Shuffle className="h-4 w-4" />
                <span>RANDOM ASSIGN</span>
              </button>
            )}
          </div>
        </div>

        {/* Pools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Unassigned Players */}
          {players.length > 0 && (
            <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-yellow-500/50 transition-all">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                <h3 className="font-bold text-yellow-400 text-sm sm:text-base">Unassigned ({players.length})</h3>
              </div>
              <div className="space-y-2">
                {players.map(player => (
                  <div key={player.id} className="flex items-center justify-between p-2 sm:p-3 bg-black/20 border border-slate-700/30 rounded-lg sm:rounded-xl hover:border-yellow-500/30 transition-all">
                    <span className="text-xs sm:text-sm font-medium text-white truncate mr-2">{player.name}</span>
                    <div className="flex space-x-1 shrink-0">
                      <button
                        onClick={() => moveToPool(player, 'A')}
                        className="px-2 sm:px-3 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-black font-bold rounded-lg transition-all touch-manipulation"
                      >
                        →A
                      </button>
                      <button
                        onClick={() => moveToPool(player, 'B')}
                        className="px-2 sm:px-3 py-1 text-xs bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white font-bold rounded-lg transition-all touch-manipulation"
                      >
                        →B
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pool A */}
          <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-emerald-500/50 transition-all">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
              <h3 className="font-bold text-emerald-400 text-sm sm:text-base">Pool A ({poolA.length})</h3>
            </div>
            <div className="space-y-2">
              {poolA.map(player => (
                <div key={player.id} className="flex items-center justify-between p-2 sm:p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg sm:rounded-xl hover:border-emerald-500/50 transition-all">
                  <span className="text-xs sm:text-sm font-medium text-white truncate mr-2">{player.name}</span>
                  <button
                    onClick={() => removeFromPool(player, 'A')}
                    className="text-xs text-red-400 hover:text-red-300 active:text-red-200 font-semibold shrink-0 touch-manipulation"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {poolA.length === 0 && (
                <p className="text-xs sm:text-sm text-slate-500 italic text-center py-4">No players assigned</p>
              )}
            </div>
          </div>

          {/* Pool B */}
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
              <h3 className="font-bold text-purple-400 text-sm sm:text-base">Pool B ({poolB.length})</h3>
            </div>
            <div className="space-y-2">
              {poolB.map(player => (
                <div key={player.id} className="flex items-center justify-between p-2 sm:p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg sm:rounded-xl hover:border-purple-500/50 transition-all">
                  <span className="text-xs sm:text-sm font-medium text-white truncate mr-2">{player.name}</span>
                  <button
                    onClick={() => removeFromPool(player, 'B')}
                    className="text-xs text-red-400 hover:text-red-300 active:text-red-200 font-semibold shrink-0 touch-manipulation"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {poolB.length === 0 && (
                <p className="text-xs sm:text-sm text-slate-500 italic text-center py-4">No players assigned</p>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-emerald-500/50 transition-all">
          <button
            onClick={savePoolAssignments}
            disabled={!canSave}
            className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:from-emerald-600 active:to-emerald-700 text-black font-black text-sm sm:text-base lg:text-lg rounded-lg sm:rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/50 touch-manipulation"
          >
            <span className="hidden sm:inline">{canSave ? 'SAVE POOL ASSIGNMENTS & CONTINUE' : 'ASSIGN ALL PLAYERS TO POOLS TO CONTINUE'}</span>
            <span className="sm:hidden">{canSave ? 'SAVE & CONTINUE' : 'ASSIGN ALL PLAYERS FIRST'}</span>
          </button>
          {!isBalanced && poolA.length > 0 && poolB.length > 0 && (
            <p className="text-xs sm:text-sm text-yellow-400 text-center mt-3 font-semibold">
              ⚠ Pools are unbalanced. Consider redistributing players for fairness.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
