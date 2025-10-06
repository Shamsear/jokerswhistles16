import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from 'uuid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRegistrationToken(): string {
  return uuidv4()
}

export function generateRandomOpponents(allPlayers: string[], currentPlayer: string, count: number = 8): string[] {
  const availablePlayers = allPlayers.filter(p => p !== currentPlayer)
  
  if (availablePlayers.length < count) {
    throw new Error(`Not enough players available. Need ${count}, have ${availablePlayers.length}`)
  }
  
  // Fisher-Yates shuffle algorithm
  const shuffled = [...availablePlayers]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled.slice(0, count)
}

export function generateMatches(players: string[]): Array<{homePlayer: string, awayPlayer: string, round: number}> {
  const matches: Array<{homePlayer: string, awayPlayer: string, round: number}> = []
  
  for (const player of players) {
    const opponents = generateRandomOpponents(players, player, 8)
    
    for (let round = 1; round <= 8; round++) {
      const opponent = opponents[round - 1]
      
      // Ensure we don't create duplicate matches
      const existingMatch = matches.find(m => 
        (m.homePlayer === player && m.awayPlayer === opponent && m.round === round) ||
        (m.homePlayer === opponent && m.awayPlayer === player && m.round === round)
      )
      
      if (!existingMatch) {
        // Random assignment of home/away
        const isHome = Math.random() < 0.5
        matches.push({
          homePlayer: isHome ? player : opponent,
          awayPlayer: isHome ? opponent : player,
          round
        })
      }
    }
  }
  
  return matches
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function getPhaseDescription(phase: number): string {
  const phases = {
    1: 'Player Registration',
    2: 'Opponent Draw',
    3: 'Home/Away Assignment', 
    4: 'Task Pool Creation',
    5: 'Round-Based Task Assignment',
    6: 'Match Execution & Results'
  }
  return phases[phase as keyof typeof phases] || 'Unknown Phase'
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}