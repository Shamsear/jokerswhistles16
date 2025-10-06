'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users, Loader2, Check, AlertCircle, Trophy, RefreshCw } from 'lucide-react'
import SpinWheel from '@/components/SpinWheel'

interface Player {
  id: string
  name: string
  pool: string | null
}

interface Match {
  player1Id: string
  player1Name: string
  player2Id: string
  player2Name: string
  round: number  // Global match number (for database compatibility)
  player1Round?: number  // Which round this is for player1
  player2Round?: number  // Which round this is for player2
}

export default function OpponentDrawPage() {
  const router = useRouter()
  const [tournament, setTournament] = useState<any>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [matches, setMatches] = useState<Match[]>([])
  const [availableOpponents, setAvailableOpponents] = useState<Player[]>([])
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedOpponent, setSelectedOpponent] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [needsPlayerSelection, setNeedsPlayerSelection] = useState(true)
  const [isSelectingFirstPlayer, setIsSelectingFirstPlayer] = useState(false)
  const [firstPlayerSelected, setFirstPlayerSelected] = useState(false)
  const [savedMatchIds, setSavedMatchIds] = useState<Set<string>>(new Set())
  const [isAutoGenerating, setIsAutoGenerating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isForceBalancing, setIsForceBalancing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false) // Default OFF for opponent draw since it's interactive

  const MATCHES_PER_PLAYER = 6

  useEffect(() => {
    fetchTournamentData()
  }, [])

  // Auto-refresh every 10 seconds for live updates (only when not actively spinning)
  useEffect(() => {
    if (!autoRefresh || loading || isSpinning || isSelectingFirstPlayer) return
    
    const interval = setInterval(() => {
      fetchTournamentData()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, loading, isSpinning, isSelectingFirstPlayer])

  // Auto-save each match as it's created
  useEffect(() => {
    if (matches.length > 0 && tournament) {
      // Save the latest match
      const latestMatch = matches[matches.length - 1]
      const matchId = `${latestMatch.player1Id}-${latestMatch.player2Id}`
      
      // Only save if not already saved
      if (!savedMatchIds.has(matchId)) {
        saveMatchToDatabase(latestMatch, matchId)
      }
    }
  }, [matches.length])

  useEffect(() => {
    if (players.length > 0 && currentPlayerIndex < players.length) {
      updateAvailableOpponents()
    }
  }, [currentPlayerIndex, currentRound, players, matches])

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

        if (activeTournament.phase !== 3) {
          setError('Tournament must be in Phase 3 for opponent draw')
          setLoading(false)
          return
        }

        setTournament(activeTournament)
        setPlayers(activeTournament.players)
        
        // Load existing matches from database
        await loadExistingMatches(activeTournament.id, activeTournament.players)
        
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

  const loadExistingMatches = async (tournamentId: string, playersList: Player[]) => {
    try {
      const response = await fetch(`/api/matches?tournamentId=${tournamentId}`)
      const data = await response.json()
      
      if (response.ok && data.matches && data.matches.length > 0) {
        // Convert database matches to our Match format
        const loadedMatches: Match[] = data.matches.map((m: any) => {
          const player1 = playersList.find(p => p.id === m.homePlayerId)
          const player2 = playersList.find(p => p.id === m.awayPlayerId)
          return {
            player1Id: m.homePlayerId,
            player1Name: player1?.name || 'Unknown',
            player2Id: m.awayPlayerId,
            player2Name: player2?.name || 'Unknown',
            round: m.round || 1
          }
        })
        
        setMatches(loadedMatches)
        
        // Mark all loaded matches as saved to prevent duplicate save attempts
        const savedIds = new Set(loadedMatches.map(m => `${m.player1Id}-${m.player2Id}`))
        setSavedMatchIds(savedIds)
        console.log('Loaded', loadedMatches.length, 'existing matches from database')
        
        // Determine if we need to continue or if it's complete
        const playersNeedingMatches = playersList.filter(p => {
          const count = loadedMatches.filter(m => m.player1Id === p.id || m.player2Id === p.id).length
          return count < MATCHES_PER_PLAYER
        })
        
        if (playersNeedingMatches.length === 0) {
          // All matches are complete
          setIsComplete(true)
          setNeedsPlayerSelection(false)
        } else {
          // Need to continue - show player selection
          setNeedsPlayerSelection(true)
        }
      }
    } catch (err) {
      console.error('Failed to load existing matches:', err)
      // Continue without loaded matches
    }
  }

  const saveMatchToDatabase = async (match: Match, matchId: string) => {
    try {
      // Get player pool from the first player
      const player = players.find(p => p.id === match.player1Id)
      const pool = player?.pool || null
      
      const payload = {
        tournamentId: tournament.id,
        homePlayerId: match.player1Id,
        awayPlayerId: match.player2Id,
        round: match.round || 1,
        pool: pool
      }
      
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      let data
      try {
        data = await response.json()
      } catch (e) {
        data = { error: 'Invalid response from server' }
      }
      
      if (!response.ok) {
        const errorMessage = data.error || `HTTP ${response.status}`
        
        // If it's a duplicate match error, that's actually okay
        if (errorMessage && errorMessage.toLowerCase().includes('already exists')) {
          setSavedMatchIds(prev => new Set([...prev, matchId]))
          return
        } else {
          if (!isAutoGenerating) {
            setError(`Warning: Match not saved - ${errorMessage}`)
          }
          throw new Error(errorMessage)
        }
      } else {
        setSavedMatchIds(prev => new Set([...prev, matchId]))
      }
    } catch (err) {
      if (!isAutoGenerating) {
        setError(`Warning: Failed to save match - ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
      throw err
    }
  }

  const handleSpinComplete = (selectedName: string) => {
    const opponent = availableOpponents.find(p => p.name === selectedName)
    if (opponent) {
      setSelectedOpponent(opponent)
      setIsSpinning(false)

      // Calculate which round this is for the current player
      const currentPlayer = players[currentPlayerIndex]
      const currentPlayerMatchCount = matches.filter(
        m => m.player1Id === currentPlayer.id || m.player2Id === currentPlayer.id
      ).length
      
      const newMatch: Match = {
        player1Id: currentPlayer.id,
        player1Name: currentPlayer.name,
        player2Id: opponent.id,
        player2Name: opponent.name,
        round: currentPlayerMatchCount + 1  // Use the current player's round number
      }

      setMatches(prev => [...prev, newMatch])
      // Modal stays open - user must close it manually
    }
  }

  const handleWheelClose = () => {
    if (selectedOpponent && !isSpinning) {
      // User closed the modal, now move to next selection
      moveToNextSelection()
    }
    setIsSpinning(false)
    setSelectedOpponent(null)
  }

  const updateAvailableOpponents = () => {
    const currentPlayer = players[currentPlayerIndex]
    if (!currentPlayer) return

    // Get all players that current player has already been matched with
    const matchedPlayerIds = matches
      .filter(m => m.player1Id === currentPlayer.id || m.player2Id === currentPlayer.id)
      .map(m => m.player1Id === currentPlayer.id ? m.player2Id : m.player1Id)

    // Available opponents: players from same pool who:
    // 1. Are not the current player
    // 2. Haven't been matched with current player yet
    // 3. Still need matches (have less than 6)
    const available = players.filter(p => {
      if (p.id === currentPlayer.id) return false
      if (matchedPlayerIds.includes(p.id)) return false
      if (p.pool !== currentPlayer.pool) return false
      
      // Check if this opponent still needs matches
      const opponentMatchCount = matches.filter(
        m => m.player1Id === p.id || m.player2Id === p.id
      ).length
      
      return opponentMatchCount < MATCHES_PER_PLAYER
    })

    setAvailableOpponents(available)
  }


  const moveToNextSelection = () => {
    setSelectedOpponent(null)

    // Check if current player has completed all matches
    const currentPlayer = players[currentPlayerIndex]
    const currentPlayerMatches = matches.filter(
      m => m.player1Id === currentPlayer.id || m.player2Id === currentPlayer.id
    ).length // Match already added in handleSpinComplete, no need for +1

    if (currentPlayerMatches >= MATCHES_PER_PLAYER) {
      // Determine if any players still need matches
      const playersNeedingMatches = players.filter(p => {
        const count = matches.filter(m => m.player1Id === p.id || m.player2Id === p.id).length
        return count < MATCHES_PER_PLAYER
      })

      if (playersNeedingMatches.length === 0) {
        // All players have completed their matches
        setIsComplete(true)
        return
      }

      // Open the player selection wheel to pick the next player from those who still need matches
      setNeedsPlayerSelection(true)
      setIsSelectingFirstPlayer(true)
      setFirstPlayerSelected(false)
      setCurrentRound(1)
    } else {
      // Continue with next round for same player
      setCurrentRound(currentRound + 1)
    }
  }

  const startSpin = () => {
    if (availableOpponents.length === 0) {
      setError('No available opponents for this player')
      return
    }
    setIsSpinning(true)
    setSelectedOpponent(null)
  }

  const startFirstPlayerSpin = () => {
    setIsSelectingFirstPlayer(true)
  }

  const handleFirstPlayerSelected = (selectedName: string) => {
    const selectedPlayerIndex = players.findIndex(p => p.name === selectedName)
    if (selectedPlayerIndex !== -1) {
      setCurrentPlayerIndex(selectedPlayerIndex)
      setFirstPlayerSelected(true)
      // Keep modal open to show result and allow share/download
    }
  }

  const handleFirstPlayerWheelClose = () => {
    if (firstPlayerSelected) {
      // User has selected a player and closed the wheel, proceed to opponent draw
      setNeedsPlayerSelection(false)
    }
    setIsSelectingFirstPlayer(false)
  }

  const resetAllMatches = async () => {
    if (!confirm('This will DELETE all matches and restart from scratch. Continue?')) {
      return
    }

    setIsResetting(true)
    try {
      // Delete all matches for this tournament
      const response = await fetch(`/api/matches?tournamentId=${tournament.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMatches([])
        setSavedMatchIds(new Set())
        setIsComplete(false)
        setCurrentPlayerIndex(0)
        setCurrentRound(1)
        setNeedsPlayerSelection(true)
        setError('')
        console.log('All matches deleted successfully')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete matches')
      }
    } catch (err) {
      setError('Failed to reset matches')
      console.error(err)
    } finally {
      setIsResetting(false)
    }
  }

  const autoGenerateAllMatches = async () => {
    if (!confirm('This will automatically generate all remaining matches with verification. Continue?')) {
      return
    }

    setIsAutoGenerating(true)
    let currentMatches = [...matches]
    const newMatchesToSave: Match[] = []
    
    // Initialize home/away tracking for all players
    const homeAwayBalance = new Map<string, { home: number; away: number }>()
    players.forEach(p => homeAwayBalance.set(p.id, { home: 0, away: 0 }))
    
    // Account for existing matches
    currentMatches.forEach(m => {
      homeAwayBalance.get(m.player1Id)!.home += 1
      homeAwayBalance.get(m.player2Id)!.away += 1
    })
    
    try {
      console.log('Starting match generation with home/away balancing...')
      
      // PASS 1: Initial greedy generation
      console.log('Pass 1: Initial generation')
      let iterations = 0
      const maxIterationsPerPass = players.length * MATCHES_PER_PLAYER * 3
      
      while (iterations < maxIterationsPerPass) {
        iterations++
        
        const playersNeedingMatches = players.filter(p => {
          const count = currentMatches.filter(m => m.player1Id === p.id || m.player2Id === p.id).length
          return count < MATCHES_PER_PLAYER
        })

        if (playersNeedingMatches.length === 0) {
          console.log(`Pass 1 complete: All players have 6 matches`)
          break
        }
        
        if (playersNeedingMatches.length === 1) {
          console.warn('Stuck: Only one player needs matches')
          break
        }

        // Priority: Players with fewer matches go first
        const sortedPlayers = playersNeedingMatches.sort((a, b) => {
          const aCount = currentMatches.filter(m => m.player1Id === a.id || m.player2Id === a.id).length
          const bCount = currentMatches.filter(m => m.player1Id === b.id || m.player2Id === b.id).length
          return aCount - bCount
        })
        
        const player = sortedPlayers[0]
        const playerMatchCount = currentMatches.filter(m => m.player1Id === player.id || m.player2Id === player.id).length
        
        const matchedPlayerIds = currentMatches
          .filter(m => m.player1Id === player.id || m.player2Id === player.id)
          .map(m => m.player1Id === player.id ? m.player2Id : m.player1Id)
        
        const availableOpponents = players.filter(p => {
          if (p.id === player.id) return false
          if (matchedPlayerIds.includes(p.id)) return false
          if (p.pool !== player.pool) return false
          
          const opponentMatchCount = currentMatches.filter(m => m.player1Id === p.id || m.player2Id === p.id).length
          return opponentMatchCount < MATCHES_PER_PLAYER
        })
        
        if (availableOpponents.length === 0) {
          // Try to find ANY opponent in same pool even if they have 6 matches
          const anyOpponents = players.filter(p => {
            if (p.id === player.id) return false
            if (matchedPlayerIds.includes(p.id)) return false
            if (p.pool !== player.pool) return false
            return true
          })
          
          if (anyOpponents.length === 0) {
            console.warn(`No opponents available for ${player.name} in pool ${player.pool}`)
            break
          }
        }
        
        if (availableOpponents.length > 0) {
          // Prefer opponents with fewer matches
          const sortedOpponents = availableOpponents.sort((a, b) => {
            const aCount = currentMatches.filter(m => m.player1Id === a.id || m.player2Id === a.id).length
            const bCount = currentMatches.filter(m => m.player1Id === b.id || m.player2Id === b.id).length
            return aCount - bCount
          })
          
          const opponent = sortedOpponents[0]
          
          // DETERMINE HOME/AWAY: Who should be home?
          const playerBalance = homeAwayBalance.get(player.id)!
          const opponentBalance = homeAwayBalance.get(opponent.id)!
          
          const playerHomeNeeded = 3 - playerBalance.home
          const opponentHomeNeeded = 3 - opponentBalance.home
          
          // Decision: Assign home to whoever needs it more
          let homePlayerId: string, homePlayerName: string
          let awayPlayerId: string, awayPlayerName: string
          
          if (playerHomeNeeded > opponentHomeNeeded) {
            homePlayerId = player.id
            homePlayerName = player.name
            awayPlayerId = opponent.id
            awayPlayerName = opponent.name
          } else if (opponentHomeNeeded > playerHomeNeeded) {
            homePlayerId = opponent.id
            homePlayerName = opponent.name
            awayPlayerId = player.id
            awayPlayerName = player.name
          } else {
            // Equal need: randomize
            if (Math.random() < 0.5) {
              homePlayerId = player.id
              homePlayerName = player.name
              awayPlayerId = opponent.id
              awayPlayerName = opponent.name
            } else {
              homePlayerId = opponent.id
              homePlayerName = opponent.name
              awayPlayerId = player.id
              awayPlayerName = player.name
            }
          }
          
          const newMatch: Match = {
            player1Id: homePlayerId,
            player1Name: homePlayerName,
            player2Id: awayPlayerId,
            player2Name: awayPlayerName,
            round: playerMatchCount + 1
          }
          
          // Update home/away tracking
          homeAwayBalance.get(homePlayerId)!.home += 1
          homeAwayBalance.get(awayPlayerId)!.away += 1
          
          currentMatches.push(newMatch)
          newMatchesToSave.push(newMatch)
          
          if (newMatchesToSave.length % 20 === 0) {
            setMatches([...currentMatches])
            await new Promise(r => setTimeout(r, 50))
          }
        }
      }
      
      // PASS 2-5: Verification and correction passes
      for (let pass = 2; pass <= 5; pass++) {
        console.log(`Pass ${pass}: Verification and correction`)
        
        const playersNeedingMatches = players.filter(p => {
          const count = currentMatches.filter(m => m.player1Id === p.id || m.player2Id === p.id).length
          return count < MATCHES_PER_PLAYER
        })
        
        if (playersNeedingMatches.length === 0) {
          console.log(`Pass ${pass}: All players verified with 6 matches!`)
          break
        }
        
        console.log(`Pass ${pass}: ${playersNeedingMatches.length} players still need matches`)
        
        // Try to create missing matches
        for (const player of playersNeedingMatches) {
          const playerMatchCount = currentMatches.filter(m => m.player1Id === player.id || m.player2Id === player.id).length
          const needed = MATCHES_PER_PLAYER - playerMatchCount
          
          const matchedPlayerIds = currentMatches
            .filter(m => m.player1Id === player.id || m.player2Id === player.id)
            .map(m => m.player1Id === player.id ? m.player2Id : m.player1Id)
          
          const poolPlayers = players.filter(p => p.pool === player.pool && p.id !== player.id)
          const unmatched = poolPlayers.filter(p => !matchedPlayerIds.includes(p.id))
          
          for (let i = 0; i < needed && i < unmatched.length; i++) {
            const opponent = unmatched[i]
            
            // DETERMINE HOME/AWAY for correction pass
            const playerBalance = homeAwayBalance.get(player.id)!
            const opponentBalance = homeAwayBalance.get(opponent.id)!
            
            const playerHomeNeeded = 3 - playerBalance.home
            const opponentHomeNeeded = 3 - opponentBalance.home
            
            let homePlayerId: string, homePlayerName: string
            let awayPlayerId: string, awayPlayerName: string
            
            if (playerHomeNeeded > opponentHomeNeeded) {
              homePlayerId = player.id
              homePlayerName = player.name
              awayPlayerId = opponent.id
              awayPlayerName = opponent.name
            } else if (opponentHomeNeeded > playerHomeNeeded) {
              homePlayerId = opponent.id
              homePlayerName = opponent.name
              awayPlayerId = player.id
              awayPlayerName = player.name
            } else {
              if (Math.random() < 0.5) {
                homePlayerId = player.id
                homePlayerName = player.name
                awayPlayerId = opponent.id
                awayPlayerName = opponent.name
              } else {
                homePlayerId = opponent.id
                homePlayerName = opponent.name
                awayPlayerId = player.id
                awayPlayerName = player.name
              }
            }
            
            const newMatch: Match = {
              player1Id: homePlayerId,
              player1Name: homePlayerName,
              player2Id: awayPlayerId,
              player2Name: awayPlayerName,
              round: playerMatchCount + i + 1
            }
            
            homeAwayBalance.get(homePlayerId)!.home += 1
            homeAwayBalance.get(awayPlayerId)!.away += 1
            
            currentMatches.push(newMatch)
            newMatchesToSave.push(newMatch)
          }
        }
        
        setMatches([...currentMatches])
        await new Promise(r => setTimeout(r, 100))
      }
      
      // Final verification: Check match counts
      const finalCheck = players.map(p => ({
        name: p.name,
        pool: p.pool,
        matches: currentMatches.filter(m => m.player1Id === p.id || m.player2Id === p.id).length
      }))
      
      const incomplete = finalCheck.filter(p => p.matches < MATCHES_PER_PLAYER)
      
      if (incomplete.length > 0) {
        console.error('Match count verification failed:', incomplete)
        setError(`Some players still incomplete: ${incomplete.map(p => `${p.name} (${p.matches}/6)`).join(', ')}`)
      } else {
        console.log('✅ Match count verified: All players have exactly 6 matches!')
      }
      
      setMatches([...currentMatches])
      
      // REFINEMENT PASS: Fix any remaining home/away imbalances
      console.log('Starting home/away refinement pass...')
      
      // Rebuild accurate home/away counts
      const finalHomeCounts = new Map<string, { home: number; away: number; total: number }>()
      players.forEach(p => finalHomeCounts.set(p.id, { home: 0, away: 0, total: 0 }))
      currentMatches.forEach(m => {
        finalHomeCounts.get(m.player1Id)!.home += 1
        finalHomeCounts.get(m.player1Id)!.total += 1
        finalHomeCounts.get(m.player2Id)!.away += 1
        finalHomeCounts.get(m.player2Id)!.total += 1
      })
      
      // STRATEGY 1: Multi-pass home/away swapping
      console.log('Strategy 1: Simple home/away swapping...')
      let refinePass = 0
      let remainingImbalance = Array.from(finalHomeCounts.values()).filter(c => c.home !== 3).length
      
      while (remainingImbalance > 0 && refinePass < 100) {
        refinePass++
        let swapsThisPass = 0
        
        for (let i = 0; i < currentMatches.length; i++) {
          const match = currentMatches[i]
          const p1Id = match.player1Id
          const p2Id = match.player2Id
          const p1Counts = finalHomeCounts.get(p1Id)!
          const p2Counts = finalHomeCounts.get(p2Id)!
          
          const p1Target = 3
          const p2Target = 3
          
          // Calculate cost before and after swap
          const costBefore = Math.abs(p1Counts.home - p1Target) + Math.abs(p2Counts.home - p2Target)
          const costAfter = Math.abs((p1Counts.home - 1) - p1Target) + Math.abs((p2Counts.home + 1) - p2Target)
          
          if (costAfter < costBefore) {
            // Swap home/away
            currentMatches[i] = {
              ...match,
              player1Id: p2Id,
              player1Name: match.player2Name,
              player2Id: p1Id,
              player2Name: match.player1Name
            }
            
            // Update counts
            p1Counts.home -= 1
            p1Counts.away += 1
            p2Counts.home += 1
            p2Counts.away -= 1
            swapsThisPass++
          }
        }
        
        remainingImbalance = Array.from(finalHomeCounts.values()).filter(c => c.home !== 3).length
        
        if (refinePass % 10 === 0 || remainingImbalance === 0) {
          console.log(`  Pass ${refinePass}: ${swapsThisPass} swaps, ${remainingImbalance} still imbalanced`)
        }
        
        if (swapsThisPass === 0) break // Can't improve further with this strategy
      }
      
      console.log(`After Strategy 1: ${remainingImbalance} players still imbalanced`)
      
      // STRATEGY 2: Exhaustive match pair swapping (if still imbalanced)
      if (remainingImbalance > 0) {
        console.log('Strategy 2: Exhaustive match optimization...')
        let swapPass = 0
        
        while (remainingImbalance > 0 && swapPass < 200) {
          swapPass++
          let improvementsThisPass = 0
          
          // Try all pairs of matches for potential swaps
          // Shuffle order each pass to avoid getting stuck
          const matchIndices = Array.from({ length: currentMatches.length }, (_, i) => i)
          if (swapPass > 1) {
            // Shuffle to try different combinations
            for (let k = matchIndices.length - 1; k > 0; k--) {
              const randIdx = Math.floor(Math.random() * (k + 1))
              ;[matchIndices[k], matchIndices[randIdx]] = [matchIndices[randIdx], matchIndices[k]]
            }
          }
          
          for (let iIdx = 0; iIdx < matchIndices.length; iIdx++) {
            const i = matchIndices[iIdx]
            for (let jIdx = iIdx + 1; jIdx < matchIndices.length; jIdx++) {
              const j = matchIndices[jIdx]
              const match1 = currentMatches[i]
              const match2 = currentMatches[j]
              
              const p1 = match1.player1Id
              const p2 = match1.player2Id
              const p3 = match2.player1Id
              const p4 = match2.player2Id
              
              // Skip if any player appears in both matches
              if (p1 === p3 || p1 === p4 || p2 === p3 || p2 === p4) continue
              
              const p1Counts = finalHomeCounts.get(p1)!
              const p2Counts = finalHomeCounts.get(p2)!
              const p3Counts = finalHomeCounts.get(p3)!
              const p4Counts = finalHomeCounts.get(p4)!
              
              const costBefore = Math.abs(p1Counts.home - 3) + Math.abs(p2Counts.home - 3) + Math.abs(p3Counts.home - 3) + Math.abs(p4Counts.home - 3)
              
              // Get pools
              const p1Pool = players.find(p => p.id === p1)!.pool
              const p2Pool = players.find(p => p.id === p2)!.pool
              const p3Pool = players.find(p => p.id === p3)!.pool
              const p4Pool = players.find(p => p.id === p4)!.pool
              
              // Try 4 different swap configurations
              const configurations = [
                // Config 1: Swap away players (p1 vs p4, p3 vs p2)
                {
                  m1: { h: p1, a: p4, valid: p1Pool === p4Pool && p3Pool === p2Pool },
                  m2: { h: p3, a: p2 },
                  counts: { p1: p1Counts.home, p2: p2Counts.home + 1, p3: p3Counts.home, p4: p4Counts.home - 1 }
                },
                // Config 2: Swap home players (p3 vs p2, p1 vs p4)
                {
                  m1: { h: p3, a: p2, valid: p3Pool === p2Pool && p1Pool === p4Pool },
                  m2: { h: p1, a: p4 },
                  counts: { p1: p1Counts.home, p2: p2Counts.home + 1, p3: p3Counts.home, p4: p4Counts.home - 1 }
                },
                // Config 3: Cross swap (p1 vs p3, p4 vs p2) with role reversal
                {
                  m1: { h: p1, a: p3, valid: p1Pool === p3Pool && p4Pool === p2Pool },
                  m2: { h: p4, a: p2 },
                  counts: { p1: p1Counts.home, p2: p2Counts.home + 1, p3: p3Counts.home - 1, p4: p4Counts.home + 1 }
                },
                // Config 4: Different cross swap (p3 vs p2, p4 vs p1) - full reversal
                {
                  m1: { h: p4, a: p2, valid: p4Pool === p2Pool && p3Pool === p1Pool },
                  m2: { h: p3, a: p1 },
                  counts: { p1: p1Counts.home - 1, p2: p2Counts.home + 1, p3: p3Counts.home, p4: p4Counts.home + 1 }
                }
              ]
              
              for (const config of configurations) {
                if (!config.m1.valid) continue
                
                const { p1: newP1Home, p2: newP2Home, p3: newP3Home, p4: newP4Home } = config.counts
                const costAfter = Math.abs(newP1Home - 3) + Math.abs(newP2Home - 3) + Math.abs(newP3Home - 3) + Math.abs(newP4Home - 3)
                
                if (costAfter >= costBefore) continue
                
                // Check for duplicate matches
                const wouldDuplicate1 = currentMatches.some((m, idx) => 
                  idx !== i && idx !== j && 
                  ((m.player1Id === config.m1.h && m.player2Id === config.m1.a) || (m.player2Id === config.m1.h && m.player1Id === config.m1.a))
                )
                const wouldDuplicate2 = currentMatches.some((m, idx) => 
                  idx !== i && idx !== j && 
                  ((m.player1Id === config.m2.h && m.player2Id === config.m2.a) || (m.player2Id === config.m2.h && m.player1Id === config.m2.a))
                )
                
                if (wouldDuplicate1 || wouldDuplicate2) continue
                
                // Perform the swap
                currentMatches[i] = {
                  player1Id: config.m1.h,
                  player1Name: players.find(p => p.id === config.m1.h)!.name,
                  player2Id: config.m1.a,
                  player2Name: players.find(p => p.id === config.m1.a)!.name,
                  round: match1.round
                }
                currentMatches[j] = {
                  player1Id: config.m2.h,
                  player1Name: players.find(p => p.id === config.m2.h)!.name,
                  player2Id: config.m2.a,
                  player2Name: players.find(p => p.id === config.m2.a)!.name,
                  round: match2.round
                }
                
                // Update counts
                p1Counts.home = newP1Home
                p1Counts.away = 6 - newP1Home
                p2Counts.home = newP2Home
                p2Counts.away = 6 - newP2Home
                p3Counts.home = newP3Home
                p3Counts.away = 6 - newP3Home
                p4Counts.home = newP4Home
                p4Counts.away = 6 - newP4Home
                
                improvementsThisPass++
                break
              }
            }
          }
          
          remainingImbalance = Array.from(finalHomeCounts.values()).filter(c => c.home !== 3).length
          
          if (swapPass % 10 === 0 || remainingImbalance === 0) {
            console.log(`  Optimization pass ${swapPass}: ${improvementsThisPass} improvements, ${remainingImbalance} still imbalanced`)
          }
          
          if (remainingImbalance === 0) {
            console.log(`Strategy 2 achieved perfect balance after ${swapPass} passes!`)
            break
          }
          if (improvementsThisPass === 0) break // Can't improve further with this strategy
        }
        
        console.log(`After Strategy 2: ${remainingImbalance} players still imbalanced`)
      }
      
      // STRATEGY 3: Targeted greedy fix for remaining imbalances
      if (remainingImbalance > 0) {
        console.log('Strategy 3: Targeted greedy balancing...')
        let targetPass = 0
        
        while (remainingImbalance > 0 && targetPass < 200) {
          targetPass++
          // Find the most imbalanced players
          const imbalancedPlayers = players
            .map(p => ({
              id: p.id,
              name: p.name,
              pool: p.pool,
              counts: finalHomeCounts.get(p.id)!,
              imbalance: Math.abs(finalHomeCounts.get(p.id)!.home - 3)
            }))
            .filter(p => p.imbalance > 0)
            .sort((a, b) => b.imbalance - a.imbalance) // Most imbalanced first
          
          if (imbalancedPlayers.length === 0) break
          
          let fixesThisPass = 0
          
          for (const player of imbalancedPlayers) {
            const needsMoreHome = player.counts.home < 3
            const deficit = Math.abs(player.counts.home - 3)
            
            // Find this player's matches
            const playerMatchIndices = currentMatches
              .map((m, idx) => ({ match: m, idx }))
              .filter(({ match }) => match.player1Id === player.id || match.player2Id === player.id)
            
            for (const { match: playerMatch, idx: playerMatchIdx } of playerMatchIndices) {
              if (player.counts.home === 3) break // Already balanced
              
              const isPlayerHome = playerMatch.player1Id === player.id
              const opponentId = isPlayerHome ? playerMatch.player2Id : playerMatch.player1Id
              const opponentCounts = finalHomeCounts.get(opponentId)!
              
              // Strategy 3a: Simple swap if opponent also benefits
              if (needsMoreHome && !isPlayerHome && opponentCounts.home > 3) {
                // Player needs home, opponent has too many home - perfect swap!
                currentMatches[playerMatchIdx] = {
                  ...playerMatch,
                  player1Id: playerMatch.player2Id,
                  player1Name: playerMatch.player2Name,
                  player2Id: playerMatch.player1Id,
                  player2Name: playerMatch.player1Name
                }
                player.counts.home += 1
                player.counts.away -= 1
                opponentCounts.home -= 1
                opponentCounts.away += 1
                fixesThisPass++
                continue
              }
              
              if (!needsMoreHome && isPlayerHome && opponentCounts.home < 3) {
                // Player has too many home, opponent needs home - perfect swap!
                currentMatches[playerMatchIdx] = {
                  ...playerMatch,
                  player1Id: playerMatch.player2Id,
                  player1Name: playerMatch.player2Name,
                  player2Id: playerMatch.player1Id,
                  player2Name: playerMatch.player1Name
                }
                player.counts.home -= 1
                player.counts.away += 1
                opponentCounts.home += 1
                opponentCounts.away -= 1
                fixesThisPass++
                continue
              }
              
              // Strategy 3b: Find another match to swap opponents with
              for (let otherIdx = 0; otherIdx < currentMatches.length; otherIdx++) {
                if (otherIdx === playerMatchIdx) continue
                if (player.counts.home === 3) break
                
                const otherMatch = currentMatches[otherIdx]
                
                // Skip if player is in this match
                if (otherMatch.player1Id === player.id || otherMatch.player2Id === player.id) continue
                
                const other1 = otherMatch.player1Id
                const other2 = otherMatch.player2Id
                const other1Counts = finalHomeCounts.get(other1)!
                const other2Counts = finalHomeCounts.get(other2)!
                
                // Get pools
                const playerPool = players.find(p => p.id === player.id)!.pool
                const opponentPool = players.find(p => p.id === opponentId)!.pool
                const other1Pool = players.find(p => p.id === other1)!.pool
                const other2Pool = players.find(p => p.id === other2)!.pool
                
                // Try swapping player's opponent with other match's away player
                if (needsMoreHome && !isPlayerHome && playerPool === other2Pool && opponentPool === other1Pool) {
                  const costBefore = player.imbalance + Math.abs(opponentCounts.home - 3) + Math.abs(other1Counts.home - 3) + Math.abs(other2Counts.home - 3)
                  const costAfter = Math.abs(player.counts.home + 1 - 3) + Math.abs(opponentCounts.home - 3) + Math.abs(other1Counts.home - 3) + Math.abs(other2Counts.home - 1 - 3)
                  
                  if (costAfter < costBefore) {
                    // Check no duplicates
                    const dup1 = currentMatches.some((m, i) => i !== playerMatchIdx && i !== otherIdx && 
                      ((m.player1Id === player.id && m.player2Id === other2) || (m.player2Id === player.id && m.player1Id === other2)))
                    const dup2 = currentMatches.some((m, i) => i !== playerMatchIdx && i !== otherIdx && 
                      ((m.player1Id === other1 && m.player2Id === opponentId) || (m.player2Id === other1 && m.player1Id === opponentId)))
                    
                    if (!dup1 && !dup2) {
                      currentMatches[playerMatchIdx] = {
                        player1Id: player.id,
                        player1Name: player.name,
                        player2Id: other2,
                        player2Name: players.find(p => p.id === other2)!.name,
                        round: playerMatch.round
                      }
                      currentMatches[otherIdx] = {
                        player1Id: other1,
                        player1Name: players.find(p => p.id === other1)!.name,
                        player2Id: opponentId,
                        player2Name: players.find(p => p.id === opponentId)!.name,
                        round: otherMatch.round
                      }
                      
                      player.counts.home += 1
                      player.counts.away -= 1
                      other2Counts.home -= 1
                      other2Counts.away += 1
                      fixesThisPass++
                      break
                    }
                  }
                }
              }
            }
          }
          
          remainingImbalance = Array.from(finalHomeCounts.values()).filter(c => c.home !== 3).length
          
          if (targetPass % 10 === 0 || remainingImbalance === 0) {
            console.log(`  Target pass ${targetPass}: ${fixesThisPass} fixes, ${remainingImbalance} still imbalanced`)
          }
          
          if (remainingImbalance === 0) {
            console.log(`Strategy 3 achieved perfect balance after ${targetPass} passes!`)
            break
          }
          if (fixesThisPass === 0) break // Can't improve further with this strategy
        }
        
        console.log(`After Strategy 3: ${remainingImbalance} players still imbalanced`)
      }
      
      // STRATEGY 4: Force-balance by any means necessary
      if (remainingImbalance > 0) {
        console.log('Strategy 4: Force-balance remaining players...')
        console.warn('Using aggressive balancing - will not stop until perfect balance')
        let forcePass = 0
        
        while (remainingImbalance > 0 && forcePass < 500) {
          forcePass++
          const imbalancedPlayers = players
            .map(p => ({
              id: p.id,
              name: p.name,
              pool: p.pool,
              counts: finalHomeCounts.get(p.id)!,
              homeDeficit: 3 - finalHomeCounts.get(p.id)!.home // Positive if needs home, negative if needs away
            }))
            .filter(p => p.homeDeficit !== 0)
            .sort((a, b) => Math.abs(b.homeDeficit) - Math.abs(a.homeDeficit))
          
          if (imbalancedPlayers.length === 0) break
          
          // Try to pair up complementary imbalances
          const needsHome = imbalancedPlayers.filter(p => p.homeDeficit > 0)
          const needsAway = imbalancedPlayers.filter(p => p.homeDeficit < 0)
          
          let fixesThisPass = 0
          
          // Try to find matches between players with opposite needs
          for (const playerA of needsHome) {
            if (playerA.homeDeficit === 0) continue
            
            for (const playerB of needsAway) {
              if (playerB.homeDeficit === 0) continue
              
              // Find if these two players have a match together
              const directMatchIdx = currentMatches.findIndex(m => 
                (m.player1Id === playerA.id && m.player2Id === playerB.id) ||
                (m.player1Id === playerB.id && m.player2Id === playerA.id)
              )
              
              if (directMatchIdx !== -1) {
                const match = currentMatches[directMatchIdx]
                // playerA needs home, playerB needs away - check if they need swapping
                if (match.player1Id === playerB.id && match.player2Id === playerA.id) {
                  // Swap them
                  currentMatches[directMatchIdx] = {
                    ...match,
                    player1Id: playerA.id,
                    player1Name: playerA.name,
                    player2Id: playerB.id,
                    player2Name: playerB.name
                  }
                  playerA.counts.home += 1
                  playerA.counts.away -= 1
                  playerA.homeDeficit -= 1
                  playerB.counts.home -= 1
                  playerB.counts.away += 1
                  playerB.homeDeficit += 1
                  fixesThisPass++
                }
              }
            }
          }
          
          // If direct matches didn't work, try complex swaps
          if (fixesThisPass === 0 && imbalancedPlayers.length > 0) {
            // Pick the most imbalanced player and force a fix
            const player = imbalancedPlayers[0]
            const needsHome = player.homeDeficit > 0
            
            // Find ANY match involving this player where we can improve
            for (let i = 0; i < currentMatches.length; i++) {
              const match = currentMatches[i]
              if (match.player1Id !== player.id && match.player2Id !== player.id) continue
              
              const isHome = match.player1Id === player.id
              const opponentId = isHome ? match.player2Id : match.player1Id
              const opponentCounts = finalHomeCounts.get(opponentId)!
              
              // If player needs home and is away, OR player needs away and is home
              if ((needsHome && !isHome) || (!needsHome && isHome)) {
                // Just swap - even if opponent doesn't benefit
                currentMatches[i] = {
                  ...match,
                  player1Id: match.player2Id,
                  player1Name: match.player2Name,
                  player2Id: match.player1Id,
                  player2Name: match.player1Name
                }
                
                if (needsHome) {
                  player.counts.home += 1
                  player.counts.away -= 1
                  player.homeDeficit -= 1
                  opponentCounts.home -= 1
                  opponentCounts.away += 1
                } else {
                  player.counts.home -= 1
                  player.counts.away += 1
                  player.homeDeficit += 1
                  opponentCounts.home += 1
                  opponentCounts.away -= 1
                }
                
                fixesThisPass++
                break
              }
            }
          }
          
          remainingImbalance = Array.from(finalHomeCounts.values()).filter(c => c.home !== 3).length
          
          if (forcePass % 10 === 0 || remainingImbalance === 0) {
            console.log(`  Force pass ${forcePass}: ${fixesThisPass} fixes, ${remainingImbalance} still imbalanced`)
          }
          
          if (remainingImbalance === 0) {
            console.log(`✅ Force-balance achieved perfect balance after ${forcePass} passes!`)
            break
          }
          if (fixesThisPass === 0) {
            console.warn(`⚠️ Force-balance stuck after ${forcePass} passes with ${remainingImbalance} still imbalanced`)
            console.warn('This may indicate an impossible balancing scenario. Attempting recovery...')
            // Try one more round of all strategies before giving up
            break
          }
        }
        
        if (remainingImbalance > 0) {
          console.error(`❌ Unable to achieve perfect balance. ${remainingImbalance} players still imbalanced.`)
          console.log('This may be due to pool constraints making perfect balance impossible.')
        } else {
          console.log(`✅ Strategy 4 complete: Perfect balance achieved!`)
        }
      }
      
      // Final verification
      console.log('Verifying home/away balance...')
      const homeAwayCheck = players.map(p => {
        const homeCount = currentMatches.filter(m => m.player1Id === p.id).length
        const awayCount = currentMatches.filter(m => m.player2Id === p.id).length
        return { name: p.name, home: homeCount, away: awayCount, target: 3 }
      })
      
      const imbalanced = homeAwayCheck.filter(p => p.home !== 3 || p.away !== 3)
      if (imbalanced.length === 0) {
        console.log('✅ Home/Away balance verified: All players have 3 home and 3 away!')
      } else {
        console.log('⚠️ Home/Away imbalances detected:')
        imbalanced.forEach(p => console.log(`  ${p.name}: ${p.home} home, ${p.away} away`))
      }
      
      setMatches([...currentMatches])
      
      // Bulk save all new matches to database in one request
      if (newMatchesToSave.length > 0) {
        console.log(`Saving ${newMatchesToSave.length} matches to database...`)
        
        try {
          // Get pool from first player
          const bulkMatches = newMatchesToSave.map(match => {
            const player = players.find(p => p.id === match.player1Id)
            return {
              homePlayerId: match.player1Id,
              awayPlayerId: match.player2Id,
              round: match.round,
              pool: player?.pool || null
            }
          })
          
          const response = await fetch('/api/matches/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tournamentId: tournament.id,
              matches: bulkMatches
            })
          })
          
          const data = await response.json()
          
          if (response.ok) {
            console.log(`Successfully saved ${data.created} matches!`)
          } else {
            setError(`Warning: Some matches may not have been saved - ${data.error}`)
          }
        } catch (err) {
          console.error('Failed to bulk save matches:', err)
          setError('Warning: Failed to save matches to database')
        }
      }
      
      setIsComplete(true)
      setIsAutoGenerating(false)
      
    } catch (err) {
      console.error('Failed to auto-generate matches:', err)
      setError('Failed to auto-generate matches')
      setIsAutoGenerating(false)
    }
  }

  const forceBalanceCheck = async () => {
    if (!confirm('This will analyze and fix any home/away imbalances. Continue?')) {
      return
    }

    setIsForceBalancing(true)
    let currentMatches = [...matches]
    
    try {
      console.log('Starting force balance check...')
      
      // Build home/away counts
      const finalHomeCounts = new Map<string, { home: number; away: number; total: number }>()
      players.forEach(p => finalHomeCounts.set(p.id, { home: 0, away: 0, total: 0 }))
      currentMatches.forEach(m => {
        finalHomeCounts.get(m.player1Id)!.home += 1
        finalHomeCounts.get(m.player1Id)!.total += 1
        finalHomeCounts.get(m.player2Id)!.away += 1
        finalHomeCounts.get(m.player2Id)!.total += 1
      })
      
      let remainingImbalance = Array.from(finalHomeCounts.values()).filter(c => c.home !== 3).length
      console.log(`Initial imbalance: ${remainingImbalance} players`)
      
      if (remainingImbalance === 0) {
        console.log('✅ Already perfectly balanced!')
        setIsForceBalancing(false)
        return
      }
      
      // STRATEGY 1: Simple swaps
      console.log('Strategy 1: Simple home/away swapping...')
      let pass = 0
      while (remainingImbalance > 0 && pass < 100) {
        pass++
        let swaps = 0
        
        for (let i = 0; i < currentMatches.length; i++) {
          const match = currentMatches[i]
          const p1Counts = finalHomeCounts.get(match.player1Id)!
          const p2Counts = finalHomeCounts.get(match.player2Id)!
          
          const costBefore = Math.abs(p1Counts.home - 3) + Math.abs(p2Counts.home - 3)
          const costAfter = Math.abs((p1Counts.home - 1) - 3) + Math.abs((p2Counts.home + 1) - 3)
          
          if (costAfter < costBefore) {
            currentMatches[i] = {
              ...match,
              player1Id: match.player2Id,
              player1Name: match.player2Name,
              player2Id: match.player1Id,
              player2Name: match.player1Name
            }
            p1Counts.home -= 1
            p1Counts.away += 1
            p2Counts.home += 1
            p2Counts.away -= 1
            swaps++
          }
        }
        
        remainingImbalance = Array.from(finalHomeCounts.values()).filter(c => c.home !== 3).length
        if (swaps === 0 || remainingImbalance === 0) break
      }
      
      console.log(`After Strategy 1: ${remainingImbalance} imbalanced`)
      setMatches([...currentMatches])
      await new Promise(r => setTimeout(r, 100))
      
      if (remainingImbalance === 0) {
        console.log('✅ Perfect balance achieved!')
        setIsForceBalancing(false)
        return
      }
      
      // STRATEGY 2: Target the specific imbalanced players
      console.log('Strategy 2: Targeted player fixes...')
      const imbalancedPlayers = players.filter(p => {
        const counts = finalHomeCounts.get(p.id)!
        return counts.home !== 3
      })
      
      console.log('Imbalanced players:', imbalancedPlayers.map(p => `${p.name} (${finalHomeCounts.get(p.id)!.home}/3)`))
      
      // Find if imbalanced players play each other
      for (const player1 of imbalancedPlayers) {
        for (const player2 of imbalancedPlayers) {
          if (player1.id === player2.id) continue
          
          const p1Counts = finalHomeCounts.get(player1.id)!
          const p2Counts = finalHomeCounts.get(player2.id)!
          
          // Check if they have opposite imbalances and play each other
          if ((p1Counts.home < 3 && p2Counts.home > 3) || (p1Counts.home > 3 && p2Counts.home < 3)) {
            const matchIdx = currentMatches.findIndex(m => 
              (m.player1Id === player1.id && m.player2Id === player2.id) ||
              (m.player1Id === player2.id && m.player2Id === player1.id)
            )
            
            if (matchIdx !== -1) {
              const match = currentMatches[matchIdx]
              // Check if swapping helps
              const currentP1IsHome = match.player1Id === player1.id
              const p1NeedsHome = p1Counts.home < 3
              
              if ((p1NeedsHome && !currentP1IsHome) || (!p1NeedsHome && currentP1IsHome)) {
                currentMatches[matchIdx] = {
                  ...match,
                  player1Id: match.player2Id,
                  player1Name: match.player2Name,
                  player2Id: match.player1Id,
                  player2Name: match.player1Name
                }
                
                // Update counts
                if (match.player1Id === player1.id) {
                  p1Counts.home -= 1
                  p1Counts.away += 1
                  p2Counts.home += 1
                  p2Counts.away -= 1
                } else {
                  p1Counts.home += 1
                  p1Counts.away -= 1
                  p2Counts.home -= 1
                  p2Counts.away += 1
                }
                
                console.log(`Fixed: Swapped ${player1.name} and ${player2.name}`)
              }
            }
          }
        }
      }
      
      remainingImbalance = Array.from(finalHomeCounts.values()).filter(c => c.home !== 3).length
      console.log(`After Strategy 2: ${remainingImbalance} imbalanced`)
      setMatches([...currentMatches])
      await new Promise(r => setTimeout(r, 100))
      
      if (remainingImbalance === 0) {
        console.log('✅ Perfect balance achieved!')
      } else {
        // STRATEGY 3: Force swap any match to fix remaining imbalances
        console.log('Strategy 3: Aggressive force fix...')
        
        const stillImbalanced = players.filter(p => {
          const counts = finalHomeCounts.get(p.id)!
          return counts.home !== 3
        })
        
        for (const player of stillImbalanced) {
          const pCounts = finalHomeCounts.get(player.id)!
          const needsHome = pCounts.home < 3
          
          console.log(`Fixing ${player.name}: needs ${needsHome ? 'home' : 'away'} (currently ${pCounts.home}/3)`)
          
          // Find ANY match where this player is in the wrong position
          for (let i = 0; i < currentMatches.length; i++) {
            const match = currentMatches[i]
            const isPlayerInMatch = match.player1Id === player.id || match.player2Id === player.id
            if (!isPlayerInMatch) continue
            
            const isPlayerHome = match.player1Id === player.id
            
            // If player needs home but is away, OR needs away but is home
            if ((needsHome && !isPlayerHome) || (!needsHome && isPlayerHome)) {
              // Just swap this match
              currentMatches[i] = {
                ...match,
                player1Id: match.player2Id,
                player1Name: match.player2Name,
                player2Id: match.player1Id,
                player2Name: match.player1Name
              }
              
              // Update counts
              const opponentId = isPlayerHome ? match.player2Id : match.player1Id
              const opponentCounts = finalHomeCounts.get(opponentId)!
              
              if (needsHome) {
                pCounts.home += 1
                pCounts.away -= 1
                opponentCounts.home -= 1
                opponentCounts.away += 1
              } else {
                pCounts.home -= 1
                pCounts.away += 1
                opponentCounts.home += 1
                opponentCounts.away -= 1
              }
              
              console.log(`Fixed ${player.name} by swapping match with ${players.find(p => p.id === opponentId)?.name}`)
              break // Move to next imbalanced player
            }
          }
        }
        
        remainingImbalance = Array.from(finalHomeCounts.values()).filter(c => c.home !== 3).length
        console.log(`After Strategy 3: ${remainingImbalance} imbalanced`)
        setMatches([...currentMatches])
        await new Promise(r => setTimeout(r, 100))
      }
      
      // Save to database
      console.log('Saving balanced matches...')
      const bulkMatches = currentMatches.map(match => {
        const player = players.find(p => p.id === match.player1Id)
        return {
          homePlayerId: match.player1Id,
          awayPlayerId: match.player2Id,
          round: match.round,
          pool: player?.pool || null
        }
      })
      
      // Delete existing and recreate
      await fetch(`/api/matches?tournamentId=${tournament.id}`, { method: 'DELETE' })
      
      const response = await fetch('/api/matches/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournament.id,
          matches: bulkMatches
        })
      })
      
      if (response.ok) {
        console.log('✅ Balanced matches saved!')
      }
      
      setIsForceBalancing(false)
    } catch (err) {
      console.error('Force balance failed:', err)
      setError('Failed to force balance')
      setIsForceBalancing(false)
    }
  }

  const saveMatchesToDatabase = async () => {
    try {
      setLoading(true)
      
      // Matches are already saved individually, just move tournament to Phase 4 (Task Assignment)
      await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: 4 })
      })

      router.push('/admin')
    } catch (err) {
      setError('Failed to complete opponent draw')
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

  const currentPlayer = players[currentPlayerIndex]
  const currentPlayerMatches = matches.filter(
    m => m.player1Id === currentPlayer?.id || m.player2Id === currentPlayer?.id
  ).length

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background with Logo Pattern */}
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-wrap justify-between items-center h-auto sm:h-16 py-2 sm:py-0 gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Link
                href="/admin"
                className="flex items-center space-x-1 sm:space-x-2 text-emerald-400 hover:text-emerald-300 transition-all shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Back</span>
              </Link>
              <div className="h-4 sm:h-6 w-px bg-emerald-500/20 shrink-0"></div>
              <h1 className="text-xs sm:text-sm md:text-lg font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent truncate"><span className="hidden md:inline">PHASE 3: </span>OPPONENT DRAW</h1>
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 shrink-0">
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
              {!isComplete && (
                <>
                  <button
                    onClick={resetAllMatches}
                    disabled={loading || isResetting || isAutoGenerating || matches.length === 0}
                    className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 active:from-red-600 active:to-red-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 text-xs sm:text-sm touch-manipulation"
                  >
                    {isResetting ? (
                      <span className="flex items-center space-x-1 sm:space-x-2">
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        <span className="hidden sm:inline">Resetting...</span>
                      </span>
                    ) : (
                      <span><span className="hidden sm:inline">🔄 Reset </span><span className="sm:hidden">🔄</span><span className="hidden md:inline">All Matches</span></span>
                    )}
                  </button>
                  <button
                    onClick={autoGenerateAllMatches}
                    disabled={loading || isAutoGenerating || isResetting}
                    className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 active:from-yellow-600 active:to-orange-600 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/30 text-xs sm:text-sm touch-manipulation"
                  >
                    {isAutoGenerating ? (
                      <span className="flex items-center space-x-1 sm:space-x-2">
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        <span className="hidden sm:inline">Generating...</span>
                      </span>
                    ) : (
                      <span><span className="hidden sm:inline">⚡ Auto-</span>Generate<span className="hidden md:inline"> All</span></span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {isComplete ? (
          /* Show completion screen and match table */
          <>
            <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-center hover:border-emerald-500/50 transition-all mb-4 sm:mb-6">
              <Check className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 text-emerald-400 mx-auto mb-4 sm:mb-6 animate-pulse" />
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent mb-3 sm:mb-4">
                OPPONENT DRAW COMPLETE!
              </h2>
              <p className="text-slate-400 mb-2 text-xs sm:text-sm">
                All {players.length} players have been assigned {MATCHES_PER_PLAYER} opponents each.
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-400 mb-3 sm:mb-4">
                Total: {matches.length} matches created
              </p>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 sm:mb-8">
                ✓ All matches have been auto-saved
              </p>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-slate-400 mb-1">Players</p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{players.length}</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-slate-400 mb-1">Matches</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-400">{matches.length}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={forceBalanceCheck}
                  disabled={isForceBalancing}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 active:from-yellow-600 active:to-orange-600 text-black font-bold text-sm sm:text-base rounded-lg sm:rounded-xl transition-all shadow-xl shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {isForceBalancing ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span>Balancing...</span>
                    </span>
                  ) : (
                    <span>⚖️ <span className="hidden sm:inline">Force </span>Balance<span className="hidden sm:inline"> Check</span></span>
                  )}
                </button>
                <button
                  onClick={saveMatchesToDatabase}
                  disabled={isForceBalancing}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:from-emerald-600 active:to-emerald-700 text-black font-black text-base sm:text-lg rounded-lg sm:rounded-xl transition-all shadow-xl shadow-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  <span className="hidden sm:inline">SAVE & CONTINUE TO PHASE 4</span>
                  <span className="sm:hidden">SAVE & CONTINUE</span>
                </button>
              </div>
            </div>
            
            {/* Live Balance Stats */}
            <div className="bg-black/30 backdrop-blur-md border-2 border-blue-500/30 rounded-2xl p-6 hover:border-blue-500/50 transition-all mb-6">
              <h3 className="text-xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                📊 LIVE BALANCE STATS
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {players.map(player => {
                  const homeCount = matches.filter(m => m.player1Id === player.id).length
                  const awayCount = matches.filter(m => m.player2Id === player.id).length
                  const isBalanced = homeCount === 3 && awayCount === 3
                  
                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-lg border-2 ${
                        isBalanced
                          ? 'bg-emerald-500/10 border-emerald-500/50'
                          : 'bg-red-500/10 border-red-500/50'
                      }`}
                    >
                      <p className="text-xs font-semibold text-white truncate mb-2" title={player.name}>
                        {player.name}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className={isBalanced ? 'text-emerald-400' : 'text-red-400'}>
                          {homeCount}/{MATCHES_PER_PLAYER / 2}
                        </span>
                        <span className="text-slate-500">|</span>
                        <span className={isBalanced ? 'text-emerald-400' : 'text-red-400'}>
                          {awayCount}/{MATCHES_PER_PLAYER / 2}
                        </span>
                      </div>
                      {isBalanced && (
                        <div className="mt-1 text-center">
                          <Check className="h-3 w-3 text-emerald-400 mx-auto" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-400">
                  {players.filter(p => {
                    const h = matches.filter(m => m.player1Id === p.id).length
                    const a = matches.filter(m => m.player2Id === p.id).length
                    return h === 3 && a === 3
                  }).length} / {players.length} players perfectly balanced
                </p>
              </div>
            </div>
            
            {/* Show the match table */}
            <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500/50 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent">
                    ALL PLAYERS - MATCH ASSIGNMENT
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Each player has 6 matches against different opponents
                  </p>
                </div>
                
                {/* Summary Stats */}
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{matches.length}</p>
                    <p className="text-xs text-slate-400">Matches</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">
                      {players.filter(p => {
                        const pMatches = matches.filter(m => m.player1Id === p.id || m.player2Id === p.id)
                        return pMatches.length >= 6
                      }).length}/{players.length}
                    </p>
                    <p className="text-xs text-slate-400">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      {Math.round((matches.length / (players.length * 6)) * 100)}%
                    </p>
                    <p className="text-xs text-slate-400">Progress</p>
                  </div>
                </div>
              </div>

              {/* Players Grid */}
              <div className="grid gap-4" style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
              }}>
                {players.map((player, playerIdx) => {
                  const playerMatches = matches.filter(
                    m => m.player1Id === player.id || m.player2Id === player.id
                  )
                  
                  // Create array with matches positioned by their round number
                  // For player1, use the round as-is; for player2, calculate their round
                  const matchesByRound: ({opponent: string, isHome: boolean} | null)[] = Array(6).fill(null).map(() => null)
                  
                  playerMatches.forEach(match => {
                    let roundIndex: number
                    
                    if (match.player1Id === player.id) {
                      // This player is player1, use the match round directly
                      roundIndex = match.round - 1
                    } else {
                      // This player is player2, calculate which round this was for them
                      // Find all matches involving this player that happened before or at this match
                      const thisMatchIndex = matches.findIndex(m => 
                        (m.player1Id === match.player1Id && m.player2Id === match.player2Id) ||
                        (m.player1Id === match.player2Id && m.player2Id === match.player1Id)
                      )
                      
                      // Count how many matches this player had before this one
                      const priorMatchCount = matches.slice(0, thisMatchIndex).filter(m =>
                        m.player1Id === player.id || m.player2Id === player.id
                      ).length
                      
                      roundIndex = priorMatchCount
                    }
                    
                    if (roundIndex >= 0 && roundIndex < 6) {
                      const opponentName = match.player1Id === player.id ? match.player2Name : match.player1Name
                      const isHome = match.player1Id === player.id
                      matchesByRound[roundIndex] = { opponent: opponentName, isHome }
                    }
                  })
                  const completedMatches = playerMatches.length
                  const isComplete = completedMatches >= 6
                  
                  return (
                    <div
                      key={player.id}
                      className={`border-2 rounded-xl overflow-hidden transition-all ${
                        isComplete
                          ? 'border-emerald-400 bg-emerald-500/10'
                          : 'border-slate-700/30'
                      }`}
                    >
                      {/* Player Header */}
                      <div className={`px-4 py-3 ${
                        isComplete
                          ? 'bg-emerald-600 text-white'
                          : 'bg-black/50 text-white'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm truncate">{player.name}</h4>
                          {isComplete && (
                            <Check className="h-5 w-5" />
                          )}
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>{completedMatches} / 6 matches</span>
                            <span>{Math.round((completedMatches / 6) * 100)}%</span>
                          </div>
                          <div className="w-full bg-white bg-opacity-20 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                isComplete ? 'bg-white' : 'bg-white bg-opacity-70'
                              }`}
                              style={{ width: `${(completedMatches / 6) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Matches Table */}
                      <div className="p-3 bg-black/20">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700/50">
                              <th className="text-left py-1 text-xs font-semibold text-slate-400">Round</th>
                              <th className="text-left py-1 text-xs font-semibold text-slate-400">Opponent</th>
                              <th className="text-center py-1 text-xs font-semibold text-slate-400">H/A</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchesByRound.map((matchData, roundIdx) => (
                              <tr key={roundIdx} className="border-b border-slate-700/30">
                                <td className="py-2 text-slate-400 font-medium">{roundIdx + 1}</td>
                                <td className="py-2">
                                  {matchData ? (
                                    <span className="text-emerald-400 font-medium">{matchData.opponent}</span>
                                  ) : (
                                    <span className="text-slate-600 italic">Not assigned</span>
                                  )}
                                </td>
                                <td className="py-2 text-center">
                                  {matchData ? (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                      matchData.isHome 
                                        ? 'bg-blue-500/20 text-blue-400' 
                                        : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                      {matchData.isHome ? 'H' : 'A'}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : needsPlayerSelection && !isAutoGenerating ? (
          /* First Player Selection */
          <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-8 text-center hover:border-emerald-500/50 transition-all">
            <Trophy className="h-16 w-16 text-emerald-400 mx-auto mb-6 animate-pulse" />
            <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent mb-4">
              {matches.length === 0 ? 'SELECT FIRST PLAYER' : 'SELECT NEXT PLAYER'}
            </h2>
            <p className="text-slate-400 mb-8">
              {matches.length === 0
                ? 'Spin the wheel to randomly select which player will start the opponent draw process.'
                : 'Spin the wheel to select the next player who still needs matches.'}
            </p>
            
            {!isSelectingFirstPlayer ? (
              <button
                onClick={startFirstPlayerSpin}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black rounded-xl transition-all shadow-xl shadow-emerald-500/50 text-lg"
              >
                SPIN TO SELECT FIRST PLAYER
              </button>
            ) : (
              <SpinWheel
                items={players.filter(p => (matches.filter(m => m.player1Id === p.id || m.player2Id === p.id).length) < MATCHES_PER_PLAYER).map(p => p.name)}
                onSpinComplete={handleFirstPlayerSelected}
                title={matches.length === 0 ? 'Who Goes First?' : 'Select Next Player'}
                isOpen={isSelectingFirstPlayer}
                onClose={handleFirstPlayerWheelClose}
                colorScheme="players"
              />
            )}
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-6 mb-6 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
                    {isAutoGenerating ? 'Auto-Generating:' : 'Drawing for:'} {currentPlayer?.name}
                  </h2>
                  <p className="text-slate-400">
                    {isAutoGenerating ? `Creating matches... (${matches.length} created)` : `Drawing match ${currentPlayerMatches + 1} of ${MATCHES_PER_PLAYER}`} | Pool: {currentPlayer?.pool}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Overall Progress</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {currentPlayerIndex + 1} / {players.length}
                  </p>
                  <p className="text-xs text-slate-500">Players</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-black/50 rounded-full h-3 border border-emerald-500/20">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${((currentPlayerIndex * MATCHES_PER_PLAYER + currentPlayerMatches) / (players.length * MATCHES_PER_PLAYER)) * 100}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Wheel Section - Hide during auto-generation */}
            {!isAutoGenerating && (
            <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6 mb-6 hover:border-purple-500/50 transition-all">
              {!isSpinning && !selectedOpponent ? (
                <div className="text-center">
                  <Users className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Ready to Draw Opponent #{currentPlayerMatches + 1}
                  </h3>
                  <p className="text-slate-400 mb-2">
                    {availableOpponents.length} available opponents in pool {currentPlayer?.pool}
                  </p>
                  <p className="text-sm text-slate-500 mb-6">
                    {MATCHES_PER_PLAYER - currentPlayerMatches} matches remaining for {currentPlayer?.name}
                  </p>
                  <button
                    onClick={startSpin}
                    disabled={availableOpponents.length === 0}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-purple-500/50 text-lg"
                  >
                    SPIN THE WHEEL
                  </button>
                </div>
              ) : null}
              
              {/* Wheel Modal - Always render when spinning or opponent selected */}
              {(isSpinning || selectedOpponent) && (
                <SpinWheel
                  items={availableOpponents.map(p => p.name)}
                  onSpinComplete={handleSpinComplete}
                  title="Draw Opponent"
                  isOpen={true}
                  onClose={handleWheelClose}
                  colorScheme="players"
                />
              )}
            </div>
            )}

            {/* Match Cards Grid - Individual Tables per Player */}
            <div className="bg-black/30 backdrop-blur-md border-2 border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500/50 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent">
                    ALL PLAYERS - MATCH ASSIGNMENT
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Each player needs 6 matches against different opponents
                  </p>
                </div>
                
                {/* Summary Stats */}
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{matches.length}</p>
                    <p className="text-xs text-slate-400">Matches</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">
                      {players.filter(p => {
                        const pMatches = matches.filter(m => m.player1Id === p.id || m.player2Id === p.id)
                        return pMatches.length >= 6
                      }).length}/{players.length}
                    </p>
                    <p className="text-xs text-slate-400">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      {Math.round((matches.length / (players.length * 6)) * 100)}%
                    </p>
                    <p className="text-xs text-slate-400">Progress</p>
                  </div>
                </div>
              </div>
              
              {/* Grid of Player Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((player, playerIdx) => {
                  const playerMatches = matches.filter(
                    m => m.player1Id === player.id || m.player2Id === player.id
                  )
                  
                  // Create array with matches positioned by their round number
                  // For player1, use the round as-is; for player2, calculate their round
                  const matchesByRound: ({opponent: string, isHome: boolean} | null)[] = Array(6).fill(null).map(() => null)
                  
                  playerMatches.forEach(match => {
                    let roundIndex: number
                    
                    if (match.player1Id === player.id) {
                      // This player is player1, use the match round directly
                      roundIndex = match.round - 1
                    } else {
                      // This player is player2, calculate which round this was for them
                      // Find all matches involving this player that happened before or at this match
                      const thisMatchIndex = matches.findIndex(m => 
                        (m.player1Id === match.player1Id && m.player2Id === match.player2Id) ||
                        (m.player1Id === match.player2Id && m.player2Id === match.player1Id)
                      )
                      
                      // Count how many matches this player had before this one
                      const priorMatchCount = matches.slice(0, thisMatchIndex).filter(m =>
                        m.player1Id === player.id || m.player2Id === player.id
                      ).length
                      
                      roundIndex = priorMatchCount
                    }
                    
                    if (roundIndex >= 0 && roundIndex < 6) {
                      const opponentName = match.player1Id === player.id ? match.player2Name : match.player1Name
                      const isHome = match.player1Id === player.id
                      matchesByRound[roundIndex] = { opponent: opponentName, isHome }
                    }
                  })
                  const completedMatches = playerMatches.length
                  const isCurrentPlayer = playerIdx === currentPlayerIndex
                  const isComplete = completedMatches >= 6
                  
                  return (
                    <div
                      key={player.id}
                      className={`border-2 rounded-xl overflow-hidden transition-all ${
                        isCurrentPlayer
                          ? 'border-emerald-500 shadow-xl shadow-emerald-500/50 ring-2 ring-emerald-500/30'
                          : isComplete
                          ? 'border-emerald-400 bg-emerald-500/10'
                          : 'border-slate-700/30'
                      }`}
                    >
                      {/* Player Header */}
                      <div className={`px-4 py-3 ${
                        isCurrentPlayer
                          ? 'bg-gradient-to-r from-emerald-500 to-purple-500 text-white'
                          : isComplete
                          ? 'bg-emerald-600 text-white'
                          : 'bg-black/50 text-white'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm truncate">{player.name}</h4>
                          {isCurrentPlayer && (
                            <span className="text-xs bg-white text-emerald-600 px-2 py-1 rounded font-black">
                              DRAWING
                            </span>
                          )}
                          {isComplete && !isCurrentPlayer && (
                            <Check className="h-5 w-5" />
                          )}
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>{completedMatches} / 6 matches</span>
                            <span>{Math.round((completedMatches / 6) * 100)}%</span>
                          </div>
                          <div className="w-full bg-white bg-opacity-20 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                isComplete ? 'bg-white' : 'bg-white bg-opacity-70'
                              }`}
                              style={{ width: `${(completedMatches / 6) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Matches Table */}
                      <div className="p-3 bg-black/20">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700/50">
                              <th className="text-left py-1 text-xs font-semibold text-slate-400">Round</th>
                              <th className="text-left py-1 text-xs font-semibold text-slate-400">Opponent</th>
                              <th className="text-center py-1 text-xs font-semibold text-slate-400">H/A</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchesByRound.map((matchData, roundIdx) => (
                              <tr key={roundIdx} className="border-b border-slate-700/30">
                                <td className="py-2 text-slate-400 font-medium">{roundIdx + 1}</td>
                                <td className="py-2">
                                  {matchData ? (
                                    <span className="text-emerald-400 font-medium">{matchData.opponent}</span>
                                  ) : (
                                    <span className="text-slate-600 italic">Not assigned</span>
                                  )}
                                </td>
                                <td className="py-2 text-center">
                                  {matchData ? (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                      matchData.isHome 
                                        ? 'bg-blue-500/20 text-blue-400' 
                                        : 'bg-amber-500/20 text-amber-400'
                                    }`}>
                                      {matchData.isHome ? 'H' : 'A'}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
