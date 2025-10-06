'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Download, Share2, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'

interface Player {
  id: string
  name: string
  pool?: string | null
}

interface Match {
  id: string
  round: number
  pool: string | null
  homePlayer: Player
  awayPlayer: Player
}

interface FixtureShareModalProps {
  isOpen: boolean
  onClose: () => void
  matches: Match[]
  tournamentName: string
  selectedRound: string
}

export default function FixtureShareModal({
  isOpen,
  onClose,
  matches,
  tournamentName,
  selectedRound
}: FixtureShareModalProps) {
  const [selectedPool, setSelectedPool] = useState<string>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const fixtureRef = useRef<HTMLDivElement>(null)

  const getFilteredMatches = () => {
    let filtered = [...matches]

    if (selectedPool !== 'all') {
      filtered = filtered.filter(m => m.pool === selectedPool)
    }

    // Group by pool
    const grouped: { [key: string]: Match[] } = {}
    filtered.forEach(match => {
      const pool = match.pool || 'No Pool'
      if (!grouped[pool]) {
        grouped[pool] = []
      }
      grouped[pool].push(match)
    })

    return grouped
  }

  const getUniquePools = () => {
    const pools = [...new Set(matches.map(m => m.pool).filter(p => p !== null))]
    return pools.sort()
  }

  const generateImage = async () => {
    if (!fixtureRef.current) return

    setIsGenerating(true)
    try {
      // Wait longer for rendering and font loading
      await new Promise(resolve => setTimeout(resolve, 1000))

      const canvas = await html2canvas(fixtureRef.current, {
        backgroundColor: '#1e293b',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: 1200,
        windowHeight: fixtureRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          // Fix gradient and backdrop issues to avoid oklab parsing errors
          const backdropElements = clonedDoc.querySelectorAll('[class*="backdrop-blur"]')
          backdropElements.forEach((el: any) => {
            el.style.backdropFilter = 'none'
          })
          
          const gradientElements = clonedDoc.querySelectorAll('[class*="bg-gradient"]')
          gradientElements.forEach((el: any) => {
            if (el.className.includes('bg-clip-text')) {
              el.style.background = '#facc15'
              el.style.backgroundClip = 'text'
              el.style.webkitBackgroundClip = 'text'
            } else {
              el.style.background = '#10b981'
            }
          })
        }
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `fixtures-round-${selectedRound}-${selectedPool !== 'all' ? `pool-${selectedPool}` : 'all-pools'}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
        setIsGenerating(false)
      }, 'image/png')
    } catch (error) {
      console.error('Error generating image:', error)
      setIsGenerating(false)
    }
  }

  const shareImage = async () => {
    if (!fixtureRef.current) return

    setIsGenerating(true)
    try {
      // Wait longer for rendering and font loading
      await new Promise(resolve => setTimeout(resolve, 1000))

      const canvas = await html2canvas(fixtureRef.current, {
        backgroundColor: '#1e293b',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: 1200,
        windowHeight: fixtureRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          // Fix gradient and backdrop issues to avoid oklab parsing errors
          const backdropElements = clonedDoc.querySelectorAll('[class*="backdrop-blur"]')
          backdropElements.forEach((el: any) => {
            el.style.backdropFilter = 'none'
          })
          
          const gradientElements = clonedDoc.querySelectorAll('[class*="bg-gradient"]')
          gradientElements.forEach((el: any) => {
            if (el.className.includes('bg-clip-text')) {
              el.style.background = '#facc15'
              el.style.backgroundClip = 'text'
              el.style.webkitBackgroundClip = 'text'
            } else {
              el.style.background = '#10b981'
            }
          })
        }
      })

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'fixtures.png', { type: 'image/png' })
          
          if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Tournament Fixtures',
                text: `${tournamentName} - Fixtures`
              })
            } catch (err) {
              console.log('Share cancelled or failed')
            }
          } else {
            // Fallback to download if sharing not supported
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'fixtures.png'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }
        }
        setIsGenerating(false)
      }, 'image/png')
    } catch (error) {
      console.error('Error sharing image:', error)
      setIsGenerating(false)
    }
  }

  if (!isOpen) return null

  const groupedMatches = getFilteredMatches()
  const pools = Object.keys(groupedMatches).sort()

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 rounded-xl sm:rounded-2xl border-2 border-yellow-500/30 max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50">
          <div>
            <h2 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent">
              Share Fixtures
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Generate and share fixture images</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Round {selectedRound}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">{matches.length} matches</p>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Filter by Pool</label>
            <select
              value={selectedPool}
              onChange={(e) => setSelectedPool(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-black/20 border-2 border-yellow-500/30 rounded-xl text-white focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/20 transition-all"
            >
              <option value="all">All Pools</option>
              {getUniquePools().map(pool => (
                <option key={pool} value={pool || ''}>Pool {pool}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-400 mb-2">Preview:</h3>
          </div>
          
          {/* Fixture Card - This will be captured */}
          <div className="flex justify-center">
            <div
              ref={fixtureRef}
              style={{ 
                width: '100%',
                maxWidth: '600px',
                padding: '24px 20px',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)'
              }}
              className="sm:p-[48px_40px]"
            >
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: '#facc15', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '2px' }}>
                    SOUTH SOCCER&apos;S PRESENTS
                  </div>
                  <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#facc15', marginBottom: '8px', letterSpacing: '-2px' }}>
                    JOKER&apos;S
                    <span style={{ color: 'white', marginLeft: '12px' }}>WHISTLE</span>
                  </h1>
                </div>
                <div style={{ display: 'inline-block', padding: '8px 24px', backgroundColor: '#0c0a09', border: '2px solid rgba(234, 179, 8, 0.5)', borderRadius: '8px' }}>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                    ROUND {selectedRound}
                  </span>
                </div>
              </div>

              {/* Matches */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pools.map(pool => (
                  <div key={pool}>
                    {groupedMatches[pool].map((match) => (
                      <div key={match.id}>
                        {/* Pool Label - Show for each match */}
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.05em' }}>
                            {pool !== 'No Pool' ? `GROUP ${pool}` : 'MATCHES'}
                          </span>
                        </div>

                        {/* Match Card */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {/* Home Team */}
                            <div style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #facc15 0%, #ca8a04 100%)', borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '20px' }}>
                                {match.homePlayer.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div style={{ color: 'white', fontWeight: '600', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {match.homePlayer.name}
                              </div>
                            </div>

                            {/* VS */}
                            <div style={{ padding: '0 32px' }}>
                              <span style={{ color: '#64748b', fontWeight: 'bold', fontSize: '24px' }}>X</span>
                            </div>

                            {/* Away Team */}
                            <div style={{ flex: 1, textAlign: 'center' }}>
                              <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)', borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '20px' }}>
                                {match.awayPlayer.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div style={{ color: 'white', fontWeight: '600', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {match.awayPlayer.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
                <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {tournamentName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-700/50 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={generateImage}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Download Image</span>
              </>
            )}
          </button>

          <button
            onClick={shareImage}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
