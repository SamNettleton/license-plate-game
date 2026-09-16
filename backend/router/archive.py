from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from services.archive import get_user_monthly_summaries
from schemas.archive import MonthlyArchiveResponse

router = APIRouter(prefix="/archive", tags=["Archive"])

@router.get("/users/{user_id}", response_model=MonthlyArchiveResponse)
async def read_user_monthly_archive(
    user_id: str,
    year: int = Query(..., ge=2020, le=2030),
    month: int = Query(..., ge=1, le=12),
    db: AsyncSession = Depends(get_db),
):
    summaries = await get_user_monthly_summaries(db, user_id=user_id, year=year, month=month)
    
    return MonthlyArchiveResponse(
        user_id=user_id,
        year=year,
        month=month,
        summaries=summaries,
    )