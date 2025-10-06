'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  CheckSquare,
  Plus,
  Check,
  Loader2,
  AlertCircle,
  X,
  Edit2,
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
  isActive: boolean
  createdAt: string
}

export default function TasksManagement() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // New task form
  const [newTaskName, setNewTaskName] = useState('')
  const [newHomeDescription, setNewHomeDescription] = useState('')
  const [newAwayDescription, setNewAwayDescription] = useState('')
  
  // Edit task form
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskName, setEditTaskName] = useState('')
  const [editHomeDescription, setEditHomeDescription] = useState('')
  const [editAwayDescription, setEditAwayDescription] = useState('')

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
      fetchTasks(activeTournament.id)
    }
  }, [activeTournament])

  // Auto-refresh every 10 seconds for live updates
  useEffect(() => {
    if (!autoRefresh || !activeTournament) return
    
    const interval = setInterval(() => {
      fetchTasks(activeTournament.id, true) // true = silent background fetch
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, activeTournament])

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

  const fetchTasks = async (tournamentId: string, isSilent = false) => {
    if (!isSilent) {
      setIsRefreshing(true)
    }
    
    try {
      const response = await fetch(`/api/tasks?tournamentId=${tournamentId}`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      })
      const data = await response.json()
      
      if (response.ok) {
        setTasks(data.tasks)
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      if (!isSilent) {
        setIsRefreshing(false)
      }
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
        setSuccess('Task added successfully!')
        setNewTaskName('')
        setNewHomeDescription('')
        setNewAwayDescription('')
        fetchTasks(activeTournament.id)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to add task')
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      setError('Failed to add task')
      setTimeout(() => setError(''), 5000)
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
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to update task')
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      setError('Failed to update task')
      setTimeout(() => setError(''), 5000)
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
        }
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to delete task')
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      setError('Failed to delete task')
      setTimeout(() => setError(''), 5000)
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
                  TASK<span className="hidden sm:inline"> MANAGEMENT</span>
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

      <main className="relative z-10 max-w-5xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent break-words">
                  {activeTournament.name}
                </h2>
                <p className="text-slate-400 mt-1 text-xs sm:text-sm">Managing tasks for Phase {activeTournament.phase}</p>
              </div>
              <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                <button
                  onClick={() => activeTournament && fetchTasks(activeTournament.id)}
                  disabled={isRefreshing}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg transition-all text-yellow-400 disabled:opacity-50 text-xs sm:text-sm font-semibold touch-manipulation"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"></div>
                  <span className="text-yellow-400 font-medium text-xs sm:text-sm">Active</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center mb-4 sm:mb-6">
            <CheckSquare className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-yellow-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent mb-2 px-4">
              No Active Tournament
            </h2>
            <p className="text-slate-400 mb-6 text-sm sm:text-base px-4">Create a tournament first to manage tasks</p>
            <Link
              href="/admin/tournament"
              className="inline-flex items-center justify-center space-x-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-lg sm:rounded-xl transition-all shadow-xl shadow-yellow-500/50 w-full max-w-xs sm:w-auto touch-manipulation"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">GO TO TOURNAMENT</span>
            </Link>
          </div>
        )}

        {/* Add New Task */}
        {activeTournament && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 hover:border-yellow-500/50 transition-all">
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent mb-3 sm:mb-4">
              Add New Task
            </h3>
            
            <div className="space-y-3">
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Task Name (e.g., 'Scoring Challenge')"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/20 border-2 border-yellow-500/30 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 transition-all"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-2">🏠 Home Player Task</label>
                  <textarea
                    value={newHomeDescription}
                    onChange={(e) => setNewHomeDescription(e.target.value)}
                    placeholder="What the home player must do..."
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/20 border-2 border-emerald-500/30 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-purple-400 mb-2">✈️ Away Player Task</label>
                  <textarea
                    value={newAwayDescription}
                    onChange={(e) => setNewAwayDescription(e.target.value)}
                    placeholder="What the away player must do..."
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/20 border-2 border-purple-500/30 rounded-lg sm:rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    rows={3}
                  />
                </div>
              </div>
              <button
                onClick={addTask}
                disabled={!newTaskName.trim() || !newHomeDescription.trim() || !newAwayDescription.trim()}
                className="w-full px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold text-sm sm:text-base rounded-lg sm:rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-yellow-500/50 touch-manipulation"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 inline mr-2" />
                ADD TASK
              </button>
            </div>
          </div>
        )}

        {/* Task List */}
        {activeTournament && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-yellow-500/50 transition-all">
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent mb-3 sm:mb-4">
              All Tasks ({tasks.length})
            </h3>
            
            {tasks.length > 0 ? (
              <div className="space-y-3 sm:space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-black/40 border-2 border-yellow-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-yellow-500/50 transition-all"
                  >
                    {editingTaskId === task.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editTaskName}
                          onChange={(e) => setEditTaskName(e.target.value)}
                          placeholder="Task Name"
                          className="w-full px-3 sm:px-4 py-2 bg-black/20 border-2 border-yellow-500/30 rounded-lg text-white text-sm sm:text-base placeholder-slate-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                        />
                        <div className="grid sm:grid-cols-2 gap-3">
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
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => updateTask(task.id)}
                            disabled={!editTaskName.trim() || !editHomeDescription.trim() || !editAwayDescription.trim()}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold text-sm sm:text-base rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                          >
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1" />
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEditTask}
                            className="px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 font-semibold text-sm sm:text-base rounded-lg transition-all touch-manipulation"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <h5 className="text-base sm:text-lg font-bold text-yellow-400 break-words flex-1 min-w-0">{task.name}</h5>
                          <div className="flex gap-1 sm:gap-2 shrink-0">
                            <button
                              onClick={() => startEditTask(task)}
                              className="p-1.5 sm:p-2 text-blue-400 hover:bg-blue-500/20 active:bg-blue-500/30 rounded-lg transition-all touch-manipulation"
                              title="Edit task"
                            >
                              <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1.5 sm:p-2 text-red-400 hover:bg-red-500/20 active:bg-red-500/30 rounded-lg transition-all touch-manipulation"
                              title="Delete task"
                            >
                              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-2.5 sm:p-3">
                            <p className="text-xs font-semibold text-emerald-400 mb-1">🏠 Home Player</p>
                            <p className="text-xs sm:text-sm text-slate-300 break-words">{task.homeDescription}</p>
                          </div>
                          <div className="bg-purple-500/5 border border-purple-500/30 rounded-lg p-2.5 sm:p-3">
                            <p className="text-xs font-semibold text-purple-400 mb-1">✈️ Away Player</p>
                            <p className="text-xs sm:text-sm text-slate-300 break-words">{task.awayDescription}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <CheckSquare className="h-12 w-12 sm:h-16 sm:w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-sm sm:text-base px-4">No tasks created yet. Add your first task above!</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
