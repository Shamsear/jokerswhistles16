'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Home as HomeIcon, Plane, Trophy, ArrowRight, Share2 } from 'lucide-react'

interface Match {
  id: string
  homePlayerId: string
  homePlayerName: string
  awayPlayerId: string
  awayPlayerName: string
  round: number
  pool: string
}

interface Task {
  id: string
  name: string
  homeDescription: string
  awayDescription: string
}

interface PlayerTaskHistory {
  playerId: string
  taskIds: string[]
}

export default function MatchTaskPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.matchId as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [match, setMatch] = useState<Match | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [step, setStep] = useState<'identify' | 'select-card' | 'reveal-task' | 'expired'>('identify')
  const [playerType, setPlayerType] = useState<'home' | 'away' | null>(null)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [assignedTask, setAssignedTask] = useState<Task | null>(null)
  const [isRevealing, setIsRevealing] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    fetchMatchData()
  }, [matchId])

  const fetchMatchData = async () => {
    try {
      // Fetch match details
      const matchResponse = await fetch(`/api/matches/${matchId}`)
      const matchData = await matchResponse.json()

      if (!matchResponse.ok) {
        setError(matchData.error || 'Failed to load match')
        setLoading(false)
        return
      }

      setMatch(matchData.match)

      // Fetch all tasks
      const tasksResponse = await fetch(`/api/tasks?tournamentId=${matchData.match.tournamentId}`)
      const tasksData = await tasksResponse.json()

      if (tasksResponse.ok) {
        setTasks(tasksData.tasks)
      }

      // Check if task is already assigned to this match
      const checkResponse = await fetch(`/api/match-tasks?matchId=${matchId}`)
      const checkData = await checkResponse.json()
      
      if (checkResponse.ok && checkData.matchTasks && checkData.matchTasks.length > 0) {
        // Task already assigned - show it directly
        const existingMatchTask = checkData.matchTasks[0]
        const existingTask = tasksData.tasks.find((t: Task) => t.id === existingMatchTask.taskId)
        
        if (existingTask) {
          setAssignedTask(existingTask)
          setIsExpired(true)
          setStep('expired')
        }
      }

      setLoading(false)
    } catch (err) {
      setError('Failed to connect to server')
      setLoading(false)
    }
  }

  const handlePlayerIdentification = (type: 'home' | 'away') => {
    if (isExpired) {
      setError('This link has expired. A task has already been assigned to this match.')
      return
    }
    setPlayerType(type)
    setStep('select-card')
  }

  const handleCardSelection = async (cardNumber: number) => {
    if (isExpired) {
      setError('This link has expired. A task has already been assigned to this match.')
      return
    }

    setSelectedCard(cardNumber)
    setIsRevealing(true)

    const playerId = playerType === 'home' ? match!.homePlayerId : match!.awayPlayerId
    
    try {
      // Check if task already assigned to this match
      const checkResponse = await fetch(`/api/match-tasks?matchId=${matchId}`)
      const checkData = await checkResponse.json()
      
      if (checkResponse.ok && checkData.matchTasks && checkData.matchTasks.length > 0) {
        // Task already assigned - link is now expired
        const existingTask = tasks.find(t => t.id === checkData.matchTasks[0].taskId)
        if (existingTask) {
          setAssignedTask(existingTask)
          setIsExpired(true)
          setIsRevealing(false)
          setStep('expired')
          return
        }
      }

      // No task assigned yet - check player histories and find available tasks
      if (tasks.length === 0) {
        setError('No tasks available')
        setIsRevealing(false)
        return
      }

      // Fetch both players' task histories
      const homeHistoryResponse = await fetch(`/api/player-task-history?playerId=${match!.homePlayerId}`)
      const homeHistoryData = await homeHistoryResponse.json()
      const homeUsedTaskIds = homeHistoryData.history?.taskIds || []

      const awayHistoryResponse = await fetch(`/api/player-task-history?playerId=${match!.awayPlayerId}`)
      const awayHistoryData = await awayHistoryResponse.json()
      const awayUsedTaskIds = awayHistoryData.history?.taskIds || []

      // Find tasks that NEITHER player has received yet
      const availableTasks = tasks.filter(task => 
        !homeUsedTaskIds.includes(task.id) && !awayUsedTaskIds.includes(task.id)
      )

      if (availableTasks.length === 0) {
        setError('No more unique tasks available for both players')
        setIsRevealing(false)
        return
      }

      // Randomly select a task from available tasks
      const randomTask = availableTasks[Math.floor(Math.random() * availableTasks.length)]
      
      // Simulate card flip delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setAssignedTask(randomTask)
      setIsRevealing(false)
      setIsExpired(true) // Mark link as expired after task selection
      setStep('reveal-task')

      // Save task assignment for the MATCH (not individual players)
      // Save for both home and away players
      await fetch('/api/match-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: matchId,
          taskId: randomTask.id,
          playerId: match!.homePlayerId,
          playerType: 'home',
          cardNumber: cardNumber,
          pickedBy: playerId // Track who picked the card
        })
      })

      await fetch('/api/match-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: matchId,
          taskId: randomTask.id,
          playerId: match!.awayPlayerId,
          playerType: 'away',
          cardNumber: cardNumber,
          pickedBy: playerId // Track who picked the card
        })
      })

      // Update task history for BOTH players to prevent them from getting this task again
      await fetch('/api/player-task-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: match!.homePlayerId,
          taskId: randomTask.id
        })
      })

      await fetch('/api/player-task-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: match!.awayPlayerId,
          taskId: randomTask.id
        })
      })
    } catch (err) {
      setError('Failed to assign task')
      setIsRevealing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2 text-emerald-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg font-semibold">Loading match...</span>
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/60 backdrop-blur-xl border-2 border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-red-400 mb-4">{error || 'Match not found'}</p>
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
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        {/* Step 1: Player Identification */}
        {step === 'identify' && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-8 w-full max-w-2xl">
            <Trophy className="h-16 w-16 text-emerald-400 mx-auto mb-6" />
            <h1 className="text-3xl font-black text-center bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent mb-4">
              WHO ARE YOU?
            </h1>
            <p className="text-center text-slate-400 mb-8">
              Identify yourself before picking a card
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => handlePlayerIdentification('home')}
                className="group bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-2xl p-8 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/50"
              >
                <HomeIcon className="h-16 w-16 text-emerald-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="text-xl font-bold text-white mb-2">HOME PLAYER</h2>
                <p className="text-2xl font-black text-emerald-400">{match.homePlayerName}</p>
              </button>

              <button
                onClick={() => handlePlayerIdentification('away')}
                className="group bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-500/50 hover:border-purple-400 rounded-2xl p-8 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/50"
              >
                <Plane className="h-16 w-16 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="text-xl font-bold text-white mb-2">AWAY PLAYER</h2>
                <p className="text-2xl font-black text-purple-400">{match.awayPlayerName}</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Card Selection */}
        {step === 'select-card' && !isRevealing && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-8 w-full max-w-3xl">
            <h1 className="text-3xl font-black text-center bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent mb-4">
              SELECT A CARD
            </h1>
            <p className="text-center text-slate-400 mb-2">
              Playing as: <span className={`font-bold ${playerType === 'home' ? 'text-emerald-400' : 'text-purple-400'}`}>
                {playerType === 'home' ? match.homePlayerName : match.awayPlayerName}
              </span>
            </p>
            <p className="text-center text-slate-500 mb-8">
              Choose any card - a random task will be assigned to this match
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((cardNum) => (
                <button
                  key={cardNum}
                  onClick={() => handleCardSelection(cardNum)}
                  className="group aspect-[2/3] bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 hover:border-yellow-400 rounded-xl p-4 transition-all hover:scale-105 hover:shadow-xl hover:shadow-yellow-500/50 flex flex-col items-center justify-center"
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src="/logo.png"
                      alt="Card"
                      width={100}
                      height={100}
                      className="opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <p className="text-white font-bold mt-2">Card {cardNum}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card Revealing Animation */}
        {isRevealing && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-8 w-full max-w-2xl text-center">
            <div className="animate-pulse">
              <Image
                src="/logo.png"
                alt="Revealing"
                width={200}
                height={200}
                className="mx-auto mb-6 animate-spin-slow"
              />
              <h2 className="text-2xl font-black text-emerald-400">REVEALING MATCH TASKS...</h2>
              <p className="text-slate-400 mt-2">Card {selectedCard} - Randomly assigning task</p>
            </div>
          </div>
        )}

        {/* Expired State - Show Already Assigned Task */}
        {step === 'expired' && assignedTask && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-2xl p-8 w-full max-w-2xl">
            <div className="text-center mb-6">
              <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4" />
              <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
                TASK ALREADY ASSIGNED
              </h1>
              <p className="text-slate-400">
                {assignedTask.name} - Round {match.round}
              </p>
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  🔒 This link has expired. The task has already been selected for this match.
                </p>
              </div>
            </div>

            {/* Home Player's Task */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/50 rounded-xl p-6 mb-4">
              <h3 className="text-lg font-bold text-emerald-400 mb-3">
                🏠 {match.homePlayerName}'s Task
              </h3>
              <p className="text-white text-lg leading-relaxed">
                {assignedTask.homeDescription}
              </p>
            </div>

            {/* Away Player's Task */}
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-500/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-purple-400 mb-3">
                ✈️ {match.awayPlayerName}'s Task
              </h3>
              <p className="text-white text-lg leading-relaxed">
                {assignedTask.awayDescription}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => {
                  const message = `🏆 *Match Tasks - Round ${match.round}*\n\n` +
                    `*${assignedTask.name}*\n\n` +
                    `🏠 *${match.homePlayerName}:*\n${assignedTask.homeDescription}\n\n` +
                    `✈️ *${match.awayPlayerName}:*\n${assignedTask.awayDescription}\n\n` +
                    `Good luck! 🎮`
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
                  window.open(whatsappUrl, '_blank')
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-green-500/50 flex items-center justify-center space-x-2"
              >
                <Share2 className="h-5 w-5" />
                <span>Share to WhatsApp</span>
              </button>

              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl transition-all shadow-xl shadow-emerald-500/50 flex items-center justify-center space-x-2"
              >
                <span>Done</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Task Reveal */}
        {step === 'reveal-task' && assignedTask && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-8 w-full max-w-2xl">
            <div className="text-center mb-6">
              <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                MATCH TASKS REVEALED
              </h1>
              <p className="text-slate-400">
                {assignedTask.name} - Round {match.round}
              </p>
            </div>

            {/* Your Task */}
            <div className={`bg-gradient-to-br ${playerType === 'home' ? 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/50' : 'from-purple-500/20 to-purple-600/20 border-purple-500/50'} border-2 rounded-xl p-6 mb-4`}>
              <h3 className={`text-lg font-bold ${playerType === 'home' ? 'text-emerald-400' : 'text-purple-400'} mb-3`}>
                {playerType === 'home' ? `🏠 ${match.homePlayerName}'s Task (You)` : `✈️ ${match.awayPlayerName}'s Task (You)`}
              </h3>
              <p className="text-white text-lg leading-relaxed">
                {playerType === 'home' ? assignedTask.homeDescription : assignedTask.awayDescription}
              </p>
            </div>

            {/* Opponent's Task */}
            <div className={`bg-gradient-to-br ${playerType === 'home' ? 'from-purple-500/20 to-purple-600/20 border-purple-500/50' : 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/50'} border-2 rounded-xl p-6 mb-6`}>
              <h3 className={`text-lg font-bold ${playerType === 'home' ? 'text-purple-400' : 'text-emerald-400'} mb-3`}>
                {playerType === 'home' ? `✈️ ${match.awayPlayerName}'s Task` : `🏠 ${match.homePlayerName}'s Task`}
              </h3>
              <p className="text-white text-lg leading-relaxed">
                {playerType === 'home' ? assignedTask.awayDescription : assignedTask.homeDescription}
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <p className="text-blue-300 text-sm text-center">
                📱 Share these tasks with your opponent! Only one player needs to pick the card.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => {
                  const message = `🏆 *Match Tasks - Round ${match.round}*\n\n` +
                    `*${assignedTask.name}*\n\n` +
                    `🏠 *${match.homePlayerName}:*\n${assignedTask.homeDescription}\n\n` +
                    `✈️ *${match.awayPlayerName}:*\n${assignedTask.awayDescription}\n\n` +
                    `Good luck! 🎮`
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
                  window.open(whatsappUrl, '_blank')
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-green-500/50 flex items-center justify-center space-x-2"
              >
                <Share2 className="h-5 w-5" />
                <span>Share to WhatsApp</span>
              </button>

              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl transition-all shadow-xl shadow-emerald-500/50 flex items-center justify-center space-x-2"
              >
                <span>Done</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-400 text-sm text-center">
                ⚠️ These tasks have been assigned and won't appear again in future rounds
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
