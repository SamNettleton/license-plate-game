from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, UUID4
from database import get_db

router = APIRouter()

class UserSyncRequest(BaseModel):
    user_id: UUID4
    display_name: str

@router.post("/users/sync")
async def sync_user(payload: UserSyncRequest, db: AsyncSession = Depends(get_db)):
    query = text("""
        INSERT INTO users (id, display_name, updated_at)
        VALUES (:id, :display_name, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET 
            display_name = EXCLUDED.display_name,
            updated_at = CURRENT_TIMESTAMP;
    """)
    await db.execute(query, {"id": str(payload.user_id), "display_name": payload.display_name})
    await db.commit()
    return {"status": "synced"}