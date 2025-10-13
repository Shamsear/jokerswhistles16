# WO (Walkover) and NULL Match Handling

## Overview

The system now supports marking matches as **WO (Walkover)** or **NULL** when players are absent, allowing you to complete rounds even when players cannot attend.

## Match Types

### 1. 🏆 Normal Match
- **Both players present**
- Enter actual scores (e.g., 5-3, 7-2)
- Winner determined by higher score

### 2. ⚠️ WO (Walkover)
- **One player absent**
- Present player wins by default
- Recorded as 1-0 in favor of present player
- Shows "WO" badge on fixtures
- **IMPORTANT**: Only matches marked as WO show the badge (not all 1-0 scores)

### 3. ⭕ NULL Match
- **Both players absent**
- No winner declared
- Recorded as null scores (no points)
- Shows "NULL" badge on fixtures
- Match marked as completed but neither player gets points

## How to Use

### Admin Interface (`/admin/fixtures`)

When editing a match, you have **3 quick action buttons**:

```
┌─────────────────┬─────────────┬─────────────┐
│ NULL            │  WO Home    │  WO Away    │
│ (Both Absent)   │             │             │
└─────────────────┴─────────────┴─────────────┘
```

#### NULL (Both Absent)
1. Click "Enter Result" on the match
2. Click "NULL (Both Absent)" button
3. Match is marked as complete with:
   - Home Score: null
   - Away Score: null
   - Status: Completed
   - Winner: None

#### WO Home (Home Player Wins by Walkover)
1. Click "Enter Result" on the match
2. Click "WO Home" button
3. Match is marked as complete with:
   - Home Score: 1
   - Away Score: 0
   - Status: Completed
   - Winner: Home Player
   - Badge: WO

#### WO Away (Away Player Wins by Walkover)
1. Click "Enter Result" on the match
2. Click "WO Away" button
3. Match is marked as complete with:
   - Home Score: 0
   - Away Score: 1
   - Status: Completed
   - Winner: Away Player
   - Badge: WO

## Points Calculation

### Normal Match
- Winner: **3 points**
- Loser: **0 points**
- Goals count for goal difference

### WO (Walkover)
- Winner: **3 points** (1 goal for)
- Loser: **0 points** (1 goal against)
- Counts as 1-0 in standings

### NULL Match
- Both players: **0 points**
- No goals counted
- Match doesn't affect goal difference

## Visual Indicators

### Admin Fixtures Page
```
Match View:
┌────────────────────────────────────────┐
│ R1  Pool A  ✓ Completed                │
│ 🏠 Player A: 1                          │
│ ✈️ Player B: 0                          │
│ Winner: Player A  [WO]                 │
└────────────────────────────────────────┘

NULL Match:
┌────────────────────────────────────────┐
│ R1  Pool A  ✓ Completed                │
│ 🏠 Player C: -                          │
│ ✈️ Player D: -                          │
│ [NULL] Both players absent             │
└────────────────────────────────────────┘
```

### Public Fixtures Page
- Same visual indicators
- WO badge shown in yellow
- NULL badge shown in gray

## Database Changes

### Schema Update

Added `absentStatus` field to Match model:

```prisma
model Match {
  // ... other fields
  absentStatus String? // null, "home_absent", "away_absent", "both_absent"
}
```

Run migration:
```bash
npx prisma migrate dev --name add_absent_status
```

## Use Cases

### Example 1: Player No-Show
Player A doesn't show up for their match against Player B.

**Action**: Click "WO Away" 
**Result**: 
- Player B wins automatically
- Match shows 0-1 (WO)
- Player B gets 3 points
- Round can be completed

### Example 2: Both Players Absent
Neither Player C nor Player D can attend their match.

**Action**: Click "NULL (Both Absent)"
**Result**:
- No winner declared
- Match shows - vs - (NULL)
- Neither player gets points
- Round can be completed

### Example 3: Tournament Continues
All other matches in Round 1 are completed, but 2 matches have absent players.

**Without WO/NULL**: Round stuck incomplete, can't advance
**With WO/NULL**: Mark matches appropriately, round completes, tournament continues

## Leaderboard Impact

### Standings Calculation
1. **Points**: WO win = 3 points (same as normal win)
2. **Goal Difference**: WO counts as +1/-1 goal difference
3. **NULL matches**: Don't affect standings at all

### Example Leaderboard
```
Pos  Player    MP  W  L  GF  GA  GD  Pts
1    Player A  3   3  0  10  2   +8  9   (includes 1 WO)
2    Player B  3   2  1  8   4   +4  6
3    Player C  3   2  1  7   5   +2  6   (1 NULL match)
4    Player D  3   0  3  1   10  -9  0   (includes 1 WO loss)
```

## Benefits

✅ **Complete Rounds**: Don't get stuck when players are absent
✅ **Fair System**: Present players get credited for showing up
✅ **Tournament Flow**: Maintain schedule even with absences
✅ **Clear Records**: Distinguish between WO and normal wins
✅ **Knockout Ready**: All pool matches can be completed for knockout generation

## Important Notes

⚠️ **One-Click Action**: WO/NULL buttons automatically save the match
⚠️ **Can't Undo**: Use "Reset" button if you make a mistake
⚠️ **Points Matter**: WO still gives 3 points to winner
⚠️ **NULL = 0 Points**: Neither player scores if both absent
⚠️ **WO Badge Only**: Only matches marked as WO show the badge (not normal 1-0 wins)
⚠️ **Database Tracking**: System uses `absentStatus` field to distinguish WO from normal wins

## Quick Reference

| Scenario | Action | Score | Winner | Points |
|----------|--------|-------|--------|--------|
| Normal match | Enter scores | X-Y | Higher score | 3 to winner |
| Home absent | WO Away | 0-1 | Away | 3 to away |
| Away absent | WO Home | 1-0 | Home | 3 to home |
| Both absent | NULL | null-null | None | 0 to both |
