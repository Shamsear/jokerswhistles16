# Pool-Based Tournament Structure

## Overview
The Joker's Whistle Tournament now uses a **pool-based elimination structure** where players are divided into 2 groups that compete separately until the finals.

## Tournament Flow

### Phase 1: Player Registration
- Players register through unique links or bulk import
- No pool assignment yet
- All players in single list

### Phase 2: Pool Assignment & Opponent Draw

#### Step 1: Pool Assignment (`/admin/pool-assignment`)
- **Purpose**: Divide players into 2 equal pools
- **Features**:
  - Manual assignment: Drag players to Pool A or Pool B
  - Random assignment: Automatic 50/50 split
  - Balance checking: Warns if pools are unbalanced
  - Visual interface showing all 3 groups (Unassigned, Pool A, Pool B)

#### Step 2: Opponent Draw (`/admin/opponent-draw`)
- **Pool-based matching**: Each player only faces opponents from their own pool
- **6 matches per player** (changed from 8)
- **Interactive wheel spin** for each match assignment
- **No duplicates**: Smart filtering prevents repeat matchups
- **Sequential process**:
  1. Spin wheel to select opponent
  2. Create match
  3. Move to next round
  4. Repeat for all 6 rounds per player
  5. Move to next player

### Phase 3-5: Pool Play
- Each pool plays independently
- Home/away assignments
- Task assignments
- Match execution
- Winner determination per pool

### Phase 6: Finals
- **Pool A Winner vs Pool B Winner**
- Single elimination match
- Determines overall tournament champion

## Database Schema Updates

### Player Model
```prisma
model Player {
  // ...
  pool String? // "A" or "B" for pool assignment
  // ...
}
```

### Match Model
```prisma
model Match {
  // ...
  round Int // 1-6 for pool rounds
  matchType String @default("pool") // "pool" or "final"
  pool String? // "A" or "B" for pool matches, null for finals
  winnerId String? // ID of the winning player
  // ...
}
```

## Key Features

### Pool Assignment Page
- **URL**: `/admin/pool-assignment`
- **Random Assignment**: One-click balanced split
- **Manual Control**: Move players between pools freely
- **Balance Indicator**: Real-time feedback on pool sizes
- **Save & Continue**: Validates all players assigned before proceeding

### Updated Opponent Draw
- **Pool-aware**: Only shows players from same pool as opponents
- **6 matches**: Reduced from 8 for better pool play
- **Progress tracking**: Shows per-player and overall progress
- **Beautiful UI**: Gradient backgrounds for Pool A (blue) and Pool B (purple)

## Admin Dashboard Updates

### Phase 2 Section
Now shows 2 steps:
1. **Pool Assignment** - Assign players to pools
2. **Opponent Draw** - Create matches within pools

### Status Indicators
- ✓ "Pools have been assigned" - When at least one player has pool assignment
- ✓ "X matches have been created" - Shows match creation progress

## API Endpoints

### New/Updated Endpoints
- `PATCH /api/players/[id]` - Update player pool assignment
- `POST /api/matches` - Create individual matches with pool info
- `GET /api/players/[id]` - Fetch player with pool info

## Tournament Structure Benefits

1. **Fairness**: Balanced competition within each pool
2. **Excitement**: Clear path to finals creates narrative
3. **Scalability**: Works with any even number of players
4. **Flexibility**: Admin can manually adjust pools if needed
5. **Finals Drama**: Best from each pool face off for championship

## Usage Instructions

### For Tournament Admins:

1. **Register Players** (Phase 1)
   - Use registration links or bulk import
   - Get at least 4 players (minimum 2 per pool)

2. **Move to Phase 2**
   - Click "Phase 2" button in admin dashboard

3. **Assign Pools**
   - Click "Assign Pools" button
   - Use "Random Assignment" or manually assign
   - Ensure balanced pools
   - Click "Save Pool Assignments & Continue"

4. **Start Opponent Draw**
   - Click "Start Opponent Draw" button
   - Click "Spin the Wheel" for each match
   - Watch progress through all players
   - Click "Save & Continue to Phase 3" when complete

5. **Continue Tournament** (Phases 3-6)
   - Each pool plays independently
   - Track wins and determine pool winners
   - Set up finals match between pool winners

## Technical Notes

- Pool assignments stored in `Player.pool` field
- Matches tagged with `Match.pool` field
- Final match has `Match.matchType = "final"` and `Match.pool = null`
- Winner tracking via `Match.winnerId` field for finals progression

## Future Enhancements

- Automatic pool winner determination based on match results
- Automatic finals match creation
- Pool standings/leaderboards
- Bracket visualization
- Multi-round finals (best of 3, etc.)
