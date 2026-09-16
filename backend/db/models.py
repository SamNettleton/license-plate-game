from database import Base
from sqlalchemy import Column, ForeignKey, Index, String, Integer, DateTime, Date, PrimaryKeyConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

class DailyPlate(Base):
    __tablename__ = "daily_plates"

    date = Column(Date, primary_key=True, index=True)
    sequence = Column(String(3), nullable=False)
    total_count = Column(Integer, nullable=False)
    goal_points = Column(Integer, nullable=False)

class Dictionary(Base):
    __tablename__ = "dictionary"

    word = Column(String, primary_key=True)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    display_name = Column(String(32), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

# DEPRECATED: PointTransaction is no longer written to or read from.
# All daily stats and leaderboard queries now rely on DailyUserSummary.
# Pending full schema drop migration.
class PointTransaction(Base):
    __tablename__ = "point_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    points = Column(Integer, nullable=False)
    word = Column(String(100), nullable=True)
    puzzle_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_point_transactions_puzzle_date_user", "puzzle_date", "user_id"),
    )

class DailyUserSummary(Base):
    __tablename__ = "daily_user_summaries"

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    
    # Live play metrics (used for daily leaderboards)
    points_earned = Column(Integer, nullable=False, default=0)
    words_found = Column(ARRAY(String), nullable=False, default=list)
    elapsed_seconds = Column(Integer, nullable=False, default=0)
    tier_times = Column(JSONB, nullable=False, default=dict)

    # Archive / Late play tracking
    archive_words_found = Column(ARRAY(String), nullable=False, default=list)
    archive_points_earned = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        PrimaryKeyConstraint("user_id", "date"),
        Index("ix_daily_summaries_date_points", "date", points_earned.desc()),
    )