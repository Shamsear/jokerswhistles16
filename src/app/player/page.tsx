'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, 
  Trophy,
  Users,
  Zap,
  Home as HomeIcon,
  Settings,
  CheckCircle2,
  Link as LinkIcon,
  Sparkles,
  Target,
  Award,
  PlayCircle,
  Calendar,
  UserCheck,
  Radio
} from 'lucide-react'

export default function PlayerInfoPage() {
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
            priority={false}
            loading="lazy"
            quality={50}
          />
        </div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500 rounded-full blur-[120px] opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-emerald-500/20 shadow-lg shadow-emerald-500/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14">
            <Link
              href="/"
              className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 transition-all group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-semibold">Back</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <h1 className="text-sm sm:text-base font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
                PLAYER GUIDE
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-purple-500 to-yellow-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 via-purple-500 to-yellow-500 rounded-full flex items-center justify-center">
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-black" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
              Welcome to the Tournament!
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto">
            Here's everything you need to know to participate and dominate
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-black/30 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="h-6 w-6 text-yellow-400" />
            <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              How It Works
            </h2>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Step 1 */}
            <div className="flex items-start space-x-3 sm:space-x-4 group">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-black font-black shadow-lg shadow-emerald-500/50 group-hover:scale-110 transition-transform">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                  Register via Link
                </h3>
                <p className="text-sm sm:text-base text-slate-300">
                  The admin will send you a registration link. Click it, enter your name, and you'll get a unique Player ID. Save this ID!
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-3 sm:space-x-4 group">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                  Wait for Your Role
                </h3>
                <p className="text-sm sm:text-base text-slate-300">
                  The admin will assign matches. If you're a HOME player, you'll get a special draw link to spin for your opponent.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-3 sm:space-x-4 group">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-black font-black shadow-lg shadow-yellow-500/50 group-hover:scale-110 transition-transform">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Radio className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                  Spin the Wheel
                </h3>
                <p className="text-sm sm:text-base text-slate-300">
                  When you get a draw link, click it and spin the wheel to discover your opponent! Each spin is exciting and the results are recorded.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-3 sm:space-x-4 group">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  Get Your Task
                </h3>
                <p className="text-sm sm:text-base text-slate-300">
                  For each match, you'll spin again to get a special task (positive or negative). This adds fun challenges to your games!
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start space-x-3 sm:space-x-4 group">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-black shadow-lg shadow-red-500/50 group-hover:scale-110 transition-transform">
                5
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                  Play and Report
                </h3>
                <p className="text-sm sm:text-base text-slate-300">
                  Play your matches with your assigned tasks, then report the results back to the admin. Simple as that!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-2 border-emerald-500/30 rounded-xl p-5 sm:p-6 hover:border-emerald-500/50 transition-all group">
            <h3 className="text-base sm:text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              No Login Required
            </h3>
            <p className="text-sm sm:text-base text-slate-300">
              Everything is link-based. You don't need passwords or accounts. Just click the links the admin sends you!
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-2 border-purple-500/30 rounded-xl p-5 sm:p-6 hover:border-purple-500/50 transition-all group">
            <h3 className="text-base sm:text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Spinning Wheel Fun
            </h3>
            <p className="text-sm sm:text-base text-slate-300">
              Watch the wheel spin with excitement! Each draw is animated and makes the tournament more engaging.
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-2 border-yellow-500/30 rounded-xl p-5 sm:p-6 hover:border-yellow-500/50 transition-all group">
            <h3 className="text-base sm:text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2">
              <HomeIcon className="h-5 w-5" />
              Only HOME Players Draw
            </h3>
            <p className="text-sm sm:text-base text-slate-300">
              If you're assigned as a HOME player, you'll spin to see your opponent. AWAY players just wait to be matched.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-2 border-blue-500/30 rounded-xl p-5 sm:p-6 hover:border-blue-500/50 transition-all group">
            <h3 className="text-base sm:text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Save Your Player ID
            </h3>
            <p className="text-sm sm:text-base text-slate-300">
              After registration, you get a unique ID. Keep it safe - you'll need it to access your tournament info.
            </p>
          </div>
        </div>

        {/* Tournament Phases */}
        <div className="bg-black/30 backdrop-blur-md border-2 border-purple-500/30 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Calendar className="h-6 w-6 text-purple-400" />
            <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent">
              Tournament Phases
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="border-l-4 border-emerald-500 pl-4 py-2 hover:bg-emerald-500/5 transition-colors rounded-r">
              <h4 className="font-bold text-white text-sm sm:text-base">Phase 1: Registration</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Use the registration link to join the tournament</p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4 py-2 hover:bg-purple-500/5 transition-colors rounded-r">
              <h4 className="font-bold text-white text-sm sm:text-base">Phase 2: Opponent Draw</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">HOME players spin to discover their opponents</p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4 py-2 hover:bg-yellow-500/5 transition-colors rounded-r">
              <h4 className="font-bold text-white text-sm sm:text-base">Phase 3: Home/Away Assignment</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Roles are assigned - you'll know if you're home or away</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-blue-500/5 transition-colors rounded-r">
              <h4 className="font-bold text-white text-sm sm:text-base">Phase 4-5: Task Assignment</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Spin for your match tasks - adds fun challenges</p>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4 py-2 hover:bg-red-500/5 transition-colors rounded-r">
              <h4 className="font-bold text-white text-sm sm:text-base">Phase 6: Match Time!</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Play your matches and report results</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-emerald-500/20 via-purple-500/20 to-yellow-500/20 border-2 border-emerald-500/30 rounded-2xl p-6 sm:p-8 text-center backdrop-blur-md">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-purple-500 to-yellow-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <Trophy className="relative h-12 w-12 sm:h-16 sm:w-16 text-yellow-400 mx-auto" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent mb-4">
            Ready to Join?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mb-6 max-w-2xl mx-auto">
            Ask the tournament admin for your registration link and get started on your journey to victory!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/"
              className="group flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl font-bold text-sm text-black transition-all hover:scale-105 shadow-lg shadow-emerald-500/50"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
            <Link
              href="/fixtures"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-black/50 backdrop-blur-xl border-2 border-yellow-500/50 hover:border-yellow-400 rounded-xl font-bold text-sm text-yellow-400 hover:text-white transition-all hover:scale-105 shadow-xl hover:bg-yellow-500/10"
            >
              <Calendar className="h-4 w-4" />
              <span>View Fixtures</span>
            </Link>
            <Link
              href="/admin/login"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-black/50 backdrop-blur-xl border-2 border-purple-500/50 hover:border-purple-400 rounded-xl font-bold text-sm text-purple-400 hover:text-white transition-all hover:scale-105 shadow-xl hover:bg-purple-500/10"
            >
              <Settings className="h-4 w-4" />
              <span>Admin Access</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
