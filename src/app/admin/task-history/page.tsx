'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  History,
  Trophy,
  Loader2,
  AlertCircle,
  Check,
  RotateCcw,
  Trash2,
  RefreshCw
} from 'lucide-react'

interface Tournament {
  id: string
  name: string
  phase: number
  isActive: boolean
}

interface Task {
  id: string
  name: string
  homeDescription: string
  awayDescription: string
}

interface Player {
  id: string
  name: string
  pool?: string | null
}

interface TaskAssignment {
  taskId: string
  task: Task
  players: Player[]
}

export default function TaskHistoryPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resettingHistory, setResettingHistory] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
      fetchData()
    }
  }, [isAuthenticated])

  const fetchData = async () => {
    setIsRefreshing(true)
    try {
      // Fetch active tournament
      const tournamentResponse = await fetch('/api/tournaments', {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const tournamentData = await tournamentResponse.json()
      
      if (tournamentResponse.ok) {
        const active = tournamentData.tournaments.find((t: Tournament) => t.isActive)
        setActiveTournament(active || null)

        if (active) {
          // Fetch all tasks
          const tasksResponse = await fetch(`/api/tasks?tournamentId=${active.id}`)
          const tasksData = await tasksResponse.json()
          
          if (tasksResponse.ok) {
            setTasks(tasksData.tasks || [])
          }

          // Fetch all players
          const playersResponse = await fetch(`/api/players?tournamentId=${active.id}`)
          const playersData = await playersResponse.json()
          
          // Fetch task assignments for all players
          const assignmentsMap = new Map<string, Player[]>()

          if (playersResponse.ok && playersData.players) {
            for (const player of playersData.players) {
              const historyResponse = await fetch(`/api/player-task-history?playerId=${player.id}`)
              const historyData = await historyResponse.json()
              
              if (historyData.history && historyData.history.taskIds) {
                historyData.history.taskIds.forEach((taskId: string) => {
                  if (!assignmentsMap.has(taskId)) {
                    assignmentsMap.set(taskId, [])
                  }
                  assignmentsMap.get(taskId)!.push(player)
                })
              }
            }
          }

          // Build task assignments array
          const assignments: TaskAssignment[] = tasksData.tasks.map((task: Task) => ({
            taskId: task.id,
            task: task,
            players: assignmentsMap.get(task.id) || []
          }))

          setTaskAssignments(assignments)
        }
      } else {
        setError(tournamentData.error || 'Failed to fetch tournament')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const resetAllTaskHistory = async () => {
    if (!activeTournament) return

    if (!confirm(
      '⚠️ WARNING: This will reset ALL task history for ALL players in this tournament!\n\n' +
      'This means:\n' +
      '• All task assignments will be deleted\n' +
      '• All match task links will become active again\n' +
      '• Players can receive tasks they\'ve previously had\n\n' +
      'Are you absolutely sure you want to proceed?'
    )) {
      return
    }

    setResettingHistory(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/player-task-history?tournamentId=${activeTournament.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`✅ All task history reset successfully! ${data.deletedCount} records deleted.`)
        await fetchData()
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError(data.error || 'Failed to reset task history')
        setTimeout(() => setError(''), 3000)
      }
    } catch (err) {
      setError('Failed to connect to server')
      setTimeout(() => setError(''), 3000)
    } finally {
      setResettingHistory(false)
    }
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
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Link
                href="/admin"
                className="flex items-center space-x-1 sm:space-x-2 text-purple-400 hover:text-purple-300 transition-all shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Back</span>
              </Link>
              <div className="h-4 sm:h-6 w-px bg-purple-500/20 shrink-0"></div>
              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 shrink-0" />
                <h1 className="text-xs sm:text-sm md:text-lg font-black bg-gradient-to-r from-purple-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent truncate">
                  TASK HISTORY
                </h1>
              </div>
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
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent break-words">
                  {activeTournament.name}
                </h2>
                <p className="text-slate-400 mt-1 text-xs sm:text-sm">Track which tasks have been assigned to each player</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={fetchData}
                  disabled={isRefreshing}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg sm:rounded-xl transition-all text-purple-400 disabled:opacity-50 touch-manipulation"
                >
                  <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="text-xs sm:text-sm font-semibold">Refresh</span>
                </button>
                <button
                  onClick={resetAllTaskHistory}
                  disabled={resettingHistory}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg sm:rounded-xl transition-all text-red-400 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  title="Reset all task history for this tournament"
                >
                  {resettingHistory ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                  <span className="text-xs sm:text-sm font-semibold">Reset All History</span>
                </button>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <p className="text-blue-300 text-xs sm:text-sm">
                <strong>📊 Task Tracking:</strong> This page shows which players have been assigned each task. Once a player receives a task, they won't get it again in future matches. Use "Reset All History" to clear all assignments and start fresh.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center mb-4 sm:mb-6">
            <History className="h-12 w-12 sm:h-16 sm:w-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent mb-2 px-4">
              No Active Tournament
            </h2>
            <p className="text-slate-400 mb-6 text-sm sm:text-base px-4">Create a tournament first</p>
            <Link
              href="/admin/tournament"
              className="inline-flex items-center justify-center space-x-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-bold rounded-lg sm:rounded-xl transition-all shadow-xl shadow-purple-500/50 w-full max-w-xs sm:w-auto touch-manipulation"
            >
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">GO TO TOURNAMENT</span>
            </Link>
          </div>
        )}

        {/* Task History Table */}
        {activeTournament && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-3 sm:mb-4">
              Task Assignment Status
            </h3>
            
            {tasks.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {taskAssignments.map((assignment) => (
                  <div
                    key={assignment.taskId}
                    className="bg-black/40 border-2 border-purple-500/30 hover:border-purple-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-3">
                      <div className="flex-1 w-full min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <h4 className="text-base sm:text-lg font-bold text-white break-words">
                            {assignment.task.name}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            assignment.players.length === 0
                              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                              : 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                          }`}>
                            {assignment.players.length === 0 ? '✓ Available' : `${assignment.players.length} Assigned`}
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-2 mb-3">
                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
                            <p className="text-xs font-semibold text-emerald-400 mb-1">🏠 Home Player:</p>
                            <p className="text-slate-300 text-xs">{assignment.task.homeDescription}</p>
                          </div>
                          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                            <p className="text-xs font-semibold text-purple-400 mb-1">✈️ Away Player:</p>
                            <p className="text-slate-300 text-xs">{assignment.task.awayDescription}</p>
                          </div>
                        </div>

                        {assignment.players.length > 0 && (
                          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2">
                            <p className="text-xs font-semibold text-slate-400 mb-1.5">Assigned to Players:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {assignment.players.map((player) => (
                                <span
                                  key={player.id}
                                  className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300"
                                >
                                  {player.name}
                                  {player.pool && <span className="text-slate-500 ml-1">({player.pool})</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <History className="h-12 w-12 sm:h-16 sm:w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-sm sm:text-base px-4">
                  No tasks found. Create tasks first in the tournament settings.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
