'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface SpinWheelProps {
  items: string[]
  onSpinComplete: (result: string) => void
  title?: string
  isOpen: boolean
  onClose: () => void
  colorScheme?: 'players' | 'tasks' | 'homeAway'
}

export default function SpinWheel({
  items,
  onSpinComplete,
  title = 'Spin the Wheel!',
  isOpen,
  onClose,
  colorScheme = 'players'
}: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [hasSpun, setHasSpun] = useState(false) // Track if wheel has been spun in this session
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const colors = {
    players: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#F97316', '#14B8A6'],
    tasks: ['#22C55E', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
    homeAway: ['#22C55E', '#3B82F6']
  }

  const wheelColors = colors[colorScheme]

  // Reset hasSpun when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasSpun(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      drawWheel()
    }
  }, [isOpen, items, rotation])

  const drawWheel = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw wheel segments
    const segmentAngle = (2 * Math.PI) / items.length
    
    items.forEach((item, index) => {
      const startAngle = index * segmentAngle + (rotation * Math.PI) / 180
      const endAngle = startAngle + segmentAngle

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = wheelColors[index % wheelColors.length]
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw text
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(startAngle + segmentAngle / 2)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Arial'
      
      // Truncate long text
      const displayText = item.length > 20 ? item.substring(0, 17) + '...' : item
      ctx.fillText(displayText, radius / 1.5, 0)
      ctx.restore()
    })

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI)
    ctx.fillStyle = '#1F2937'
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw pointer/arrow at top pointing down to wheel
    ctx.save()
    ctx.translate(centerX, 20) // Position at top of canvas
    ctx.beginPath()
    ctx.moveTo(0, 0) // Arrow tip pointing down
    ctx.lineTo(-20, -35) // Left side
    ctx.lineTo(20, -35) // Right side
    ctx.closePath()
    ctx.fillStyle = '#EF4444' // Red arrow
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Add a circle behind the arrow for emphasis
    ctx.beginPath()
    ctx.arc(0, -35, 12, 0, 2 * Math.PI)
    ctx.fillStyle = '#EF4444'
    ctx.fill()
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.restore()
  }


  const spin = () => {
    if (isSpinning || items.length === 0 || hasSpun) return

    setIsSpinning(true)
    setHasSpun(true) // Mark that wheel has been spun
    setSelectedItem(null)

    // Random rotations (5-10 full spins plus random angle)
    const minSpins = 5
    const maxSpins = 10
    const spins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins
    const extraRotation = Math.random() * 360
    const totalRotation = spins * 360 + extraRotation

    // Animate rotation
    const duration = 5000 // 5 seconds
    const startTime = Date.now()
    const startRotation = rotation

    const animate = () => {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentRotation = startRotation + totalRotation * easeOut

      setRotation(currentRotation % 360)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Determine selected item
        // The segments rotate WITH the wheel. After rotation:
        // - Segment [0] which started at 0° is now at finalRotation
        // - Segment [i] which started at (i * segmentAngle)° is now at (i * segmentAngle + finalRotation)°
        // 
        // The pointer is FIXED at 270° (top of wheel)
        // We need to find which segment is now at 270°
        // 
        // If segment [i] is at 270°, then:
        // (i * segmentAngle + finalRotation) % 360 = 270
        // i * segmentAngle = (270 - finalRotation) % 360
        // i = ((270 - finalRotation) % 360) / segmentAngle
        
        const segmentAngle = 360 / items.length
        const finalRotation = currentRotation % 360
        const pointerPosition = 270 // Top of wheel in canvas coordinates
        
        // Which segment is at the pointer after rotation?
        const offsetAngle = (pointerPosition - finalRotation + 360) % 360
        const selectedIndex = Math.floor(offsetAngle / segmentAngle) % items.length
        const selected = items[selectedIndex]
        
        // Debug logging
        console.log('=== WHEEL SELECTION DEBUG ===')
        console.log('Total items:', items.length)
        console.log('Segment angle:', segmentAngle, '°')
        console.log('Final rotation:', finalRotation, '°')
        console.log('Offset angle (adjusted for top):', offsetAngle, '°')
        console.log('Selected index:', selectedIndex)
        console.log('Selected item:', selected)
        console.log('')
        console.log('Segment positions (start angle for each item):')
        items.forEach((item, index) => {
          const startAngle = (index * segmentAngle) % 360
          const endAngle = ((index + 1) * segmentAngle) % 360
          const isSelected = index === selectedIndex
          console.log(`${isSelected ? '>>> ' : '    '}[${index}] ${item}: ${startAngle.toFixed(1)}° - ${endAngle.toFixed(1)}°`)
        })
        console.log('')
        console.log('After rotation, pointer (at top = -90°) points to segment at offsetAngle:', offsetAngle.toFixed(2), '°')
        console.log('============================')
        
        setSelectedItem(selected)
        setIsSpinning(false)
        
        // Delay before calling onSpinComplete to show result
        setTimeout(() => {
          onSpinComplete(selected)
        }, 1000)
      }
    }

    requestAnimationFrame(animate)
  }

  const handleClose = () => {
    if (!isSpinning) {
      setRotation(0)
      setSelectedItem(null)
      onClose()
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-black/90 backdrop-blur-xl border-2 border-emerald-500/30 rounded-2xl shadow-2xl w-full max-w-3xl my-8"
          >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-purple-500 px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">{title}</h2>
            <button
              onClick={handleClose}
              disabled={isSpinning}
              className="text-white hover:text-gray-300 transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Wheel */}
          <div className="p-6 md:p-8">
            {/* Wheel Container */}
            <div className="flex items-center justify-center mb-6">
              {/* Spinning Wheel */}
              <div className="relative">
                {/* Wheel glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={500}
                  className="max-w-full h-auto relative z-10"
                  style={{
                    maxWidth: '400px',
                    maxHeight: '400px'
                  }}
                />
              </div>
            </div>

            {/* Spin Button */}
            <div className="flex justify-center mb-4">
              <button
                onClick={spin}
                disabled={isSpinning || items.length === 0 || hasSpun}
                className={`px-8 py-4 rounded-xl font-black text-lg shadow-xl transition-all transform ${
                  isSpinning || items.length === 0 || hasSpun
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-purple-500 hover:from-emerald-400 hover:to-purple-400 text-white hover:scale-105 shadow-emerald-500/50'
                }`}
              >
                {isSpinning ? 'SPINNING...' : hasSpun ? 'SPIN COMPLETED' : items.length === 0 ? 'NO ITEMS' : 'SPIN NOW!'}
              </button>
            </div>

            {/* Result Display */}
            {selectedItem && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border-2 border-emerald-500/50 rounded-xl p-6"
              >
                <div className="text-center">
                  <p className="text-sm text-emerald-400 mb-2 font-semibold">Result:</p>
                  <p className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">{selectedItem}</p>
                </div>
                
                {/* Close/Next Button */}
                <div className="mt-6">
                  <button
                    onClick={handleClose}
                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black rounded-xl transition-all shadow-xl shadow-emerald-500/50"
                  >
                    CONTINUE TO NEXT DRAW →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Instructions */}
            {!selectedItem && (
              <div className="mt-6 text-center text-sm text-slate-400">
                <p>Click "SPIN NOW!" to begin the draw</p>
                <p className="text-xs mt-1">The wheel will spin and randomly select an item</p>
              </div>
            )}
          </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )

  // Use portal to render modal at document body level
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
