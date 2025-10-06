'use client'

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Users, Trophy, Settings, Zap, Sparkles, Target, Award, PlayCircle, ChevronDown, Calendar, Medal } from 'lucide-react';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger animations on mount
    setTimeout(() => setIsLoaded(true), 100);
    setTimeout(() => setShowContent(true), 2000);
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      {/* Animated Background with Logo Pattern */}
      <div className="fixed inset-0 z-0">
        {/* Large faded logo background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <Image
            src="/logo.png"
            alt="Background"
            width={800}
            height={800}
            className="animate-spin-slow"
            style={{ animationDuration: '60s' }}
          />
        </div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-[120px] opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500 rounded-full blur-[120px] opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]"></div>
      </div>
      
      {/* Hero Section - Animated Joker Entrance */}
      <main className="relative z-10">
        {/* Fullscreen Hero */}
        <section className="min-h-screen flex items-center justify-center relative">
          {/* Floating Navigation */}
          <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-1000 ${
            isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-6">
              <div className="bg-black/40 backdrop-blur-xl border border-emerald-500/20 rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 shadow-2xl shadow-emerald-500/10">
                {/* Logo Section */}
                <div className="flex items-center justify-between w-full sm:w-auto">
                  <div className="flex-shrink-0">
                    <h1 className="text-sm sm:text-base md:text-xl font-black bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
                      JOKER'S WHISTLE
                    </h1>
                    <p className="text-[8px] sm:text-[9px] md:text-[10px] text-emerald-400 font-bold tracking-widest">SEASON 16</p>
                  </div>
                  {/* Mobile Play Button (visible only on small screens) */}
                  <Link
                    href="/player"
                    className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-lg transition-all text-black font-bold text-xs shadow-lg shadow-emerald-500/50"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    <span>PLAY</span>
                  </Link>
                </div>
                
                {/* Navigation Links */}
                <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
                  <Link
                    href="/fixtures"
                    className="group flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 bg-black/50 hover:bg-yellow-500/20 border border-yellow-500/30 hover:border-yellow-400/50 rounded-lg sm:rounded-xl transition-all text-yellow-400 hover:text-yellow-300 text-xs sm:text-sm font-semibold flex-1 sm:flex-initial touch-manipulation"
                    title="View Fixtures"
                  >
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden lg:inline">Fixtures</span>
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="group flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 bg-black/50 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-400/50 rounded-lg sm:rounded-xl transition-all text-purple-400 hover:text-purple-300 text-xs sm:text-sm font-semibold flex-1 sm:flex-initial touch-manipulation"
                    title="View Leaderboard"
                  >
                    <Medal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden lg:inline">Leaderboard</span>
                  </Link>
                  <Link
                    href="/admin/login"
                    className="group flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 bg-black/50 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400/50 rounded-lg sm:rounded-xl transition-all text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-semibold flex-1 sm:flex-initial touch-manipulation"
                    title="Admin Access"
                  >
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden lg:inline">Admin</span>
                  </Link>
                  {/* Desktop Play Button (hidden on small screens) */}
                  <Link
                    href="/player"
                    className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-lg sm:rounded-xl transition-all text-black font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 hover:scale-105 touch-manipulation"
                  >
                    <PlayCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>PLAY</span>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Hero Content */}
          <div className="text-center px-6 max-w-5xl mx-auto pt-32">
            {/* Title Animation */}
            <div className={`space-y-4 transition-all duration-1000 delay-300 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <div className="relative">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight">
                  <span className="block text-slate-400 text-lg md:text-xl font-bold tracking-wider mb-2 uppercase">Welcome to the</span>
                  <span className="block relative">
                    <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 opacity-30"></span>
                    <span className="relative bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-2xl">
                      JOKER'S WHISTLE
                    </span>
                  </span>
                  <span className="block text-white text-xl md:text-2xl mt-1 font-bold tracking-wide">TOURNAMENT</span>
                </h1>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <div className="h-0.5 w-10 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-50 animate-pulse"></div>
                  <p className="relative text-lg md:text-2xl font-black bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent tracking-wider">
                    ⚽ SEASON 16 ⚽
                  </p>
                </div>
                <div className="h-0.5 w-10 bg-gradient-to-l from-transparent via-emerald-500 to-transparent"></div>
              </div>
            </div>

            {/* Subtitle */}
            <p className={`text-base md:text-lg text-slate-300 mt-4 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-500 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              South Soccers Super League <span className="text-emerald-400">⚽</span> The Ultimate Tournament Experience
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-3 justify-center mt-6 transition-all duration-1000 delay-700 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <Link
                href="/player"
                className="group relative px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl font-black text-sm text-black hover:from-emerald-400 hover:to-emerald-500 transition-all hover:scale-105 shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/70 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center justify-center gap-2">
                  <Trophy className="h-4 w-4" />
                  JOIN TOURNAMENT
                </span>
              </Link>
              <Link
                href="/fixtures"
                className="group px-6 py-3 bg-black/50 backdrop-blur-xl border-2 border-yellow-500/50 hover:border-yellow-400 rounded-xl font-bold text-sm text-yellow-400 hover:text-white transition-all hover:scale-105 shadow-xl hover:bg-yellow-500/10"
              >
                <span className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  VIEW FIXTURES
                </span>
              </Link>
              <Link
                href="/leaderboard"
                className="group px-6 py-3 bg-black/50 backdrop-blur-xl border-2 border-purple-500/50 hover:border-purple-400 rounded-xl font-bold text-sm text-purple-400 hover:text-white transition-all hover:scale-105 shadow-xl hover:bg-purple-500/10"
              >
                <span className="flex items-center justify-center gap-2">
                  <Medal className="h-4 w-4" />
                  VIEW LEADERBOARD
                </span>
              </Link>
              <Link
                href="/admin/login"
                className="group px-6 py-3 bg-black/50 backdrop-blur-xl border-2 border-emerald-500/50 hover:border-emerald-400 rounded-xl font-bold text-sm text-emerald-400 hover:text-white transition-all hover:scale-105 shadow-xl hover:bg-emerald-500/10"
              >
                <span className="flex items-center justify-center gap-2">
                  <Settings className="h-4 w-4" />
                  ADMIN ACCESS
                </span>
              </Link>
            </div>

            {/* Scroll Indicator */}
            {showContent && (
              <div className="mt-20 animate-bounce">
                <ChevronDown className="h-8 w-8 text-emerald-400 mx-auto" />
                <p className="text-sm text-slate-400 mt-2">Scroll to explore</p>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black mb-4">
                <span className="bg-gradient-to-r from-emerald-400 via-purple-400 to-yellow-400 bg-clip-text text-transparent">
                  GAME FEATURES
                </span>
              </h2>
              <p className="text-slate-400 text-lg">Everything you need for an epic tournament</p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Users className="h-8 w-8" />,
                  title: "Player Registration",
                  desc: "Easy sign-up with bulk import and shareable links",
                  color: "emerald"
                },
                {
                  icon: <Sparkles className="h-8 w-8" />,
                  title: "Spinning Wheels",
                  desc: "Animated draws with shareable video recordings",
                  color: "purple"
                },
                {
                  icon: <Trophy className="h-8 w-8" />,
                  title: "Task Challenges",
                  desc: "Intelligent task assignment with fair distribution",
                  color: "yellow"
                },
                {
                  icon: <Calendar className="h-8 w-8" />,
                  title: "Live Fixtures",
                  desc: "Real-time match schedules with scores and updates",
                  color: "yellow",
                  link: "/fixtures"
                },
                {
                  icon: <Medal className="h-8 w-8" />,
                  title: "Leaderboard",
                  desc: "Track standings and player statistics live",
                  color: "purple",
                  link: "/leaderboard"
                },
                {
                  icon: <Target className="h-8 w-8" />,
                  title: "Pool System",
                  desc: "6 pool matches per player with knockout finals",
                  color: "emerald"
                },
                {
                  icon: <Settings className="h-8 w-8" />,
                  title: "Admin Dashboard",
                  desc: "Complete control with real-time oversight",
                  color: "purple"
                },
                {
                  icon: <Award className="h-8 w-8" />,
                  title: "Share & Glory",
                  desc: "Download and share your winning moments",
                  color: "yellow"
                }
              ].map((feature, idx) => {
                const CardContent = (
                  <>
                    <div className={`inline-flex p-4 bg-${feature.color}-500/10 rounded-xl mb-4 group-hover:bg-${feature.color}-500/20 transition-colors`}>
                      <div className={`text-${feature.color}-400`}>{feature.icon}</div>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400">{feature.desc}</p>
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-${feature.color}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl`}></div>
                  </>
                );

                return feature.link ? (
                  <Link
                    key={idx}
                    href={feature.link}
                    className={`group relative bg-black/40 backdrop-blur-xl border-2 border-${feature.color}-500/20 hover:border-${feature.color}-400/50 rounded-2xl p-8 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-${feature.color}-500/20 cursor-pointer block`}
                  >
                    {CardContent}
                  </Link>
                ) : (
                  <div
                    key={idx}
                    className={`group relative bg-black/40 backdrop-blur-xl border-2 border-${feature.color}-500/20 hover:border-${feature.color}-400/50 rounded-2xl p-8 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-${feature.color}-500/20`}
                  >
                    {CardContent}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-emerald-500 via-purple-500 to-yellow-500 rounded-3xl p-12 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                  READY FOR THE CHALLENGE?
                </h2>
                <p className="text-xl text-white/90 mb-8">
                  Join Season 16 and prove you're the champion!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
                  <Link
                    href="/player"
                    className="px-10 py-4 bg-black hover:bg-black/80 text-white font-black rounded-xl transition-all hover:scale-105 shadow-2xl flex items-center justify-center gap-3"
                  >
                    <Trophy className="h-6 w-6" />
                    START PLAYING
                  </Link>
                  <Link
                    href="/fixtures"
                    className="px-8 py-4 bg-white/90 hover:bg-white text-black font-bold rounded-xl transition-all hover:scale-105 shadow-2xl flex items-center justify-center gap-3"
                  >
                    <Calendar className="h-6 w-6" />
                    VIEW FIXTURES
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="px-8 py-4 bg-white/90 hover:bg-white text-black font-bold rounded-xl transition-all hover:scale-105 shadow-2xl flex items-center justify-center gap-3"
                  >
                    <Medal className="h-6 w-6" />
                    LEADERBOARD
                  </Link>
                  <Link
                    href="/admin/login"
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 border-2 border-white text-white font-bold rounded-xl transition-all hover:scale-105 shadow-2xl flex items-center justify-center gap-3"
                  >
                    <Settings className="h-6 w-6" />
                    ADMIN PANEL
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-emerald-500/10 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            © 2025 Joker's Whistle Tournament • Season 16 • South Soccers Super League
          </p>
        </div>
      </footer>
    </div>
  );
}
