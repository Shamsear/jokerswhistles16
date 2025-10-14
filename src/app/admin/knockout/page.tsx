'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Trophy, 
  Loader2, 
  AlertCircle, 
  Check,
  Play,
  Crown,
  Users,
  RefreshCw,
  Trash2,
  Save,
  RotateCcw,
  Share2,
  Edit2,
  X,
  CheckSquare,
  ExternalLink
} from 'lucide-react'

// Lazy load the share modal
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
  knockoutStage: string | null
  pool: string | null
  homeScore: number | null
  awayScore: number | null
  status: string
  winnerId: string | null
  absentStatus: string | null
  homePlayer: Player
  awayPlayer: Player
}

interface KnockoutStageInfo {
  name: string
  key: string
  round: number
  previousStage: string | null
}

const knockoutStages: KnockoutStageInfo[] = [
  { name: 'Round of 16', key: 'round_of_16', round: 7, previousStage: null },
  { name: 'Quarter Finals', key: 'quarter_final', round: 8, previousStage: 'round_of_16' },
  { name: 'Semi Finals', key: 'semi_final', round: 9, previousStage: 'quarter_final' },
  { name: 'Group Finals', key: 'group_final', round: 10, previousStage: 'semi_final' },
  { name: 'Mega Final', key: 'mega_final', round: 11, previousStage: 'group_final' }
]

