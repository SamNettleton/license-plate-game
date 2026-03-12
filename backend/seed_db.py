import asyncio
import json
import time
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from config import settings

# 1. Setup Connection
engine = create_async_engine(settings.database_url)

async def seed_dictionary():
    print("🚀 Starting database seeding...")
    
    # 2. Create the Table
    # We use raw SQL here to ensure the schema is exactly what we want
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS dictionary (
                word TEXT PRIMARY KEY
            );
        """))
        print("✅ Table 'dictionary' is ready.")

    # 3. Load and Parse JSON
    try:
        with open("words_dictionary.json", "r") as f:
            data = json.load(f)
            # The JSON format is {"word": 1}, we just need the keys
            all_words = list(data.keys())
    except FileNotFoundError:
        print("❌ Error: words_dictionary.json not found in the current directory.")
        return

    total_words = len(all_words)
    print(f"📦 Loaded {total_words} words from JSON.")

    # 4. Bulk Insertion logic
    # We insert in chunks of 10,000 to avoid memory spikes
    chunk_size = 10000
    start_time = time.time()

    async with engine.begin() as conn:
        for i in range(0, total_words, chunk_size):
            batch = all_words[i : i + chunk_size]
            
            # Constructing a list of dictionaries for SQLAlchemy
            # Format: [{"word": "apple"}, {"word": "banana"}, ...]
            values = [{"word": w.lower().strip()} for w in batch]
            
            # PostgreSQL 'ON CONFLICT DO NOTHING' prevents errors if you run this twice
            stmt = text("""
                INSERT INTO dictionary (word) 
                VALUES (:word) 
                ON CONFLICT (word) DO NOTHING
            """)
            
            await conn.execute(stmt, values)
            
            print(f"  Inserted {min(i + chunk_size, total_words)} / {total_words}...")

    end_time = time.time()
    print(f"🏁 Finished! Successfully seeded {total_words} words in {end_time - start_time:.2f} seconds.")

if __name__ == "__main__":
    asyncio.run(seed_dictionary())