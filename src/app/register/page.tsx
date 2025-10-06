'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  User,
  Loader2,
  AlertCircle,
  Check,
  Trophy,
  Copy
} from 'lucide-react'

function RegistrationForm() {
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registered, setRegistered] = useState(false)
  const [playerId, setPlayerId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [copied, setCopied] = useState(false)
  
  const registrationToken = searchParams.get('token')

  useEffect(() => {
    if (!registrationToken) {
      setError('Invalid registration link. Please use the link provided by the admin.')
    }
  }, [registrationToken])

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!registrationToken) {
      setError('Invalid registration token')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Get tournament ID from registration link
      const linkResponse = await fetch(`/api/registration-links?token=${registrationToken}`)
      const linkData = await linkResponse.json()

      if (!linkResponse.ok || !linkData.link) {
        setError('Invalid or expired registration link')
        setLoading(false)
        return
      }

      // Register player
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          tournamentId: linkData.link.tournamentId,
          registrationToken: registrationToken
        })
      })

      const data = await response.json()

      if (response.ok) {
        setRegistered(true)
        setPlayerId(data.player.id)
        setPlayerName(data.player.name)
      } else {
        setError(data.error || 'Failed to register')
      }
    } catch (err) {
      setError('Failed to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyPlayerId = async () => {
    try {
      await navigator.clipboard.writeText(playerId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!registrationToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Invalid Link</h2>
          <p className="text-gray-600 text-center mb-6">
            This registration link is invalid. Please contact the tournament admin for a valid registration link.
          </p>
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-16">
              <Trophy className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Registration Complete!</h1>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {playerName}!</h2>
              <p className="text-gray-600">You've been successfully registered for the tournament.</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Your Player ID</h3>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <code className="text-sm font-mono text-gray-900 flex-1 truncate">{playerId}</code>
                <button
                  onClick={copyPlayerId}
                  className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Copy Player ID"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Save this ID! You'll need it to access your matches and spin for tasks.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
              <h3 className="font-bold mb-3">What's Next?</h3>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li>• Wait for the admin to progress to Phase 2</li>
                <li>• If you're a HOME player, you'll get a draw link</li>
                <li>• Use that link to spin and see your opponent</li>
                <li>• The admin will guide you through each phase</li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Keep your Player ID safe. You'll use it throughout the tournament.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Tournament Registration</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Tournament</h2>
            <p className="text-gray-600">Enter your name to register</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              onClick={handleRegister}
              disabled={loading || !name.trim()}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition-colors font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <User className="h-5 w-5" />
                  <span>Register</span>
                </>
              )}
            </button>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">What happens next?</h3>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• You'll get a unique Player ID</li>
                <li>• Save your ID for the tournament</li>
                <li>• Admin will guide you through each phase</li>
                <li>• HOME players will get draw links to spin</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <RegistrationForm />
    </Suspense>
  )
}