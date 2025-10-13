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
    
    print("✓ Connected successfully")
    
    # Check if column already exists
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='matches' AND column_name='knockoutStage'
    """)
    
    if cursor.fetchone():
        print("⚠ Column 'knockoutStage' already exists. Nothing to do.")
    else:
        print("Adding 'knockoutStage' column to matches table...")
        
        # Add the column
        cursor.execute("""
            ALTER TABLE matches 
            ADD COLUMN "knockoutStage" TEXT
        """)
        
        conn.commit()
        print("✓ Column 'knockoutStage' added successfully!")
        
        # Verify the column was added
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name='matches' AND column_name='knockoutStage'
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"✓ Verified: Column '{result[0]}' with type '{result[1]}'")
        
        # Show current match count
        cursor.execute("SELECT COUNT(*) FROM matches")
        match_count = cursor.fetchone()[0]
        print(f"\n✓ Database updated! Total matches: {match_count}")
        print("✓ All existing matches have knockoutStage = NULL (pool matches)")
        print("\nYou can now generate knockout stages in the admin panel!")
    
    cursor.close()
    conn.close()
    print("\n✅ Done!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nMake sure:")
    print("1. Database is running")
    print("2. DATABASE_URL in .env is correct")
    print("3. You have psycopg2 installed (pip install psycopg2-binary)")
