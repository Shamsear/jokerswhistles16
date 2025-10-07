'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Lock, Loader2, AlertCircle, Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Simple credential check (in production, use proper authentication)
      if (username === process.env.NEXT_PUBLIC_ADMIN_USERNAME || username === 'admin') {
        if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'ssleagues16admin') {
          // Store admin session
          sessionStorage.setItem('adminAuth', 'true')
          router.push('/admin')
        } else {
          setError('Invalid username or password')
        }
      } else {
        setError('Invalid username or password')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Logo watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Image
            src="/logo.png"
            alt="Background"
            width={600}
            height={600}
            className="animate-spin-slow"
          />
        </div>
        
        {/* Gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-[120px] opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-purple-500 to-yellow-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <Image
              src="/logo.png"
              alt="Joker's Whistle"
              width={120}
              height={120}
              className="relative z-10 drop-shadow-2xl"
            />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent mb-1">
            JOKER'S WHISTLE
          </h1>
          <p className="text-xs text-emerald-400 font-bold tracking-widest">ADMIN PORTAL</p>
        </div>

        <div className="bg-black/60 backdrop-blur-xl border-2 border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/20 p-8">
          {/* Title */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-emerald-400" />
            <h2 className="text-2xl font-black text-white">
              SECURE ACCESS
            </h2>
          </div>
          <p className="text-center text-slate-400 mb-8 text-sm">
            Enter your credentials to access the control panel
          </p>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-emerald-400 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border-2 border-emerald-500/30 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all text-white placeholder-slate-500"
                placeholder=""
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-emerald-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-black/50 border-2 border-emerald-500/30 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all text-white placeholder-slate-500"
                  placeholder=""
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-black py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-xl shadow-emerald-500/50 hover:shadow-emerald-500/70 hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  <span>ACCESS DASHBOARD</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