export default function KnockoutManagement() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null)
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [knockoutReady, setKnockoutReady] = useState(false)
  const [poolProgress, setPoolProgress] = useState({ completed: 0, total: 0 })
  
  // Edit state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null)
  const [editHomeScore, setEditHomeScore] = useState<string>('')
  const [editAwayScore, setEditAwayScore] = useState<string>('')
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null)
  const [resettingMatchId, setResettingMatchId] = useState<string | null>(null)
  const [isSavingToServer, setIsSavingToServer] = useState(false)
  
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareStage, setShareStage] = useState<string>('round_of_16')
  
  // Edit opponent state
  const [editingOpponentMatchId, setEditingOpponentMatchId] = useState<string | null>(null)
  const [editNewOpponentId, setEditNewOpponentId] = useState<string>('')
  const [allPlayers, setAllPlayers] = useState<Player[]>([])

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

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || !activeTournament) return
    
    const interval = setInterval(() => {
      fetchKnockoutMatches(activeTournament.id)
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, isAuthenticated, activeTournament])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tournaments?activeOnly=true')
      const data = await response.json()
      
      if (response.ok && data.tournaments[0]) {
        setActiveTournament(data.tournaments[0])
        setAllPlayers(data.tournaments[0].players || [])
        await fetchKnockoutMatches(data.tournaments[0].id)
      }
    } catch (err) {
      setError('Failed to fetch tournament data')
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
      
      // Check if knockout is ready to be generated
      await checkKnockoutReady(tournamentId)
    } catch (err) {
      console.error('Failed to fetch knockout matches:', err)
    }
  }
  
  const checkKnockoutReady = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/auto-knockout?tournamentId=${tournamentId}`)
      const data = await response.json()
      
      if (response.ok) {
        setKnockoutReady(data.ready || false)
        if (data.progress) {
          setPoolProgress(data.progress)
        }
      }
    } catch (err) {
      console.error('Failed to check knockout ready:', err)
    }
  }

  const generateStage = async (stage: string | null = null) => {
    if (!activeTournament) return
    
    setProcessing(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch('/api/knockout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: activeTournament.id,
          stage
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(data.message || 'Stage created successfully!')
        await fetchKnockoutMatches(activeTournament.id)
        setTimeout(() => setSuccess(''), 5000) // Clear after 5 seconds
      } else {
        setError(data.details || data.error || 'Failed to generate stage')
        setTimeout(() => setError(''), 5000) // Clear after 5 seconds
      }
    } catch (err) {
      setError('Failed to generate knockout stage')
      setTimeout(() => setError(''), 5000) // Clear after 5 seconds
    } finally {
      setProcessing(false)
    }
  }

  const deleteStage = async (stage: string) => {
    if (!activeTournament) return
    
    if (!confirm(`Are you sure you want to delete all ${stage} matches? This cannot be undone.`)) {
      return
    }
    
    setProcessing(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch(`/api/knockout?tournamentId=${activeTournament.id}&stage=${stage}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(data.message || 'Stage deleted successfully!')
        await fetchKnockoutMatches(activeTournament.id)
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError(data.details || data.error || 'Failed to delete stage')
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      setError('Failed to delete knockout stage')
      setTimeout(() => setError(''), 5000)
    } finally {
      setProcessing(false)
    }
  }

  const startEditMatch = (match: Match) => {
    setEditingMatchId(match.id)
    setEditHomeScore(match.homeScore?.toString() || '')
    setEditAwayScore(match.awayScore?.toString() || '')
  }

  const cancelEdit = () => {
    setEditingMatchId(null)
    setEditHomeScore('')
    setEditAwayScore('')
  }

  const startEditOpponent = (matchId: string, currentAwayPlayerId: string) => {
    setEditingOpponentMatchId(matchId)
    setEditNewOpponentId(currentAwayPlayerId)
  }

  const cancelEditOpponent = () => {
    setEditingOpponentMatchId(null)
    setEditNewOpponentId('')
  }

  const saveEditedOpponent = async (match: Match) => {
    if (!editNewOpponentId || editNewOpponentId === match.awayPlayer.id || !activeTournament) {
      cancelEditOpponent()
      return
    }

    try {
      const newOpponent = allPlayers.find(p => p.id === editNewOpponentId)
      if (!newOpponent) {
        setError('Invalid opponent selected')
        return
      }

      // Check if in same pool
      if (match.pool && newOpponent.pool !== match.pool) {
        setError('Players must be in the same pool')
        return
      }

      // Check for duplicate pairing in this stage
      const duplicateExists = knockoutMatches.some(m => 
        m.id !== match.id &&
        m.knockoutStage === match.knockoutStage &&
        (
          (m.homePlayer.id === match.homePlayer.id && m.awayPlayer.id === editNewOpponentId) ||
          (m.awayPlayer.id === match.homePlayer.id && m.homePlayer.id === editNewOpponentId)
        )
      )

      if (duplicateExists) {
        setError('This matchup already exists in this stage')
        return
      }

      setProcessing(true)

      // Update the match via API
      const response = await fetch(`/api/matches/${match.id}/opponent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          awayPlayerId: editNewOpponentId
        })
      })

      if (response.ok) {
        setSuccess('Opponent updated successfully!')
        await fetchKnockoutMatches(activeTournament.id)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update opponent')
        setTimeout(() => setError(''), 5000)
      }

      cancelEditOpponent()
    } catch (err) {
      console.error('Failed to update opponent:', err)
      setError('Failed to update opponent')
      setTimeout(() => setError(''), 5000)
    } finally {
      setProcessing(false)
    }
  }

  const saveMatchResult = async (matchId: string) => {
    setSavingMatchId(matchId)
    setIsSavingToServer(true)
    
    const homeScore = editHomeScore !== '' ? parseInt(editHomeScore) : (editAwayScore !== '' ? 0 : null)
    const awayScore = editAwayScore !== '' ? parseInt(editAwayScore) : (editHomeScore !== '' ? 0 : null)
    
    // Optimistic update
    const optimisticMatches = knockoutMatches.map(match => {
      if (match.id === matchId) {
        let status = match.status
        let winnerId = match.winnerId
        
        if (homeScore === null && awayScore === null) {
          status = 'completed'
          winnerId = null
        } else if (homeScore !== null && awayScore !== null) {
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
          absentStatus: null
        }
      }
      return match
    })
    
    setKnockoutMatches(optimisticMatches)
    setSuccess('Match result saved!')
    setEditingMatchId(null)
    setEditHomeScore('')
    setEditAwayScore('')
    
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore, awayScore })
      })

      const data = await response.json()

      if (response.ok) {
        setIsSavingToServer(false)
        setTimeout(() => setSuccess(''), 2000)
      } else {
        setError(data.error || 'Failed to save match result')
        if (activeTournament) {
          fetchKnockoutMatches(activeTournament.id)
        }
        setIsSavingToServer(false)
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      setError('Failed to save match result')
      if (activeTournament) {
        fetchKnockoutMatches(activeTournament.id)
      }
      setIsSavingToServer(false)
      setTimeout(() => setError(''), 5000)
    } finally {
      setSavingMatchId(null)
    }
  }

  const saveMatchResultWithAbsent = async (matchId: string, homeScoreValue: number | null, awayScoreValue: number | null, absentStatus: string) => {
    setSavingMatchId(matchId)
    setIsSavingToServer(true)
    
    const optimisticMatches = knockoutMatches.map(match => {
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
    
    setKnockoutMatches(optimisticMatches)
    setSuccess('Match result saved!')
    setEditingMatchId(null)
    setEditHomeScore('')
    setEditAwayScore('')
    
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
          fetchKnockoutMatches(activeTournament.id)
        }
        setIsSavingToServer(false)
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      setError('Failed to save match result')
      if (activeTournament) {
        fetchKnockoutMatches(activeTournament.id)
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
    setIsSavingToServer(true)
    
    const optimisticMatches = knockoutMatches.map(match => {
      if (match.id === matchId) {
        return {
          ...match,
          homeScore: null,
          awayScore: null,
          status: 'pending',
          winnerId: null,
          absentStatus: null
        }
      }
      return match
    })
    
    setKnockoutMatches(optimisticMatches)
    setSuccess('Match reset to pending!')
    
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeScore: null,
          awayScore: null,
          status: 'pending'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setIsSavingToServer(false)
        setTimeout(() => setSuccess(''), 2000)
      } else {
        setError(data.error || 'Failed to reset match')
        if (activeTournament) {
          fetchKnockoutMatches(activeTournament.id)
        }
        setIsSavingToServer(false)
        setTimeout(() => setError(''), 5000)
      }
    } catch (err) {
      setError('Failed to reset match')
      if (activeTournament) {
        fetchKnockoutMatches(activeTournament.id)
      }
      setIsSavingToServer(false)
      setTimeout(() => setError(''), 5000)
    } finally {
      setResettingMatchId(null)
    }
  }

  const getStageMatches = (stageKey: string, pool: string | null = null) => {
    return knockoutMatches.filter(m => 
      m.knockoutStage === stageKey && 
      (pool === null || m.pool === pool)
    )
  }

  const canGenerateStage = (stage: KnockoutStageInfo): boolean => {
    // Round of 16 can always be generated if not exists
    if (stage.key === 'round_of_16') {
      return getStageMatches('round_of_16').length === 0
    }
    
    // Mega final requires both group finals to be completed
    if (stage.key === 'mega_final') {
      const groupFinals = getStageMatches('group_final')
      const poolAFinal = groupFinals.find(m => m.pool === 'A')
      const poolBFinal = groupFinals.find(m => m.pool === 'B')
      return poolAFinal?.status === 'completed' && 
             poolBFinal?.status === 'completed' &&
             getStageMatches('mega_final').length === 0
    }
    
    // Other stages require previous stage to be completed
    if (!stage.previousStage) return false
    
    const previousMatches = getStageMatches(stage.previousStage)
    const currentMatches = getStageMatches(stage.key)
    
    // Check if all previous stage matches are completed
    const allCompleted = previousMatches.length > 0 && 
                        previousMatches.every(m => m.status === 'completed')
    
    // Check if current stage doesn't exist yet
    const notYetCreated = currentMatches.length === 0
    
    return allCompleted && notYetCreated
  }

  const renderMatchCard = (match: Match) => (
    <div
      key={match.id}
      className={`bg-black/40 border-2 rounded-xl p-4 transition-all ${
        match.status === 'completed' 
          ? 'border-emerald-500/30 hover:border-emerald-500/50' 
          : 'border-yellow-500/30 hover:border-yellow-500/50'
      }`}
    >
      {editingMatchId === match.id ? (
        // Edit Mode
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
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
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
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
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className={`font-bold truncate ${
                match.winnerId === match.homePlayer.id ? 'text-emerald-400' : 'text-white'
              }`}>
                🏠 {match.homePlayer.name}
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {match.homeScore !== null ? match.homeScore : '-'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {editingOpponentMatchId === match.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-slate-400">✈️</span>
                    <select
                      value={editNewOpponentId}
                      onChange={(e) => setEditNewOpponentId(e.target.value)}
                      className="flex-1 px-2 py-1 bg-black/50 border border-purple-500/50 rounded text-white text-sm"
                    >
                      {allPlayers
                        .filter(p => p.id !== match.homePlayer.id && p.pool === match.pool)
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))
                      }
                    </select>
                    <button
                      onClick={() => saveEditedOpponent(match)}
                      className="p-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded text-emerald-400 transition-all"
                      title="Save opponent change"
                      disabled={processing}
                    >
                      <Save className="h-3 w-3" />
                    </button>
                    <button
                      onClick={cancelEditOpponent}
                      className="p-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-red-400 transition-all"
                      title="Cancel"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`font-bold truncate ${
                      match.winnerId === match.awayPlayer.id ? 'text-emerald-400' : 'text-white'
                    }`}>
                      ✈️ {match.awayPlayer.name}
                    </span>
                    {match.status === 'pending' && (
                      <button
                        onClick={() => startEditOpponent(match.id, match.awayPlayer.id)}
                        className="p-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded text-blue-400 transition-all shrink-0"
                        title="Change opponent"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
              <span className="text-2xl font-black text-purple-400 shrink-0">
                {match.awayScore !== null ? match.awayScore : '-'}
              </span>
            </div>
          </div>

          {match.winnerId && (
            <p className="text-xs text-emerald-400 mb-3">
              Winner: {match.winnerId === match.homePlayer.id ? match.homePlayer.name : match.awayPlayer.name}
              {match.absentStatus && match.absentStatus !== 'both_absent' ? (
                <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-xs font-bold">WO</span>
              ) : null}
            </p>
          )}
          {match.status === 'completed' && match.absentStatus === 'both_absent' && (
            <p className="text-xs text-slate-400 mb-3">
              <span className="px-2 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded text-slate-300 text-xs font-bold">NULL</span>
              <span className="ml-2">Both players absent</span>
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => startEditMatch(match)}
              className="flex-1 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-all text-purple-400 font-semibold text-sm"
            >
              {match.status === 'completed' ? 'Edit' : 'Enter Result'}
            </button>
            
            {match.status === 'completed' && (
              <button
                onClick={() => resetMatchResult(match.id)}
                disabled={resettingMatchId === match.id}
                className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg transition-all text-orange-400 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reset match to pending"
              >
                {resettingMatchId === match.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Resetting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    <span className="text-xs">Reset</span>
                  </>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )

  const renderStageSection = (stage: KnockoutStageInfo) => {
    const isMegaFinal = stage.key === 'mega_final'
    const poolAMatches = isMegaFinal ? [] : getStageMatches(stage.key, 'A')
    const poolBMatches = isMegaFinal ? [] : getStageMatches(stage.key, 'B')
    const megaFinalMatch = isMegaFinal ? getStageMatches(stage.key)[0] : null
    const stageExists = isMegaFinal ? !!megaFinalMatch : (poolAMatches.length > 0 || poolBMatches.length > 0)
    const canGenerate = canGenerateStage(stage)

    return (
      <div key={stage.key} className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Trophy className="h-6 w-6 text-purple-400" />
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
              {stage.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {!stageExists && canGenerate && (
              <button
                onClick={() => generateStage(stage.key)}
                disabled={processing}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Generate {stage.name}</span>
                  </>
                )}
              </button>
            )}
            
            {stageExists && (
              <>
                <Link
                  href="/admin/match-tasks"
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 border border-blue-500/50 rounded-xl transition-all text-white font-bold shadow-lg shadow-blue-500/30"
                  title="Manage task links for matches"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Task Links</span>
                </Link>
                <button
                  onClick={() => {
                    setShareStage(stage.key)
                    setIsShareModalOpen(true)
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 border border-yellow-500/50 rounded-xl transition-all text-black font-bold shadow-lg shadow-yellow-500/30"
                  title="Share this stage"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={() => deleteStage(stage.key)}
                  disabled={processing}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold rounded-xl transition-all disabled:opacity-50"
                  title="Delete this stage"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </>
            )}
            
            {!stageExists && !canGenerate && (
              <span className="text-sm text-slate-500">
                Complete previous stage first
              </span>
            )}
          </div>
        </div>
        
        {isMegaFinal && megaFinalMatch ? (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-4">
              <Crown className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
              <p className="text-yellow-400 font-bold">CHAMPIONSHIP MATCH</p>
            </div>
            {renderMatchCard(megaFinalMatch)}
          </div>
        ) : stageExists ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pool A */}
            <div>
              <h4 className="text-lg font-semibold text-blue-400 mb-4 flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Pool A ({poolAMatches.length} matches)</span>
              </h4>
              <div className="space-y-3">
                {poolAMatches.map(renderMatchCard)}
              </div>
            </div>
            
            {/* Pool B */}
            <div>
              <h4 className="text-lg font-semibold text-purple-400 mb-4 flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Pool B ({poolBMatches.length} matches)</span>
              </h4>
              <div className="space-y-3">
                {poolBMatches.map(renderMatchCard)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {canGenerate ? 'Ready to generate this stage' : 'Complete previous stages first'}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/tournament"
                className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-semibold">Back</span>
              </Link>
              <div className="h-6 w-px bg-purple-500/20"></div>
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-purple-400" />
                <h1 className="text-lg font-black bg-gradient-to-r from-purple-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent">
                  KNOCKOUT STAGE
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
        {activeTournament && (
          <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2">
              {activeTournament.name}
            </h2>
            <p className="text-slate-400">Knockout Stage Management</p>
            
            {/* Pool Progress Indicator */}
            {knockoutMatches.length === 0 && (
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                {knockoutReady ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-emerald-400 mb-1">✓ All Pool Matches Complete!</p>
                      <p className="text-sm text-slate-400">Round of 16 will be generated based on final standings</p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 font-bold text-sm">
                      READY
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-blue-400 mb-2">Pool Matches Progress</p>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-black/40 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${poolProgress.total > 0 ? (poolProgress.completed / poolProgress.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-400 font-medium">
                        {poolProgress.completed}/{poolProgress.total}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Complete all pool matches to unlock knockout stage</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Knockout Stages */}
        <div className="space-y-8">
          {knockoutStages.map(renderStageSection)}
        </div>
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
            matches={knockoutMatches.filter(m => m.knockoutStage === shareStage)}
            tournamentName={activeTournament.name}
            selectedRound={shareStage}
          />
        </Suspense>
      )}
    </div>
  )
}
