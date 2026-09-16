import asyncio
from datetime import datetime, timedelta
from random import Random
import hashlib
from sqlalchemy import select
from database import AsyncSessionLocal
from db.models import DailyPlate
from logic import game

async def seed_plates(start_date_str: str, end_date_str: str):
    current = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    end = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    
    async with AsyncSessionLocal() as db:
        count = 0
        while current <= end:
            date_str = current.strftime("%Y-%m-%d")
            
            stmt = select(DailyPlate).where(DailyPlate.date == current)
            result = await db.execute(stmt)
            existing = result.scalars().first()
            
            if not existing:
                seed_value = int(hashlib.sha256(date_str.encode()).hexdigest(), 16) % (10**8)
                local_rng = Random(seed_value)
                letters, total_count, goal_points = game.generate_valid_plate(rng=local_rng)
                
                new_plate = DailyPlate(
                    date=current,
                    sequence=letters,
                    total_count=total_count,
                    goal_points=goal_points
                )
                db.add(new_plate)
                count += 1
            
            current += timedelta(days=1)
            
        await db.commit()
        print(f"Successfully seeded {count} new plates!")

if __name__ == "__main__":
    asyncio.run(seed_plates("2026-08-01", "2030-12-31"))