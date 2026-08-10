from sqlalchemy import Column, Index, String, Integer, DateTime, Date, PrimaryKeyConstraint, func
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

class Dictionary(Base):
    __tablename__ = "dictionary"

    word = Column(String, primary_key=True)

class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    points = Column(Integer, nullable=False)
    word = Column(String(100), nullable=True)
    puzzle_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_point_transactions_puzzle_date_user", "puzzle_date", "user_id"),
    )

class DailyUserSummary(Base):
    __tablename__ = "daily_user_summaries"

    user_id = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    points_earned = Column(Integer, nullable=False, default=0)
    rank = Column(Integer, nullable=True)

    __table_args__ = (
        PrimaryKeyConstraint("user_id", "date"),
    )