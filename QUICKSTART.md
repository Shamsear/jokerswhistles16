# ⚡ Quick Start - The Joker's Whistle Tournament

Get your tournament running in 5 minutes!

## 🚀 1. Setup Database (2 minutes)

```bash
# 1. Visit https://console.neon.tech/ and create a free account
# 2. Create a new project
# 3. Copy your connection string
# 4. Update .env.local with your connection string

# Edit .env.local:
DATABASE_URL="your-neon-connection-string-here"
```

## 📦 2. Install & Initialize (2 minutes)

```bash
# Install dependencies (if not already done)
npm install

# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate
```

## 🎮 3. Start the App (30 seconds)

```bash
# Start development server
npm run dev

# Open in browser:
# http://localhost:3002
```

## 🎪 4. Run Your First Tournament (1 minute)

### Quick Steps:

1. **Visit Admin Dashboard**
   ```
   http://localhost:3002/admin
   ```

2. **Create Tournament**
   - Click "Create Tournament" button
   - Done! ✅

3. **Add Players** (Choose one method)
   
   **Method A: Bulk Add** (Fastest)
   ```
   - Paste names in textarea (one per line):
     Alice
     Bob
     Charlie
     David
     Emma
     Frank
     Grace
     Henry
   - Click "Add Players"
   ```
   
   **Method B: Registration Links**
   ```
   - Click "Generate Link"
   - Copy and share with players
   - Players register themselves at /player
   ```

4. **Progress Through Phases**
   ```
   Phase 1 ✅ (You're here)
   ↓
   Click "Phase 2" → System generates opponent draws
   ↓
   Click "Phase 3" → System assigns home/away roles
   ↓
   Click "Phase 4" → Create tasks
   ↓
   Click "Phase 5" → Task assignments
   ↓
   Click "Phase 6" → Match execution
   ```

## 🎯 Phase-by-Phase Quick Guide

### Phase 1: Registration (You Are Here)
```bash
# Add 8-16 players for best experience
# Minimum: 2 players
# Recommended: 8+ players
```

### Phase 2: Opponent Draw
```bash
# What happens:
# ✓ Each player gets 8 random opponents
# ✓ 8 rounds of matches created
# ✓ Automatic fixture generation

# Action needed: Just click "Phase 2"
```

### Phase 3: Home/Away Assignment
```bash
# What happens:
# ✓ Each match assigned home/away roles
# ✓ Fair distribution

# Action needed: Just click "Phase 3"
```

### Phase 4: Task Pool Creation
```bash
# Create tasks like:
Positive Tasks:
- Extra timeout
- Choose field side
- +5 bonus points
- Free substitution

Negative Tasks:
- Play with 1 less player
- No substitutions
- Must score from outside box
- Captain can't play

# Add 10-20 tasks minimum
```

### Phase 5: Round-Based Assignment
```bash
# What happens:
# ✓ Each round, players spin for tasks
# ✓ One task per player per match
# ✓ Tasks excluded after assignment

# Players access: http://localhost:3002/player
```

### Phase 6: Match Execution
```bash
# Players:
# 1. View their assigned tasks
# 2. Play matches offline
# 3. Report results (coming soon)
```

## 👥 Player Access

### Register as Player:
```
1. Visit: http://localhost:3002/player
2. Enter name
3. Enter email (optional)
4. Click "Register"
5. View your dashboard!
```

### Player Dashboard Shows:
- ✅ Your home matches
- ✅ Your away matches
- ✅ Round information
- ✅ Opponent names
- ✅ Tournament phase status

## 📱 URLs Cheat Sheet

```
Homepage:        http://localhost:3002
Admin Panel:     http://localhost:3002/admin
Player Access:   http://localhost:3002/player
```

## 🎨 Sample Data for Testing

### Test Players (8 players):
```
Alice Johnson
Bob Smith
Charlie Brown
Diana Prince
Emma Watson
Frank Castle
Grace Hopper
Henry Ford
```

### Test Tasks (10 tasks):
```
Positive:
- Extra 30-second timeout
- Choose kick-off
- +3 bonus points at start
- Free substitution anytime
- Choose which goal to defend

Negative:
- Play with 1 less player for 5 minutes
- No substitutions allowed
- Must score from outside penalty area
- Captain sits out for first 3 minutes
- All goals worth half points
```

## ⚠️ Common Issues

### Can't connect to database?
```bash
# Check .env.local has correct DATABASE_URL
# Verify Neon project is active
# Run: npx prisma db push
```

### Page won't load?
```bash
# Restart the server:
# Ctrl+C to stop
npm run dev
```

### Prisma errors?
```bash
npx prisma generate
npm run dev
```

## 🎓 Tips for Success

1. **Start Small**: Test with 4-8 players first
2. **Create Tasks Early**: Have 20+ tasks ready before Phase 4
3. **Communicate**: Share phase updates with players
4. **Test Features**: Try each phase before real tournament
5. **Have Fun**: The spinning wheel adds excitement!

## 📚 Next Steps

Once you're comfortable:
- Read [SETUP.md](./SETUP.md) for detailed setup
- Check [FEATURES.md](./FEATURES.md) for all features
- Review [README.md](./README.md) for documentation
- Deploy to Vercel for production use

## 🆘 Need Help?

- Check SETUP.md for troubleshooting
- Verify .env.local configuration
- Ensure database connection is active
- Restart the development server

---

**That's it!** You're ready to run your first tournament! 🎉🏆

Total time: ~5 minutes
Difficulty: Easy
Fun level: Maximum! 🎪