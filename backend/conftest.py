import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from config import settings
from database import Base, get_db
from main import app

import db.models  # noqa: F401


@pytest_asyncio.fixture
async def test_engine():
    """
    Creates fresh database tables per test on the test's event loop.
    """
    engine = create_async_engine(settings.test_database_url, poolclass=NullPool)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def db(test_engine):
    """
    Provides an isolated database transaction per test function.
    """
    connection = await test_engine.connect()
    transaction = await connection.begin()

    session = AsyncSession(
        bind=connection,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )

    yield session

    await session.close()
    if transaction.is_active:
        await transaction.rollback()
    await connection.close()


@pytest_asyncio.fixture
async def client(db: AsyncSession):
    """
    Async HTTP client overriding get_db dependency.
    """

    async def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()