import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from database import AsyncSessionLocal
from logic.summaries import build_daily_summaries

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("summary_worker")

scheduler = AsyncIOScheduler(timezone="UTC")


async def get_recently_active_puzzle_dates(db: AsyncSession) -> list:
    """Returns all puzzle_dates that received new transactions in the last 2 hours."""
    query = text("""
        SELECT DISTINCT puzzle_date 
        FROM point_transactions 
        WHERE created_at >= NOW() - INTERVAL '2 hours';
    """)
    result = await db.execute(query)
    return [row[0] for row in result.fetchall()]


async def _execute_aggregation_logic(db: AsyncSession):
    """Core aggregation logic operating on a given session."""
    active_dates = await get_recently_active_puzzle_dates(db)

    if not active_dates:
        logger.info("No recent transaction activity found.")
        return

    logger.info(f"Syncing summaries for active puzzle dates: {active_dates}")

    total_updated = 0
    for p_date in active_dates:
        rows = await build_daily_summaries(db, target_date=p_date)
        total_updated += rows

    logger.info(f"Summary update complete. Updated {total_updated} rows across {len(active_dates)} dates.")


async def run_summary_aggregation(db: AsyncSession | None = None):
    """
    Finds all recently modified puzzle dates (live or archive) and syncs them.
    Accepts an optional db session for testing.
    """
    if db is not None:
        await _execute_aggregation_logic(db)
    else:
        async with AsyncSessionLocal() as session:
            await _execute_aggregation_logic(session)


@scheduler.scheduled_job("cron", minute=0)
async def scheduled_hourly_summary_job():
    await run_summary_aggregation()


async def run_initial_backfill():
    """Runs a one-time full sync for all historical data on worker startup."""
    logger.info("Running initial historical backfill sync...")
    async with AsyncSessionLocal() as session:
        try:
            total_rows = await build_daily_summaries(session, target_date=None)
            logger.info(f"Historical backfill complete. Synced {total_rows} summary records.")
        except Exception as e:
            logger.error(f"Error during initial backfill: {e}", exc_info=True)


async def main():
    logger.info("Starting APScheduler worker...")
    scheduler.start()

    # Run the initial catch-up sync
    await run_initial_backfill()

    # Keep the worker process running indefinitely for scheduled jobs
    try:
        await asyncio.Event().wait()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Worker stopped.")


if __name__ == "__main__":
    asyncio.run(main())