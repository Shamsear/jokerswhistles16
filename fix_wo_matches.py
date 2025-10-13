import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from .env
database_url = os.getenv('DATABASE_URL')

if not database_url:
    print("ERROR: DATABASE_URL not found in .env file")
    exit(1)

print("Connecting to database...")

try:
    # Connect to database
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    print("✓ Connected successfully\n")
    
    # Find all WO matches (home_absent or away_absent)
    cursor.execute("""
        SELECT id, "homePlayerId", "awayPlayerId", "homeScore", "awayScore", 
               "winnerId", "absentStatus", status
        FROM matches
        WHERE "absentStatus" IN ('home_absent', 'away_absent')
    """)
    
    wo_matches = cursor.fetchall()
    
    if not wo_matches:
        print("⚠ No WO matches found (home_absent or away_absent)")
        conn.close()
        exit(0)
    
    print(f"Found {len(wo_matches)} WO matches to update:\n")
    
    updated_count = 0
    
    for match in wo_matches:
        match_id, home_player_id, away_player_id, home_score, away_score, winner_id, absent_status, status = match
        
        # Determine correct winner and scores
        if absent_status == 'away_absent':
            # Away player absent, home player wins
            correct_home_score = 1
            correct_away_score = 0
            correct_winner = home_player_id
            winner_name = "Home Player"
        elif absent_status == 'home_absent':
            # Home player absent, away player wins
            correct_home_score = 0
            correct_away_score = 1
            correct_winner = away_player_id
            winner_name = "Away Player"
        else:
            continue
        
        # Check if needs update
        needs_update = (
            home_score != correct_home_score or
            away_score != correct_away_score or
            winner_id != correct_winner or
            status != 'completed'
        )
        
        if needs_update:
            print(f"Match {match_id[:8]}... [{absent_status}]")
            print(f"  Before: {home_score}-{away_score}, Winner: {winner_id[:8] if winner_id else 'None'}..., Status: {status}")
            print(f"  After:  {correct_home_score}-{correct_away_score}, Winner: {correct_winner[:8]}... ({winner_name}), Status: completed")
            
            # Update the match
            cursor.execute("""
                UPDATE matches
                SET "homeScore" = %s,
                    "awayScore" = %s,
                    "winnerId" = %s,
                    status = 'completed'
                WHERE id = %s
            """, (correct_home_score, correct_away_score, correct_winner, match_id))
            
            updated_count += 1
            print("  ✓ Updated!\n")
        else:
            print(f"Match {match_id[:8]}... [{absent_status}] - Already correct, skipping\n")
    
    # Commit all changes
    if updated_count > 0:
        conn.commit()
        print(f"\n✅ Successfully updated {updated_count} WO matches!")
        print("\nSummary:")
        print("- WO matches now have proper winners")
        print("- Scores set to 1-0 or 0-1")
        print("- Status set to 'completed'")
        print("\nRefresh your fixtures page to see the changes!")
    else:
        print("\n✓ All WO matches are already correct. No updates needed.")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nMake sure:")
    print("1. Database is running")
    print("2. DATABASE_URL in .env is correct")
    print("3. You have psycopg2 installed (pip install psycopg2-binary)")
