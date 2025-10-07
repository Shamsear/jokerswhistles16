'use client'

import { useState, useRef } from 'react'
import { X, Download, Share2, Loader2, Copy, Check } from 'lucide-react'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'

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
  homeScore: number | null
  awayScore: number | null
  status: string
}

interface FixtureShareModalWithLinksProps {
  isOpen: boolean
  onClose: () => void
  matches: Match[]
  tournamentName: string
  selectedRound: string
}

export default function FixtureShareModalWithLinks({
  isOpen,
  onClose,
  matches,
  tournamentName,
  selectedRound
}: FixtureShareModalWithLinksProps) {
  const [selectedPool, setSelectedPool] = useState<string>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedMatchId, setCopiedMatchId] = useState<string | null>(null)
  const fixtureRef = useRef<HTMLDivElement>(null)

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return 'https://yourdomain.com'
  }

  const getMatchLink = (matchId: string) => {
    return `${getBaseUrl()}/match/${matchId}/task`
  }

  const copyToClipboard = async (text: string, matchId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMatchId(matchId)
      setTimeout(() => setCopiedMatchId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

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

  const generateQRCode = async (url: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(url, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    } catch (err) {
      console.error('Error generating QR code:', err)
      return ''
    }
  }

  const generateImage = async () => {
    if (!fixtureRef.current) return

    setIsGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const canvas = await html2canvas(fixtureRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const stylesheets = clonedDoc.querySelectorAll('link[rel="stylesheet"], style')
          stylesheets.forEach((sheet: any) => {
            try { sheet.remove() } catch (e) {}
          })
          
          const svgs = clonedDoc.querySelectorAll('svg')
          svgs.forEach((svg: any) => {
            try { svg.remove() } catch (e) {}
          })
          
          const allElements = clonedDoc.querySelectorAll('*')
          allElements.forEach((el: any) => {
            try {
              el.style.backdropFilter = 'none'
              el.style.webkitBackdropFilter = 'none'
              el.style.filter = 'none'
            } catch (e) {}
          })
        }
      })

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `match-links-round-${selectedRound}-${selectedPool !== 'all' ? `pool-${selectedPool}` : 'all-pools'}.png`
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
      await new Promise(resolve => setTimeout(resolve, 1500))

      const canvas = await html2canvas(fixtureRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const stylesheets = clonedDoc.querySelectorAll('link[rel="stylesheet"], style')
          stylesheets.forEach((sheet: any) => {
            try { sheet.remove() } catch (e) {}
          })
          
          const svgs = clonedDoc.querySelectorAll('svg')
          svgs.forEach((svg: any) => {
            try { svg.remove() } catch (e) {}
          })
          
          const allElements = clonedDoc.querySelectorAll('*')
          allElements.forEach((el: any) => {
            try {
              el.style.backdropFilter = 'none'
              el.style.webkitBackdropFilter = 'none'
              el.style.filter = 'none'
            } catch (e) {}
          })
        }
      })

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'match-links.png', { type: 'image/png' })
          
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Tournament Match Links',
                text: `${tournamentName} - Round ${selectedRound} Match Links`
              })
            } catch (err: any) {
              if (err.name !== 'AbortError') {
                console.error('Share failed:', err)
                // Fallback to download
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'match-links.png'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
              }
            }
          } else {
            // Fallback to download
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'match-links.png'
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
      <div className="bg-slate-900 rounded-xl sm:rounded-2xl border-2 border-yellow-500/30 max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50">
          <div>
            <h2 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-yellow-400 to-emerald-400 bg-clip-text text-transparent">
              Share Match Links
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Generate shareable match links with QR codes</p>
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
            <h3 className="text-xs sm:text-sm font-semibold text-slate-400 mb-2">Preview & Copy Links:</h3>
          </div>
          
          {/* Interactive View - For copying links */}
          <div className="mb-6 space-y-4">
            {pools.map(pool => (
              <div key={pool} className="space-y-3">
                <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-wider">
                  {pool !== 'No Pool' ? `GROUP ${pool}` : 'MATCHES'}
                </h4>
                {groupedMatches[pool].map((match) => {
                  const matchLink = getMatchLink(match.id)
                  const isCopied = copiedMatchId === match.id
                  return (
                    <div key={match.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold text-sm">
                          {match.homePlayer.name} vs {match.awayPlayer.name}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          match.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 
                          match.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {match.status === 'completed' ? 'Completed' : 
                           match.status === 'in_progress' ? 'In Progress' : 
                           'Scheduled'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={matchLink}
                          readOnly
                          className="flex-1 px-3 py-2 bg-black/20 border border-slate-600 rounded-lg text-slate-300 text-xs font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(matchLink, match.id)}
                          className={`p-2 rounded-lg transition-all ${
                            isCopied 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                          }`}
                          title="Copy link"
                        >
                          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Shareable Image Preview */}
          <div className="mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-400 mb-2">Shareable Image Preview:</h3>
          </div>
          
          <div className="flex justify-center">
            <div
              ref={fixtureRef}
              style={{ 
                width: '100%',
                maxWidth: '800px',
                padding: '40px',
                background: '#ffffff',
                fontFamily: 'Arial, Helvetica, sans-serif',
                boxSizing: 'border-box'
              }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '3px solid #facc15', paddingBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', letterSpacing: '2px', fontWeight: '600' }}>
                  SOUTH SOCCER'S PRESENTS
                </div>
                <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '0', lineHeight: '1.1' }}>
                  <span style={{ color: '#facc15' }}>Joker's</span>
                  <span style={{ color: '#000', marginLeft: '16px' }}>Whistle</span>
                </h1>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '12px', fontWeight: '600' }}>
                  ROUND {selectedRound} - MATCH LINKS
                </div>
              </div>

              {/* Matches by Pool */}
              {pools.map(pool => (
                <div key={pool} style={{ marginBottom: '32px' }}>
                  <h2 style={{ 
                    fontSize: '20px', 
                    fontWeight: '800', 
                    marginBottom: '16px',
                    color: '#000',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    padding: '8px 16px',
                    background: 'linear-gradient(90deg, #facc15 0%, #f59e0b 100%)',
                    borderRadius: '8px'
                  }}>
                    {pool !== 'No Pool' ? `GROUP ${pool}` : 'MATCHES'}
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {groupedMatches[pool].map((match, idx) => {
                      const matchLink = getMatchLink(match.id)
                      const shortLink = matchLink.replace('https://', '').replace('http://', '')
                      
                      return (
                        <div key={match.id} style={{ 
                          background: '#f8f9fa',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          padding: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px'
                        }}>
                          {/* Match Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#666', 
                              fontWeight: '600',
                              marginBottom: '8px',
                              letterSpacing: '0.5px'
                            }}>
                              MATCH {idx + 1}
                            </div>
                            <div style={{ 
                              fontSize: '18px', 
                              fontWeight: '800', 
                              color: '#000',
                              marginBottom: '12px',
                              lineHeight: '1.3'
                            }}>
                              {match.homePlayer.name}
                              <span style={{ color: '#64748b', margin: '0 8px', fontWeight: '700' }}>VS</span>
                              {match.awayPlayer.name}
                            </div>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#666',
                              fontWeight: '600',
                              wordBreak: 'break-all',
                              fontFamily: 'monospace',
                              background: '#fff',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #e5e7eb'
                            }}>
                              {shortLink}
                            </div>
                          </div>

                          {/* QR Code Placeholder */}
                          <div style={{
                            width: '80px',
                            height: '80px',
                            background: '#fff',
                            border: '2px solid #000',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <div style={{ 
                              fontSize: '10px', 
                              textAlign: 'center',
                              color: '#666',
                              fontWeight: '600',
                              padding: '8px'
                            }}>
                              SCAN QR
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Footer */}
              <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '2px solid #e5e7eb', textAlign: 'center' }}>
                <p style={{ color: '#666', fontSize: '12px', fontWeight: '600' }}>
                  {tournamentName}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '10px', marginTop: '4px' }}>
                  Scan QR codes to access match links directly
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
