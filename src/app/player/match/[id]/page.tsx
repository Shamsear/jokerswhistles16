'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Home, 
  Plane,
  Trophy,
  Loader2,
  AlertCircle,
  Check,
  Zap
} from 'lucide-react'
import SpinWheel from '@/components/SpinWheel'

interface Match {
  id: string
  round: number
  homePlayer: { id: string; name: string }
  awayPlayer: { id: string; name: string }
  homeScore: number | null
  awayScore: number | null
  status: string
  tournament: { id: string; name: string; phase: number }
  taskAssignments: Array<{
    id: string
    player: { id: string; name: string }
    task: {
      id: string
      description: string
      type: string
    }
  }>
}

export default function MatchDetailsPage() {
  const params = useParams()
  const [match, setMatch] = useState<Match | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSpinWheel, setShowSpinWheel] = useState(false)
  const [availableTasks, setAvailableTasks] = useState<string[]>([])
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [submittingResult, setSubmittingResult] = useState(false)

  useEffect(() => {
    const savedPlayer = localStorage.getItem('currentPlayer')
    if (savedPlayer) {
      setCurrentPlayer(JSON.parse(savedPlayer))
    }
    fetchMatchDetails()
  }, [params.id])

  const fetchMatchDetails = async () => {
    try {
      const response = await fetch(`/api/matches/${params.id}/result`)
      const data = await response.json()

      if (response.ok) {
        setMatch(data.match)
        setHomeScore(data.match.homeScore?.toString() || '')
        setAwayScore(data.match.awayScore?.toString() || '')
      } else {
        setError(data.error || 'Failed to fetch match details')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTasks = async () => {
    if (!currentPlayer || !match) return

    try {
      const response = await fetch(
        `/api/task-assignments/available?playerId=${currentPlayer.id}&tournamentId=${match.tournament.id}`,
        { method: 'OPTIONS' }
      )
      const data = await response.json()

      if (response.ok && data.tasks) {
        setAvailableTasks(data.tasks.map((t: any) => t.description))
      }
    } catch (err) {
      console.error('Failed to fetch available tasks:', err)
    }
  }

  const handleSpinForTask = async () => {
    if (!match || !currentPlayer) return

    // Check if player already has a task for this match
    const playerTask = match.taskAssignments.find(
      (a) => a.player.id === currentPlayer.id
    )

    if (playerTask) {
      setError('You already have a task assigned for this match')
      return
    }

    await fetchAvailableTasks()
    setShowSpinWheel(true)
  }

  const handleSpinComplete = async (selectedTask: string) => {
    if (!match || !currentPlayer || !availableTasks.length) return

    try {
      // Find the task object from available tasks
      const tasksResponse = await fetch(
        `/api/task-assignments/available?playerId=${currentPlayer.id}&tournamentId=${match.tournament.id}`,
        { method: 'OPTIONS' }
      )
      const tasksData = await tasksResponse.json()
      const selectedTaskObj = tasksData.tasks.find((t: any) => t.description === selectedTask)

      if (!selectedTaskObj) {
        setError('Selected task not found')
        return
      }

      // Create task assignment
      const response = await fetch('/api/task-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId: currentPlayer.id,
          matchId: match.id,
          taskId: selectedTaskObj.id,
          round: match.round
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Task assigned successfully!')
        setShowSpinWheel(false)
        fetchMatchDetails()
      } else {
        setError(data.error || 'Failed to assign task')
      }
    } catch (err) {
      setError('Failed to assign task')
    }
  }

  const submitResult = async () => {
    if (!match || !currentPlayer) return

    const home = parseInt(homeScore)
    const away = parseInt(awayScore)

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setError('Please enter valid scores')
      return
    }

    setSubmittingResult(true)
    setError('')

    try {
      const response = await fetch(`/api/matches/${match.id}/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          homeScore: home,
          awayScore: away,
          submittedBy: currentPlayer.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Match result submitted successfully!')
        fetchMatchDetails()
      } else {
        setError(data.error || 'Failed to submit result')
      }
    } catch (err) {
      setError('Failed to submit result')
    } finally {
      setSubmittingResult(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading match...</span>
        </div>
      </div>
    )
  }

  if (!match || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 mb-4">Match not found or you're not logged in</p>
          <Link
            href="/player"
            className="text-blue-600 hover:text-blue-700"
          >
            Go back to player dashboard
          </Link>
        </div>
      </div>
    )
  }

  const isHomePlayer = currentPlayer.id === match.homePlayer.id
  const isAwayPlayer = currentPlayer.id === match.awayPlayer.id
  const playerTask = match.taskAssignments.find(a => a.player.id === currentPlayer.id)
  const opponentTask = match.taskAssignments.find(a => a.player.id !== currentPlayer.id)
  const canSpinForTask = match.tournament.phase >= 5 && !playerTask

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/player"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Match Details</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Match Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="text-center mb-6">
            <div className="inline-block px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-4">
              Round {match.round}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {match.homePlayer.name} vs {match.awayPlayer.name}
            </h2>
            <p className="text-gray-600">{match.tournament.name}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${isHomePlayer ? 'bg-green-100 border-2 border-green-400' : 'bg-green-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Home className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-gray-900">{match.homePlayer.name}</span>
                </div>
                {isHomePlayer && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">YOU</span>}
              </div>
              {match.homeScore !== null && (
                <div className="text-3xl font-bold text-green-600">{match.homeScore}</div>
              )}
            </div>

            <div className={`p-4 rounded-lg ${isAwayPlayer ? 'bg-blue-100 border-2 border-blue-400' : 'bg-blue-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Plane className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">{match.awayPlayer.name}</span>
                </div>
                {isAwayPlayer && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">YOU</span>}
              </div>
              {match.awayScore !== null && (
                <div className="text-3xl font-bold text-blue-600">{match.awayScore}</div>
              )}
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Tasks</h3>

          {/* Your Task */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Your Task:</h4>
            {playerTask ? (
              <div className={`p-4 rounded-lg ${
                playerTask.task.type === 'positive' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded mb-2 ${
                      playerTask.task.type === 'positive'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {playerTask.task.type === 'positive' ? '✓ Positive' : '✗ Negative'}
                    </span>
                    <p className="text-gray-900">{playerTask.task.description}</p>
                  </div>
                </div>
              </div>
            ) : canSpinForTask ? (
              <button
                onClick={handleSpinForTask}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                <Zap className="h-5 w-5" />
                <span>Spin for Your Task</span>
              </button>
            ) : (
              <p className="text-gray-500 text-sm italic">
                {match.tournament.phase < 5 
                  ? 'Tasks will be available in Phase 5' 
                  : 'Waiting for task assignment'}
              </p>
            )}
          </div>

          {/* Opponent's Task */}
          {opponentTask && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Opponent's Task:</h4>
              <div className={`p-4 rounded-lg ${
                opponentTask.task.type === 'positive' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded mb-2 ${
                  opponentTask.task.type === 'positive'
                    ? 'bg-green-200 text-green-800'
                    : 'bg-red-200 text-red-800'
                }`}>
                  {opponentTask.task.type === 'positive' ? '✓ Positive' : '✗ Negative'}
                </span>
                <p className="text-gray-900">{opponentTask.task.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Result Submission */}
        {match.tournament.phase >= 6 && match.status !== 'completed' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Match Result</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {match.homePlayer.name} Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {match.awayPlayer.name} Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            <button
              onClick={submitResult}
              disabled={submittingResult || !homeScore || !awayScore}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {submittingResult ? 'Submitting...' : 'Submit Result'}
            </button>
          </div>
        )}

        {match.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Match Completed!</h3>
            <p className="text-gray-600">
              Final Score: {match.homePlayer.name} {match.homeScore} - {match.awayScore} {match.awayPlayer.name}
            </p>
          </div>
        )}
      </main>

      {/* Spin Wheel Modal */}
      {showSpinWheel && (
        <SpinWheel
          items={availableTasks}
          onSpinComplete={handleSpinComplete}
          title="Spin for Your Task!"
          isOpen={showSpinWheel}
          onClose={() => setShowSpinWheel(false)}
          colorScheme="tasks"
        />
      )}
    </div>
  )
}