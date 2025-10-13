'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Trophy, Loader2, Crown, RefreshCw, Calendar } from 'lucide-react'

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
  knockoutStage: string | null
  pool: string | null
  homeScore: number | null
  awayScore: number | null
  status: string
  winnerId: string | null
  homePlayer: Player
  awayPlayer: Player
}

export default function PublicBracketsPage() {
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!autoRefresh || !activeTournament) return
    
    const interval = setInterval(() => {
      fetchKnockoutMatches(activeTournament.id)
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, activeTournament])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tournaments?activeOnly=true')
      const data = await response.json()
      
      if (response.ok && data.tournaments[0]) {
        setActiveTournament(data.tournaments[0])
        await fetchKnockoutMatches(data.tournaments[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchKnockoutMatches = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/knockout?tournamentId=${tournamentId}`)
      const data = await response.json()
      
      if (response.ok) {
        setKnockoutMatches(data.matches || [])
      }
    } catch (err) {
      console.error('Failed to fetch knockout matches:', err)
    }
  }

  const getStageMatches = (stage: string, pool: string | null = null) => {
    return knockoutMatches.filter(m => 
      m.knockoutStage === stage && 
      (pool === null || m.pool === pool)
    )
  }

  const renderMatch = (match: Match | null, isPlaceholder = false) => {
    if (!match) {
      return (
        <div className="bg-black/20 border-2 border-slate-700/30 rounded-lg p-3 text-center">
          <span className="text-slate-600 text-sm">TBD</span>
        </div>
      )
    }

    return (
      <div className={`bg-black/40 border-2 rounded-lg p-3 transition-all ${
        match.status === 'completed'
          ? 'border-emerald-500/30 hover:border-emerald-500/50'
          : 'border-yellow-500/30 hover:border-yellow-500/50'
      }`}>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold truncate ${
              match.winnerId === match.homePlayer.id ? 'text-emerald-400' : 'text-white'
            }`}>
              {match.homePlayer.name}
            </span>
            <span className="text-lg font-black text-emerald-400">
              {match.homeScore !== null ? match.homeScore : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-bold truncate ${
              match.winnerId === match.awayPlayer.id ? 'text-emerald-400' : 'text-white'
            }`}>
              {match.awayPlayer.name}
            </span>
            <span className="text-lg font-black text-purple-400">
              {match.awayScore !== null ? match.awayScore : '-'}
            </span>
          </div>
        </div>
        {match.status === 'pending' && (
          <div className="mt-2 text-center">
            <span className="text-xs text-yellow-400">Pending</span>
          </div>
        )}
      </div>
    )
  }

  const renderBracket = (pool: string) => {
    const roundOf16 = getStageMatches('round_of_16', pool)
    const quarterFinals = getStageMatches('quarter_final', pool)
    const semiFinals = getStageMatches('semi_final', pool)
    const groupFinal = getStageMatches('group_final', pool)[0]

    return (
      <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6 text-center">
          Pool {pool} Bracket
        </h3>
        
        <div className="grid grid-cols-4 gap-4">
          {/* Round of 16 */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-purple-400 text-center mb-3">Round of 16</h4>
            {roundOf16.length > 0 ? (
              roundOf16.map(match => (
                <div key={match.id} className="mb-4">
                  {renderMatch(match)}
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm text-center">Not started</p>
            )}
          </div>

          {/* Quarter Finals */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-purple-400 text-center mb-3">Quarter Finals</h4>
            {quarterFinals.length > 0 ? (
              quarterFinals.map(match => (
                <div key={match.id} className="mb-8">
                  {renderMatch(match)}
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm text-center">Pending</p>
            )}
          </div>

          {/* Semi Finals */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-purple-400 text-center mb-3">Semi Finals</h4>
            {semiFinals.length > 0 ? (
              semiFinals.map(match => (
                <div key={match.id} className="mb-16">
                  {renderMatch(match)}
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm text-center">Pending</p>
            )}
          </div>

          {/* Group Final */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-purple-400 text-center mb-3">Final</h4>
            {groupFinal ? (
              <div className="mt-8">
                {renderMatch(groupFinal)}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center mt-8">Pending</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderMegaFinal = () => {
    const megaFinal = getStageMatches('mega_final')[0]
    
    if (!megaFinal) {
      return (
        <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-2xl p-8 text-center">
          <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
            MEGA FINAL
          </h3>
          <p className="text-slate-400">Complete group finals to unlock mega final</p>
        </div>
      )
    }

    return (
      <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-2xl p-8">
        <div className="text-center mb-6">
          <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
          <h3 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
            MEGA FINAL
          </h3>
          <p className="text-yellow-400 font-semibold">Championship Match</p>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className={`bg-black/40 border-2 rounded-xl p-6 ${
            megaFinal.status === 'completed'
              ? 'border-yellow-500/50'
              : 'border-yellow-500/30'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs font-bold text-blue-400">
                    Pool A Winner
                  </span>
                  <span className={`text-lg font-bold ${
                    megaFinal.winnerId === megaFinal.homePlayer.id ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {megaFinal.homePlayer.name}
                  </span>
                </div>
                <span className="text-3xl font-black text-yellow-400">
                  {megaFinal.homeScore !== null ? megaFinal.homeScore : '-'}
                </span>
              </div>
              
              <div className="border-t border-slate-700/50 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs font-bold text-purple-400">
                      Pool B Winner
                    </span>
                    <span className={`text-lg font-bold ${
                      megaFinal.winnerId === megaFinal.awayPlayer.id ? 'text-yellow-400' : 'text-white'
                    }`}>
                      {megaFinal.awayPlayer.name}
                    </span>
                  </div>
                  <span className="text-3xl font-black text-orange-400">
                    {megaFinal.awayScore !== null ? megaFinal.awayScore : '-'}
                  </span>
                </div>
              </div>
            </div>

            {megaFinal.winnerId && (
              <div className="mt-6 text-center py-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-yellow-400 font-bold text-lg">
                  🏆 CHAMPION: {megaFinal.winnerId === megaFinal.homePlayer.id ? megaFinal.homePlayer.name : megaFinal.awayPlayer.name}
                </p>
              </div>
            )}

            {megaFinal.status === 'pending' && (
              <div className="mt-4 text-center">
                <span className="text-sm text-yellow-400">Match Pending</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Image src="/logo.png" alt="Background" width={600} height={600} className="animate-spin-slow" style={{ animationDuration: '60s' }} priority={false} loading="lazy" quality={50} />
        </div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-all">
                <Home className="h-4 w-4" />
                <span className="text-sm font-semibold">Home</span>
              </Link>
              <div className="h-6 w-px bg-purple-500/20"></div>
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-purple-400" />
                <h1 className="text-lg font-black bg-gradient-to-r from-purple-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent">
                  KNOCKOUT BRACKETS
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
                  autoRefresh 
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' 
                    : 'bg-slate-500/20 border border-slate-500/30 text-slate-400'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${
                  autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}></div>
                <span>Live</span>
              </button>
              <button
                onClick={() => activeTournament && fetchKnockoutMatches(activeTournament.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl transition-all text-purple-400 text-sm font-semibold"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Tournament Info */}
        {activeTournament ? (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2">
              {activeTournament.name}
            </h2>
            <p className="text-slate-400">Live Knockout Stage Brackets</p>
          </div>
        ) : (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-8 text-center mb-8">
            <Calendar className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent mb-2">
              No Active Tournament
            </h2>
            <p className="text-slate-400">Check back later for knockout brackets</p>
          </div>
        )}

        {/* Brackets */}
        {activeTournament && knockoutMatches.length > 0 ? (
          <div className="space-y-8">
            {/* Pool A Bracket */}
            {renderBracket('A')}

            {/* Pool B Bracket */}
            {renderBracket('B')}

            {/* Mega Final */}
            {renderMegaFinal()}
          </div>
        ) : activeTournament ? (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-12 text-center">
            <Trophy className="h-20 w-20 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">Knockout Stage Not Started</h3>
            <p className="text-slate-500">Pool matches must be completed first</p>
          </div>
        ) : null}
      </main>
    </div>
  )
}
