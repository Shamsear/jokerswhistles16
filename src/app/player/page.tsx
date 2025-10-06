'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Trophy,
  Users,
  Zap,
  Home as HomeIcon,
  Settings,
  CheckCircle2,
  Link as LinkIcon
} from 'lucide-react'

export default function PlayerInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
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
              <h1 className="text-xl font-bold text-gray-900">Player Guide</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to The Tournament!
          </h1>
          <p className="text-xl text-gray-600">
            Here's everything you need to know to participate
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <LinkIcon className="inline h-5 w-5 mr-2" />
                  Register via Link
                </h3>
                <p className="text-gray-600">
                  The admin will send you a registration link. Click it, enter your name, and you'll get a unique Player ID. Save this ID!
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <HomeIcon className="inline h-5 w-5 mr-2" />
                  Wait for Your Role
                </h3>
                <p className="text-gray-600">
                  The admin will assign matches. If you're a HOME player, you'll get a special draw link to spin for your opponent.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <Zap className="inline h-5 w-5 mr-2" />
                  Spin the Wheel
                </h3>
                <p className="text-gray-600">
                  When you get a draw link, click it and spin the wheel to discover your opponent! Each spin is exciting and the results are recorded.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <Settings className="inline h-5 w-5 mr-2" />
                  Get Your Task
                </h3>
                <p className="text-gray-600">
                  For each match, you'll spin again to get a special task (positive or negative). This adds fun challenges to your games!
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                5
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <CheckCircle2 className="inline h-5 w-5 mr-2" />
                  Play and Report
                </h3>
                <p className="text-gray-600">
                  Play your matches with your assigned tasks, then report the results back to the admin. Simple as that!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Points */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-3">✅ No Login Required</h3>
            <p className="text-blue-800 text-sm">
              Everything is link-based. You don't need passwords or accounts. Just click the links the admin sends you!
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-3">🎪 Spinning Wheel Fun</h3>
            <p className="text-purple-800 text-sm">
              Watch the wheel spin with excitement! Each draw is animated and makes the tournament more engaging.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
            <h3 className="text-lg font-bold text-green-900 mb-3">🏠 Only HOME Players Draw</h3>
            <p className="text-green-800 text-sm">
              If you're assigned as a HOME player, you'll spin to see your opponent. AWAY players just wait to be matched.
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6">
            <h3 className="text-lg font-bold text-yellow-900 mb-3">💾 Save Your Player ID</h3>
            <p className="text-yellow-800 text-sm">
              After registration, you get a unique ID. Keep it safe - you'll need it to access your tournament info.
            </p>
          </div>
        </div>

        {/* Tournament Phases */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tournament Phases</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-gray-900">Phase 1: Registration</h4>
              <p className="text-sm text-gray-600">Use the registration link to join the tournament</p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-gray-900">Phase 2: Opponent Draw</h4>
              <p className="text-sm text-gray-600">HOME players spin to discover their opponents</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-gray-900">Phase 3: Home/Away Assignment</h4>
              <p className="text-sm text-gray-600">Roles are assigned - you'll know if you're home or away</p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-semibold text-gray-900">Phase 4-5: Task Assignment</h4>
              <p className="text-sm text-gray-600">Spin for your match tasks - adds fun challenges</p>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-gray-900">Phase 6: Match Time!</h4>
              <p className="text-sm text-gray-600">Play your matches and report results</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Join?</h2>
          <p className="text-blue-100 mb-6">
            Ask the tournament admin for your registration link and get started!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/admin"
              className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}