# 🃏 The Joker's Whistle Tournament

A comprehensive tournament management system featuring opponent draws, task assignments, spinning wheel animations, and shareable spin videos.

## ✨ Features

### Tournament Phases
1. **Player Registration** - Admin creates registration links or bulk-adds players
2. **Opponent Draw** - Each player gets 8 randomly selected opponents
3. **Home/Away Assignment** - Spin to determine match roles
4. **Task Pool Creation** - Admin creates positive/negative tasks
5. **Round-Based Task Assignment** - Tasks assigned per round with exclusions
6. **Match Execution** - Players compete and report results

### Key Features
- 🎯 **Random Opponent Selection** - Each player faces 8 different opponents
- 🎪 **Spinning Wheel Animations** - Exciting draws and task assignments
- 🏠 **Home/Away Designations** - Fair match role assignment
- 📋 **Task Management** - Positive and negative tasks with intelligent distribution
- 📱 **Shareable Spin Videos** - Capture and share excitement on social media
- 👤 **Player Dashboard** - Track matches, tasks, and tournament progress
- 🔧 **Admin Controls** - Comprehensive tournament management

## 🚀 Setup Instructions

### 1. Database Setup (Neon)

1. Create a free account at [Neon Console](https://console.neon.tech/)
2. Create a new database project
3. Copy your connection string (looks like: `postgresql://username:password@host/database`)
4. Update the `DATABASE_URL` in `.env.local` with your connection string

### 2. Environment Configuration

Update `.env.local`:
```env
DATABASE_URL="your-neon-connection-string-here"
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-secret-key-here
```

### 3. Database Migration

```bash
# Push the schema to your database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3002`

## 🎮 How to Use

### For Administrators

1. **Visit `/admin`** to access the admin dashboard
2. **Create Tournament** - Start a new tournament
3. **Player Registration** - Generate registration links or bulk add players
4. **Phase Control** - Progress through tournament phases:
   - Phase 1: Registration open
   - Phase 2: Conduct opponent draws
   - Phase 3: Assign home/away roles
   - Phase 4: Create task pool
   - Phase 5: Begin round-based assignments
   - Phase 6: Monitor match results

### For Players

1. **Visit `/player`** to access player interface
2. **Register/Login** - Join the tournament
3. **View Dashboard** - See tournament status and your matches
4. **Spin for Tasks** - Get your round-specific tasks (when phase allows)
5. **Play Matches** - Complete your games and report results

## 📊 Tournament Structure

- **8 Rounds** per tournament
- **8 Opponents** per player (randomly assigned)
- **Home/Away** roles determined by spinning wheel
- **Task Assignment** - Each player gets unique tasks per round
- **Result Tracking** - Match outcomes recorded and displayed

## 🛠 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)
