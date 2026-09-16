from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db
import time

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        start_time = time.time()
        await db.execute(text("SELECT 1"))
        latency = (time.time() - start_time) * 1000
        
        return {
            "status": "healthy",
            "database": "connected",
            "latency_ms": round(latency, 2)
        }
    except Exception as e:
        raise HTTPException(
            status_code=503, 
            detail="Database connection unreachable"
        )