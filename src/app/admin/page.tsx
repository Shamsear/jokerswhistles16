'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Users, Calendar, CheckSquare, Plus, ArrowRight, LogOut, Settings, RefreshCw, ListTodo, History } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTournament, setActiveTournament] = useState<any>(null)
  const [recentMatches, setRecentMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Initial fetch
  useEffect(() => {
    fetchDashboardData()
  }, [])
  
  // Auto-refresh every 10 seconds for live updates
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchDashboardData(true) // true = silent background fetch
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  const fetchDashboardData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true)
      
      // Optimized fetch - only get active tournament
      const tournamentsResponse = await fetch('/api/tournaments?activeOnly=true', {
        cache: 'default', // Use browser cache
      })
      const tournamentsData = await tournamentsResponse.json()
      
      if (tournamentsData.tournaments && tournamentsData.tournaments.length > 0) {
        const active = tournamentsData.tournaments[0]
        setActiveTournament(active)

        // Fetch recent matches with caching
        const matchesResponse = await fetch(`/api/matches?tournamentId=${active.id}`, {
          cache: isSilent ? 'default' : 'no-cache', // Cache for background refresh
        })
        const matchesData = await matchesResponse.json()
        
        if (matchesData.matches) {
          setRecentMatches(matchesData.matches.slice(0, 5)) // Get first 5 matches
        }
      } else {
        setActiveTournament(null)
        setRecentMatches([])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      if (!isSilent) {
        setLoading(false)
      }
    }
  }

  const handleLogout = () => {
    router.push('/')
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
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-emerald-500/20 shadow-lg shadow-emerald-500/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
              <h1 className="text-sm sm:text-base md:text-lg font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
                ADMIN DASHBOARD
              </h1>
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
              <button
                onClick={() => fetchDashboardData()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-all text-purple-400"
                title="Refresh data"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all text-red-400"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Tournament Status Card */}
        <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          {activeTournament ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent break-words">
                    {activeTournament.name}
                  </h2>
                  <p className="text-slate-400 mt-1 text-sm sm:text-base">Active Tournament</p>
                </div>
                <Link
                  href="/admin/tournament"
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-bold rounded-lg sm:rounded-xl transition-all shadow-xl shadow-purple-500/50 w-full sm:w-auto touch-manipulation"
                >
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">Manage Tournament</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400">{activeTournament._count.players}</p>
                  <p className="text-xs sm:text-sm text-slate-400">Players</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-purple-400">{activeTournament._count.matches}</p>
                  <p className="text-xs sm:text-sm text-slate-400">Matches</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-yellow-400">{activeTournament._count.tasks}</p>
                  <p className="text-xs sm:text-sm text-slate-400">Tasks</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-blue-400">Phase {activeTournament.phase}</p>
                  <p className="text-xs sm:text-sm text-slate-400">Current Phase</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Trophy className="h-16 w-16 sm:h-20 sm:w-20 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-slate-400 mb-2 px-4">No Active Tournament</h2>
              <p className="text-sm sm:text-base text-slate-500 mb-6 px-4">Create a new tournament to get started</p>
              <Link
                href="/admin/tournament"
                className="inline-flex items-center justify-center space-x-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black rounded-lg sm:rounded-xl transition-all shadow-xl shadow-emerald-500/50 w-full max-w-xs sm:w-auto touch-manipulation"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">CREATE TOURNAMENT</span>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Fixtures Card */}
          <Link
            href="/admin/fixtures"
            className="group bg-black/30 backdrop-blur-md border-2 border-purple-500/30 hover:border-purple-500/50 active:border-purple-500/70 rounded-xl sm:rounded-2xl p-5 sm:p-6 transition-all hover:scale-105 active:scale-100 touch-manipulation"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-1 sm:mb-2">Fixtures</h3>
            <p className="text-sm sm:text-base text-slate-400">View and manage match results</p>
          </Link>

          {/* Match Tasks Card */}
          <Link
            href="/admin/match-tasks"
            className="group bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 hover:border-yellow-500/50 active:border-yellow-500/70 rounded-xl sm:rounded-2xl p-5 sm:p-6 transition-all hover:scale-105 active:scale-100 touch-manipulation"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <CheckSquare className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-1 sm:mb-2">Match Tasks</h3>
            <p className="text-sm sm:text-base text-slate-400">Share match task assignment links with players</p>
          </Link>

          {/* Manage Tasks Card */}
          <Link
            href="/admin/tasks"
            className="group bg-black/30 backdrop-blur-md border-2 border-orange-500/30 hover:border-orange-500/50 active:border-orange-500/70 rounded-xl sm:rounded-2xl p-5 sm:p-6 transition-all hover:scale-105 active:scale-100 touch-manipulation"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <ListTodo className="h-10 w-10 sm:h-12 sm:w-12 text-orange-400 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-1 sm:mb-2">Manage Tasks</h3>
            <p className="text-sm sm:text-base text-slate-400">Create and edit tournament tasks</p>
          </Link>

          {/* Leaderboard Card */}
          <Link
            href="/admin/leaderboard"
            className="group bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 hover:border-emerald-500/50 active:border-emerald-500/70 rounded-xl sm:rounded-2xl p-5 sm:p-6 transition-all hover:scale-105 active:scale-100 touch-manipulation"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-400 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-1 sm:mb-2">Leaderboard</h3>
            <p className="text-sm sm:text-base text-slate-400">View standings and share table</p>
          </Link>

          {/* Task History Card */}
          <Link
            href="/admin/task-history"
            className="group bg-black/30 backdrop-blur-md border-2 border-purple-500/30 hover:border-purple-500/50 active:border-purple-500/70 rounded-xl sm:rounded-2xl p-5 sm:p-6 transition-all hover:scale-105 active:scale-100 touch-manipulation"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <History className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-1 sm:mb-2">Task History</h3>
            <p className="text-sm sm:text-base text-slate-400">Track task assignments to players</p>
          </Link>
        </div>

        {/* Knockout Brackets Section */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Admin Knockout Management */}
          <Link
            href="/admin/knockout"
            className="group bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-md border-2 border-yellow-500/30 hover:border-yellow-500/50 active:border-yellow-500/70 rounded-xl sm:rounded-2xl p-6 transition-all hover:scale-105 active:scale-100 touch-manipulation"
          >
            <div className="flex items-center justify-between mb-4">
              <Trophy className="h-14 w-14 text-yellow-400 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-6 w-6 text-yellow-400 opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-2xl font-black text-yellow-400 mb-2">Knockout Stage</h3>
            <p className="text-slate-300">Manage Round of 16, Quarters, Semis, Finals & Mega Final</p>
          </Link>

          {/* Public Brackets View */}
          <Link
            href="/brackets"
            className="group bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md border-2 border-purple-500/30 hover:border-purple-500/50 active:border-purple-500/70 rounded-xl sm:rounded-2xl p-6 transition-all hover:scale-105 active:scale-100 touch-manipulation"
          >
            <div className="flex items-center justify-between mb-4">
              <Trophy className="h-14 w-14 text-purple-400 group-hover:scale-110 transition-transform" />
              <ArrowRight className="h-6 w-6 text-purple-400 opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-2xl font-black text-purple-400 mb-2">View Public Brackets</h3>
            <p className="text-slate-300">See live knockout brackets as participants see them</p>
          </Link>
        </div>

        {/* Recent Fixtures */}
        {recentMatches.length > 0 && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-black text-white">Recent Fixtures</h3>
              <Link
                href="/admin/opponent-draw"
                className="text-emerald-400 hover:text-emerald-300 active:text-emerald-500 text-xs sm:text-sm font-semibold flex items-center space-x-1 touch-manipulation"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {recentMatches.map((match: any) => (
                <div
                  key={match.id}
                  className="bg-black/40 border border-slate-700/30 rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2 sm:px-3 py-1 shrink-0">
                      <p className="text-emerald-400 font-bold text-xs sm:text-sm">R{match.round}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold text-sm sm:text-base truncate">
                        <span className="truncate inline-block max-w-[120px] sm:max-w-none">{match.homePlayer?.name}</span>
                        <span className="text-slate-500 mx-1">vs</span>
                        <span className="truncate inline-block max-w-[120px] sm:max-w-none">{match.awayPlayer?.name}</span>
                      </p>
                      <p className="text-slate-500 text-xs sm:text-sm">Pool {match.pool}</p>
                    </div>
                  </div>
                  <div className="text-slate-400 text-xs sm:text-sm pl-10 sm:pl-0">
                    {match.status === 'completed' ? (
                      <span className="text-emerald-400">✓ Completed</span>
                    ) : (
                      <span>Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
