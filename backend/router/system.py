from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import time

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        start_time = time.time()
        db.execute(text("SELECT 1"))
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