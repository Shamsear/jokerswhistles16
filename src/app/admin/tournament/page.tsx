'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Users, 
  Settings, 
  Trophy, 
  Plus, 
  Copy, 
  Check,
  Loader2,
  AlertCircle,
  Gamepad2,
  X,
  LogOut,
  Edit2,
  RefreshCw
} from 'lucide-react'

interface Tournament {
  id: string
  name: string
  description?: string
  phase: number
  isActive: boolean
  createdAt: string
  players?: Array<{ id: string; name: string; pool?: string | null }>
  matches?: any[]
  tasks?: any[]
  _count: {
    players: number
    matches: number
    tasks: number
  }
}

interface Player {
  id: string
  name: string
  email?: string
}

interface RegistrationLink {
  id: string
  token: string
  isActive: boolean
  createdAt: string
}

interface Task {
  id: string
  name: string
  homeDescription: string
  awayDescription: string
  isActive: boolean
  createdAt: string
}

const phaseDescriptions = {
  1: 'Player Registration & Pool Assignment',
  2: 'Task Pool Creation',
  3: 'Match Execution & Results'
}

export default function AdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [registrationLinks, setRegistrationLinks] = useState<RegistrationLink[]>([])
  const [loading, setLoading] = useState(true)
  const [bulkNames, setBulkNames] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskName, setNewTaskName] = useState('')
  const [newHomeDescription, setNewHomeDescription] = useState('')
  const [newAwayDescription, setNewAwayDescription] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskName, setEditTaskName] = useState('')
  const [editHomeDescription, setEditHomeDescription] = useState('')
  const [editAwayDescription, setEditAwayDescription] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Check authentication
  useEffect(() => {
    const auth = sessionStorage.getItem('adminAuth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    } else {
      router.push('/admin/login')
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchTournaments()
    }
  }, [isAuthenticated])

  // Auto-refresh every 10 seconds for live updates
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return
    
    const interval = setInterval(() => {
      fetchTournaments() // Silent background fetch
      if (activeTournament) {
        fetchRegistrationLinks(activeTournament.id)
        if (activeTournament.phase >= 2) {
          fetchTasks(activeTournament.id)
        }
      }
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, isAuthenticated, activeTournament])

  useEffect(() => {
    if (activeTournament) {
      fetchRegistrationLinks(activeTournament.id)
      if (activeTournament.phase >= 2) {
        fetchTasks(activeTournament.id)
      }
    }
  }, [activeTournament])

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments')
      const data = await response.json()
      
      if (response.ok) {
        setTournaments(data.tournaments)
        const active = data.tournaments.find((t: Tournament) => t.isActive)
        setActiveTournament(active || data.tournaments[0] || null)
      } else {
        setError(data.error || 'Failed to fetch tournaments')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const fetchRegistrationLinks = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/registration-links?tournamentId=${tournamentId}`)
      const data = await response.json()
      
      if (response.ok) {
        setRegistrationLinks(data.registrationLinks)
      }
    } catch (err) {
      console.error('Failed to fetch registration links:', err)
    }
  }

  const fetchTasks = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tasks?tournamentId=${tournamentId}`)
      const data = await response.json()
      
      if (response.ok) {
        setTasks(data.tasks)
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    }
  }

  const createTournament = async () => {
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "The Joker's Whistle Tournament",
          description: 'A comprehensive tournament with spinning wheel mechanics'
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess('Tournament created successfully!')
        fetchTournaments()
      } else {
        setError(data.error || 'Failed to create tournament')
      }
    } catch (err) {
      setError('Failed to create tournament')
    }
  }

  const updateTournamentPhase = async (phase: number) => {
    if (!activeTournament) return

    try {
      const response = await fetch(`/api/tournaments/${activeTournament.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phase })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(`Tournament moved to phase ${phase}`)
        // Update active tournament with the response data (includes updated phase)
        setActiveTournament(data.tournament)
        // Also update the tournaments list
        setTournaments(prev => prev.map(t => 
          t.id === data.tournament.id ? data.tournament : t
        ))
      } else {
        setError(data.error || 'Failed to update tournament phase')
      }
    } catch (err) {
      setError('Failed to update tournament phase')
    }
  }

  const generateRegistrationLink = async () => {
    if (!activeTournament) return

    try {
      const response = await fetch('/api/registration-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tournamentId: activeTournament.id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess('Registration link created!')
        fetchRegistrationLinks(activeTournament.id)
      } else {
        setError(data.error || 'Failed to create registration link')
      }
    } catch (err) {
      setError('Failed to create registration link')
    }
  }

  const bulkAddPlayers = async () => {
    if (!activeTournament || !bulkNames.trim()) return

    const names = bulkNames.split('\n').map(name => name.trim()).filter(name => name.length > 0)
    
    try {
      const response = await fetch('/api/players/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          names,
          tournamentId: activeTournament.id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(`Successfully added ${data.players.length} players!`)
        setBulkNames('')
        fetchTournaments()
      } else {
        setError(data.error || 'Failed to add players')
      }
    } catch (err) {
      setError('Failed to add players')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const addTask = async () => {
    if (!activeTournament || !newTaskName.trim() || !newHomeDescription.trim() || !newAwayDescription.trim()) return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newTaskName.trim(),
          homeDescription: newHomeDescription.trim(),
          awayDescription: newAwayDescription.trim(),
          tournamentId: activeTournament.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Task added successfully!`)
        setNewTaskName('')
        setNewHomeDescription('')
        setNewAwayDescription('')
        fetchTasks(activeTournament.id)
      } else {
        setError(data.error || 'Failed to add task')
      }
    } catch (err) {
      setError('Failed to add task')
    }
  }

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setEditTaskName(task.name)
    setEditHomeDescription(task.homeDescription)
    setEditAwayDescription(task.awayDescription)
  }

  const cancelEditTask = () => {
    setEditingTaskId(null)
    setEditTaskName('')
    setEditHomeDescription('')
    setEditAwayDescription('')
  }

  const updateTask = async (taskId: string) => {
    if (!activeTournament || !editTaskName.trim() || !editHomeDescription.trim() || !editAwayDescription.trim()) return

    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editTaskName.trim(),
          homeDescription: editHomeDescription.trim(),
          awayDescription: editAwayDescription.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Task updated successfully!')
        cancelEditTask()
        fetchTasks(activeTournament.id)
        fetchTournaments()
      } else {
        setError(data.error || 'Failed to update task')
      }
    } catch (err) {
      setError('Failed to update task')
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Task deleted successfully')
        if (activeTournament) {
          fetchTasks(activeTournament.id)
          fetchTournaments()
        }
      } else {
        setError('Failed to delete task')
      }
    } catch (err) {
      setError('Failed to delete task')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    router.push('/admin/login')
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
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
              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />
                <h1 className="text-xs sm:text-sm md:text-lg font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent truncate">
                  <span className="hidden md:inline">ADMIN </span>DASHBOARD
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
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-black/50 border border-emerald-500/30 hover:border-emerald-400/50 rounded-lg sm:rounded-xl transition-all text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-semibold touch-manipulation"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
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

        {/* Tournament Overview */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Tournament Status */}
            {activeTournament ? (
              <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-emerald-500/50 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent break-words">
                    {activeTournament.name}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                    <span className="text-emerald-400 font-medium">Active</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-black/20 border border-emerald-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-emerald-500/50 transition-all group">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="font-medium text-slate-400">Players</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-400">{activeTournament._count.players}</p>
                  </div>
                  
                  <div className="bg-black/20 border border-purple-500/30 rounded-xl p-4 hover:border-purple-500/50 transition-all group">
                    <div className="flex items-center space-x-2 mb-2">
                      <Trophy className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="font-medium text-slate-400">Matches</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-400">{activeTournament._count.matches}</p>
                  </div>
                  
                  <div className="bg-black/20 border border-yellow-500/30 rounded-xl p-4 hover:border-yellow-500/50 transition-all group">
                    <div className="flex items-center space-x-2 mb-2">
                      <Settings className="h-5 w-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                      <span className="font-medium text-slate-400">Tasks</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-400">{activeTournament._count.tasks}</p>
                  </div>
                </div>

                {/* Current Phase */}
                <div className="bg-black/20 border border-purple-500/30 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-emerald-400 mb-2">Current Phase</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold animate-pulse">
                      {activeTournament.phase}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        Phase {activeTournament.phase}: {phaseDescriptions[activeTournament.phase as keyof typeof phaseDescriptions]}
                      </p>
                      <p className="text-sm text-slate-400">
                        {activeTournament.phase === 1 && 'Players register and are assigned to pools'}
                        {activeTournament.phase === 2 && 'Create tasks for the tournament'}
                        {activeTournament.phase === 3 && 'Matches are created and players compete'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phase Controls */}
                <div>
                  <h3 className="font-semibold text-slate-400 mb-4">Phase Control</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((phase) => (
                      <button
                        key={phase}
                        onClick={() => updateTournamentPhase(phase)}
                        disabled={phase > activeTournament.phase + 1}
                        className={`p-3 rounded-lg text-sm font-semibold transition-all ${ 
                          phase === activeTournament.phase
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black'
                            : phase < activeTournament.phase
                            ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer'
                            : phase === activeTournament.phase + 1
                            ? 'bg-black/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10'
                            : 'bg-black/10 text-slate-600 cursor-not-allowed border border-slate-700/30'
                        }`}
                      >
                        Phase {phase}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-8 text-center">
                <Trophy className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                  No Active Tournament
                </h2>
                <p className="text-slate-400 mb-6">Create a new tournament to get started</p>
                <button
                  onClick={createTournament}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl transition-all shadow-xl shadow-emerald-500/50"
                >
                  <Plus className="h-5 w-5" />
                  <span>CREATE TOURNAMENT</span>
                </button>
              </div>
            )}

            {/* Pool Assignment - Phase 1 */}
            {activeTournament && activeTournament.phase === 1 && (
              <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  Pool Assignment
                </h3>
                <p className="text-gray-300 mb-6">
                  Divide players into 2 pools (Pool A and Pool B). Each pool will compete separately until the finals.
                </p>
                <Link
                  href="/admin/pool-assignment"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl transition-all shadow-xl shadow-emerald-500/50"
                >
                  <Users className="h-5 w-5" />
                  <span>ASSIGN POOLS</span>
                </Link>
                
                {activeTournament?.players?.some((p: any) => p.pool) && (
                  <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <p className="text-sm text-emerald-300 font-medium">
                      <Check className="h-4 w-4 inline mr-1" />
                      Pools have been assigned
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Opponent Draw - Phase 3 */}
            {activeTournament && activeTournament.phase === 3 && (
              <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  Opponent Draw (Within Pools)
                </h3>
                <p className="text-slate-400 mb-6">
                  Start the interactive opponent draw process. Each player will be matched with opponents from their pool through spinning wheel animations.
                </p>
                <Link
                  href="/admin/opponent-draw"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl transition-all shadow-xl shadow-emerald-500/50"
                >
                  <Trophy className="h-5 w-5" />
                  <span>START DRAW</span>
                </Link>
                
                {activeTournament._count.matches > 0 && (
                  <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <p className="text-sm text-emerald-300 font-medium">
                      <Check className="h-4 w-4 inline mr-1" />
                      {activeTournament._count.matches} matches have been created
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Knockout Stage Management - Phase 4 */}
            {activeTournament && activeTournament.phase >= 3 && (
              <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent mb-4">
                  Knockout Stage
                </h3>
                <p className="text-slate-400 mb-6">
                  Manage knockout stages including Round of 16, Quarter Finals, Semi Finals, Group Finals, and the Mega Final.
                </p>
                <Link
                  href="/admin/knockout"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-purple-500/50"
                >
                  <Trophy className="h-5 w-5" />
                  <span>MANAGE KNOCKOUT</span>
                </Link>
              </div>
            )}


            {/* Task Management - Phase 2 */}
            {activeTournament && activeTournament.phase === 2 && (
              <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  Task Management
                </h3>
                
                {/* Add Task */}
                <div className="mb-6">
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="Task Name (e.g., 'Scoring Challenge')"
                      className="w-full px-4 py-3 bg-black/20 border-2 border-emerald-500/30 rounded-xl text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-emerald-400 mb-2">🏠 Home Player Task</label>
                        <textarea
                          value={newHomeDescription}
                          onChange={(e) => setNewHomeDescription(e.target.value)}
                          placeholder="What the home player must do..."
                          className="w-full px-4 py-3 bg-black/20 border-2 border-emerald-500/30 rounded-xl text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-purple-400 mb-2">✈️ Away Player Task</label>
                        <textarea
                          value={newAwayDescription}
                          onChange={(e) => setNewAwayDescription(e.target.value)}
                          placeholder="What the away player must do..."
                          className="w-full px-4 py-3 bg-black/20 border-2 border-purple-500/30 rounded-xl text-white placeholder-slate-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                          rows={3}
                        />
                      </div>
                    </div>
                    <button
                      onClick={addTask}
                      disabled={!newTaskName.trim() || !newHomeDescription.trim() || !newAwayDescription.trim()}
                      className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/50"
                    >
                      ADD TASK
                    </button>
                  </div>
                </div>

                {/* Task List */}
                <div>
                  <h4 className="font-semibold text-slate-400 mb-3">Tasks ({tasks.length})</h4>
                  {tasks.length > 0 ? (
                    <div className="space-y-3">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-black/40 border-2 border-yellow-500/30 rounded-xl p-4 hover:border-yellow-500/50 transition-all"
                        >
                          {editingTaskId === task.id ? (
                            // Edit Mode
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editTaskName}
                                onChange={(e) => setEditTaskName(e.target.value)}
                                placeholder="Task Name"
                                className="w-full px-4 py-2 bg-black/20 border-2 border-yellow-500/30 rounded-lg text-white placeholder-slate-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                              />
                              <div className="grid md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-emerald-400 mb-2">🏠 Home Player Task</label>
                                  <textarea
                                    value={editHomeDescription}
                                    onChange={(e) => setEditHomeDescription(e.target.value)}
                                    placeholder="What the home player must do..."
                                    className="w-full px-3 py-2 bg-black/20 border-2 border-emerald-500/30 rounded-lg text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-purple-400 mb-2">✈️ Away Player Task</label>
                                  <textarea
                                    value={editAwayDescription}
                                    onChange={(e) => setEditAwayDescription(e.target.value)}
                                    placeholder="What the away player must do..."
                                    className="w-full px-3 py-2 bg-black/20 border-2 border-purple-500/30 rounded-lg text-white placeholder-slate-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateTask(task.id)}
                                  disabled={!editTaskName.trim() || !editHomeDescription.trim() || !editAwayDescription.trim()}
                                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={cancelEditTask}
                                  className="px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 font-semibold rounded-lg transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <>
                              <div className="flex items-start justify-between mb-3">
                                <h5 className="text-lg font-bold text-yellow-400">{task.name}</h5>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => startEditTask(task)}
                                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                                    title="Edit task"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                                    title="Delete task"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-3">
                                <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-3">
                                  <p className="text-xs font-semibold text-emerald-400 mb-1">🏠 Home Player</p>
                                  <p className="text-sm text-slate-300">{task.homeDescription}</p>
                                </div>
                                <div className="bg-purple-500/5 border border-purple-500/30 rounded-lg p-3">
                                  <p className="text-xs font-semibold text-purple-400 mb-1">✈️ Away Player</p>
                                  <p className="text-sm text-slate-300">{task.awayDescription}</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No tasks created yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Player Management */}
            {activeTournament && activeTournament.phase === 1 && (
              <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  Player Management
                </h3>
                
                {/* Bulk Add Players */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-emerald-400 mb-2">
                    Bulk Add Players
                  </label>
                  <textarea
                    value={bulkNames}
                    onChange={(e) => setBulkNames(e.target.value)}
                    placeholder="Enter player names, one per line"
                    className="w-full h-32 px-4 py-3 bg-black/20 border-2 border-emerald-500/30 rounded-xl text-white placeholder-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                  <button
                    onClick={bulkAddPlayers}
                    disabled={!bulkNames.trim()}
                    className="mt-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/50"
                  >
                    ADD PLAYERS
                  </button>
                </div>

                {/* Registration Links */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-400">Registration Links</h4>
                    <button
                      onClick={generateRegistrationLink}
                      className="px-4 py-2 bg-black/20 border border-emerald-500/30 hover:border-emerald-400/50 rounded-xl text-emerald-400 hover:text-emerald-300 text-sm font-semibold transition-all"
                    >
                      Generate Link
                    </button>
                  </div>
                  
                  {registrationLinks.length > 0 ? (
                    <div className="space-y-2">
                      {registrationLinks.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-3 bg-black/20 border border-emerald-500/30 rounded-xl hover:border-emerald-500/50 transition-all">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-emerald-400">
                              Registration Link
                            </p>
                            <p className="text-xs text-slate-400 truncate font-mono">
                              {`${window.location.origin}/register?token=${link.token}`}
                            </p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(`${window.location.origin}/register?token=${link.token}`)}
                            className="ml-2 p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all"
                          >
                            {copied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No registration links created yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tournament List */}
            <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
                  ALL TOURNAMENTS
                </h3>
                <button
                  onClick={createTournament}
                  className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all border border-emerald-500/30"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {tournaments.length > 0 ? (
                <div className="space-y-2">
                  {tournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        tournament.isActive 
                          ? 'bg-emerald-500/10 border-2 border-emerald-500/40' 
                          : 'bg-black/20 border border-emerald-500/20 hover:border-emerald-500/40'
                      }`}
                      onClick={() => setActiveTournament(tournament)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{tournament.name}</p>
                          <p className="text-xs text-slate-400">
                            Phase {tournament.phase} • {tournament._count.players} players
                          </p>
                        </div>
                        {tournament.isActive && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No tournaments created yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}