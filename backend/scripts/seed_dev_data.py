import asyncio
from datetime import date, timedelta
import random
from sqlalchemy import text
from database import AsyncSessionLocal
from logic.summaries import build_daily_summaries

TEST_USERS = [
    ("user_101", "Alex"),
    ("user_102", "John"),
    ("user_103", "Jordan"),
    ("user_104", "Taylor"),
    ("user_105", "Morgan"),
    ("user_106", "Casey"),
    ("user_107", "Riley"),
    ("user_108", "Dakota"),
    ("user_109", "Reese"),
    ("user_110", "Quinn"),
    ("user_111", "Jack"),
    ("user_112", "Cassie"),
    ("user_113", "Fabian"),
    ("user_114", "Moe"),
]

SAMPLE_WORDS = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GOLF", "HOTEL"]

async def seed_test_data():
    async with AsyncSessionLocal() as session:
        print("1. Seeding test users...")
        for user_id, display_name in TEST_USERS:
            await session.execute(
                text("""
                    INSERT INTO users (id, display_name)
                    VALUES (:id, :name)
                    ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name
                """),
                {"id": user_id, "name": display_name}
            )

        print("2. Generating point transactions across the last 7 days...")
        today = date.today()
        for day_offset in range(7):
            puzzle_date = today - timedelta(days=day_offset)
            
            for user_id, _ in TEST_USERS:
                # Randomize participation so ranks and scores vary per day
                if random.random() < 0.2:
                    continue
                
                word_count = random.randint(1, 5)
                for _ in range(word_count):
                    word = random.choice(SAMPLE_WORDS)
                    points = random.randint(15, 120)
                    await session.execute(
                        text("""
                            INSERT INTO point_transactions (user_id, puzzle_date, points, word)
                            VALUES (:user_id, :puzzle_date, :points, :word)
                        """),
                        {"user_id": user_id, "puzzle_date": puzzle_date, "points": points, "word": word}
                    )

        await session.commit()
        print("3. Transactions committed. Building daily summaries...")

        # Run historical aggregation across all dates
        updated_rows = await build_daily_summaries(session, target_date=None)
        print(f"Success! Populated/updated {updated_rows} rows in daily_user_summaries.")

if __name__ == "__main__":
    asyncio.run(seed_test_data())