from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from config import settings

engine = create_async_engine(
    settings.database_url,
    pool_size=10,         
    max_overflow=20,      
    pool_timeout=30,      
    pool_pre_ping=True    
)

AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

Base = declarative_base()

# This is a "Dependency" used in FastAPI routes
async def get_db():
    db = AsyncSessionLocal()
    try:
        yield db
    finally:
        await db.close()