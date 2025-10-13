'use client'

import { useState, useEffect } from 'react'
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
  RefreshCw
} from 'lucide-react'

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
      } else {
        setError(data.details || data.error || 'Failed to generate stage')
      }
    } catch (err) {
      setError('Failed to generate knockout stage')
    } finally {
      setProcessing(false)
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
      
      <div className="space-y-2">
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
          <span className={`font-bold truncate ${
            match.winnerId === match.awayPlayer.id ? 'text-emerald-400' : 'text-white'
          }`}>
            ✈️ {match.awayPlayer.name}
          </span>
          <span className="text-2xl font-black text-purple-400">
            {match.awayScore !== null ? match.awayScore : '-'}
          </span>
        </div>
      </div>
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
          
          {!stageExists && !canGenerate && (
            <span className="text-sm text-slate-500">
              Complete previous stage first
            </span>
          )}
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
    </div>
  )
}
