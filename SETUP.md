# 🚀 Setup Guide - The Joker's Whistle Tournament

This guide will walk you through setting up The Joker's Whistle Tournament system from scratch.

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js (v18 or higher)
- npm or yarn
- A Neon Database account (free tier available)
- Git (optional, for version control)

## 🔧 Step 1: Neon Database Setup

### 1.1 Create Neon Account
1. Visit [Neon Console](https://console.neon.tech/)
2. Sign up for a free account
3. Verify your email address

### 1.2 Create Database Project
1. Click "Create Project"
2. Choose a name (e.g., "jokers-whistle-tournament")
3. Select your region (choose closest to your users)
4. Wait for database creation (usually takes 10-20 seconds)

### 1.3 Get Connection String
1. In your project dashboard, click "Connection Details"
2. Copy the connection string
3. It should look like:
   ```
   postgresql://username:password@ep-xxx-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

## ⚙️ Step 2: Project Configuration

### 2.1 Update Environment Variables

Open `.env.local` and update with your values:

```env
# Database - Paste your Neon connection string here
DATABASE_URL="postgresql://your-username:your-password@your-host.neon.tech/your-database?sslmode=require"

# NextAuth
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=generate-a-random-secret-here

# Admin credentials (change these!)
ADMIN_EMAIL=admin@tournament.com
ADMIN_PASSWORD=changeme123

# Tournament settings
DEFAULT_TOURNAMENT_NAME="The Joker's Whistle Tournament"
```

### 2.2 Generate NextAuth Secret

Run this command to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as your `NEXTAUTH_SECRET`.

## 🗄️ Step 3: Database Migration

### 3.1 Push Schema to Neon

```bash
npx prisma db push
```

Expected output:
```
✔ Generated Prisma Client (x.x.x | library) to ./node_modules/@prisma/client

Your database is now in sync with your Prisma schema.
```

### 3.2 Generate Prisma Client

```bash
npx prisma generate
```

Expected output:
```
✔ Generated Prisma Client (x.x.x | library) to ./node_modules/@prisma/client
```

### 3.3 Verify Database Setup

Open Prisma Studio to view your database:
```bash
npx prisma studio
```

This will open a web interface at `http://localhost:5555` where you can view your database tables.

## 🚀 Step 4: Start the Application

### 4.1 Start Development Server

```bash
npm run dev
```

Expected output:
```
 ✓ Ready in 3.1s
 ○ Local:    http://localhost:3002
```

### 4.2 Access the Application

Open your browser and visit:
- **Homepage**: http://localhost:3002
- **Admin Dashboard**: http://localhost:3002/admin
- **Player Access**: http://localhost:3002/player

## 🎮 Step 5: Initial Setup

### 5.1 Create Your First Tournament

1. Visit `/admin`
2. Click "Create Tournament"
3. A tournament will be created automatically

### 5.2 Add Players

**Option A: Bulk Add**
1. In the Admin Dashboard, scroll to "Player Management"
2. Enter player names (one per line) in the textarea
3. Click "Add Players"

**Option B: Registration Links**
1. Click "Generate Link" in the Registration Links section
2. Copy the generated link
3. Share with players
4. Players can register themselves at `/player`

## 📊 Step 6: Tournament Flow

Follow these steps to run a complete tournament:

### Phase 1: Registration
- ✅ Add all players
- ✅ Ensure minimum 2 players (8+ recommended for full experience)

### Phase 2: Opponent Draw
1. Click "Phase 2" button
2. System automatically:
   - Selects 8 random opponents for each player
   - Creates all match fixtures
   - Assigns rounds 1-8

### Phase 3: Home/Away Assignment
1. Click "Phase 3" button
2. System determines home/away roles for each match

### Phase 4: Task Creation
1. Click "Phase 4" button
2. Create tasks using the Task Management section:
   - Enter task description
   - Select type (Positive/Negative)
   - Click "Add Task"
3. Add at least 10-20 tasks for variety

### Phase 5: Round-Based Task Assignment
1. Click "Phase 5" button
2. Players can now spin wheels for task assignments
3. Each round, players spin for their specific match tasks

### Phase 6: Match Execution
1. Click "Phase 6" button
2. Players:
   - View their assigned tasks
   - Play matches offline
   - Report results (coming soon)

## 🔍 Verification Checklist

Before launching your tournament, verify:

- [ ] Database connection is working
- [ ] You can access all three pages (home, admin, player)
- [ ] You can create a tournament
- [ ] You can add players (both bulk and individual)
- [ ] Phase progression works correctly
- [ ] Tasks can be created and deleted
- [ ] Player dashboard shows correct information

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: `Error: Can't reach database server`

**Solutions**:
1. Verify DATABASE_URL is correct
2. Check if Neon project is running
3. Ensure SSL mode is included: `?sslmode=require`
4. Check firewall/network settings

### Prisma Client Errors

**Problem**: `@prisma/client did not initialize yet`

**Solutions**:
```bash
# Regenerate Prisma Client
npx prisma generate

# Restart development server
# Press Ctrl+C to stop, then:
npm run dev
```

### Port Already in Use

**Problem**: `Port 3002 is in use`

**Solutions**:
1. Kill the process using that port
2. Or use a different port:
   ```bash
   npm run dev -- -p 3003
   ```

### Build Errors

**Problem**: TypeScript or build errors

**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Restart dev server
npm run dev
```

## 🌐 Step 7: Production Deployment

### Option A: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Add environment variables:
     - `DATABASE_URL`
     - `NEXTAUTH_URL` (use your Vercel domain)
     - `NEXTAUTH_SECRET`
   - Click "Deploy"

3. **Configure Domain**
   - Vercel will provide a `.vercel.app` domain
   - Or connect your custom domain

### Option B: Other Platforms

The application can be deployed to:
- Netlify
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify

Ensure you:
1. Set all environment variables
2. Run `npx prisma generate` during build
3. Use Node.js 18+

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Vercel Deployment](https://vercel.com/docs)

## 🎯 Next Steps

After setup:
1. Customize tournament settings
2. Add your branding
3. Test with a small group first
4. Gather feedback
5. Launch to full audience

## 💡 Tips for Success

1. **Test with Sample Data**: Create test players before your real tournament
2. **Plan Task Pool**: Prepare 20-30 varied tasks before Phase 4
3. **Communicate Clearly**: Explain tournament rules to all participants
4. **Monitor Progress**: Use admin dashboard to track tournament status
5. **Have Fun**: The spinning wheel adds excitement - embrace it!

## 🆘 Support

If you encounter issues:
1. Check this setup guide
2. Review the troubleshooting section
3. Check the project's README.md
4. Verify your environment variables
5. Ensure database connection is active

---

**Ready to start your tournament?** Follow the steps above and enjoy managing exciting matches with The Joker's Whistle Tournament system! 🎪🏆