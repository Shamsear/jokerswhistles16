# Knockout Stage Implementation

## Overview

This tournament system now includes a complete knockout stage with the following structure:

### Tournament Flow

1. **Pool Matches (Rounds 1-6)**: All players compete in their assigned pools (A or B)
2. **Round of 16 (Round 7)**: Top 16 from each pool advance
3. **Quarter Finals (Round 8)**: 8 winners from Round of 16 in each pool
4. **Semi Finals (Round 9)**: 4 winners from Quarter Finals in each pool
5. **Group Finals (Round 10)**: 2 winners from Semi Finals in each pool
6. **Mega Final (Round 11)**: Winner of Pool A Final vs Winner of Pool B Final

## Database Changes

### Schema Updates

The `Match` model has been updated with:
- `knockoutStage`: String field to track knockout stages (`round_of_16`, `quarter_final`, `semi_final`, `group_final`, `mega_final`)
- Updated `matchType` to support knockout stages
- Updated phase descriptions in Tournament model

### Migration

Run the migration when your database is available:

```bash
npx prisma migrate dev --name add_knockout_stages
```

Or deploy to production:

```bash
npx prisma migrate deploy
```

## New Features

### 1. API Routes

**`/api/knockout`**
- `GET`: Fetch all knockout stage matches
- `POST`: Generate knockout stage matches
  - Without `stage` parameter: Generates Round of 16 from top 16 players based on standings
  - With `stage` parameter: Generates specific stage (e.g., `quarter_final`)

**`/api/auto-knockout`**
- `GET`: Check if pool matches are complete and ready for knockout
- `POST`: Auto-generate Round of 16 when pool matches are complete
- Returns progress tracking (completed/total pool matches)

### 2. Admin Pages

**`/admin/knockout`**
- Manage all knockout stages
- Generate each stage when ready
- View brackets for both pools
- Monitor match progress
- Automatic stage progression validation

### 3. Public Pages

**`/brackets`**
- Public-facing knockout brackets
- Live updates every 10 seconds
- Separate brackets for Pool A and Pool B
- Highlighted Mega Final section
- Champion display when Mega Final is completed

**`/fixtures`** (Updated)
- Now separates pool matches from knockout matches
- Shows knockout stage indicator when active
- Link to view full brackets

## Usage Guide

### For Administrators

1. **Complete Pool Matches**: Ensure all 6 rounds of pool matches are completed
2. **Navigate to Knockout Management**: Go to `/admin/knockout`
3. **Automatic Round of 16 Generation**: When all pool matches are completed:
   - System shows "All Pool Matches Complete" notification
   - Click "Generate Round of 16" to automatically create fixtures
   - Top 16 from each pool are automatically selected based on:
     - **Points** (wins = 3 points each)
     - **Goal difference** (goals scored - goals conceded)
     - **Total goals scored** (as tiebreaker)
   - Seeding: **1st vs 16th, 2nd vs 15th, 3rd vs 14th**, etc.
4. **Progress Through Stages**: As matches complete, generate next stages:
   - Quarter Finals (after Round of 16 completes)
   - Semi Finals (after Quarter Finals complete)
   - Group Finals (after Semi Finals complete)
   - Mega Final (after both Group Finals complete)

### Seeding System (Automatic)

Round of 16 matchups are **automatically seeded** based on final pool standings:
- **1st place vs 16th place**
- **2nd place vs 15th place**
- **3rd place vs 14th place**
- **4th place vs 13th place**
- **5th place vs 12th place**
- **6th place vs 11th place**
- **7th place vs 10th place**
- **8th place vs 9th place**

This ensures the top performers get the "easiest" matchups initially.

### For Public Viewing

1. Visit `/brackets` to see the live knockout brackets
2. View match progress in real-time
3. See which players advance through each stage
4. Watch the Mega Final to crown the ultimate champion

## Technical Details

### Stage Validation

The system validates that:
- All matches in a stage must be completed before generating the next stage
- Winners are properly determined before advancing
- Both pool finals must be completed before Mega Final can be created

### Round Numbers

- Rounds 1-6: Pool matches
- Round 7: Round of 16
- Round 8: Quarter Finals
- Round 9: Semi Finals
- Round 10: Group Finals
- Round 11: Mega Final

### Match Status

- `pending`: Match not yet played
- `completed`: Match finished with a winner

## Styling

The knockout stage uses:
- **Purple/Blue theme** for bracket visualization
- **Yellow/Gold theme** for Mega Final (championship)
- **Emerald theme** for winners
- Animated backgrounds and responsive design
- Mobile-friendly layouts

## Next Steps

1. Run the database migration
2. Complete your pool matches
3. Navigate to `/admin/knockout` to start the knockout stage
4. Share `/brackets` with participants and spectators

## Notes

- The system prevents generating stages out of order
- Top 16 qualification is automatic based on leaderboard standings
- The Mega Final brings together the best from each pool
- All pages include live refresh functionality
