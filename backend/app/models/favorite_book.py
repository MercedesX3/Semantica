from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint
from app.core.database import Base


class FavoriteBook(Base):
    __tablename__ = "favorite_books"
    __table_args__ = (UniqueConstraint("open_library_key"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    open_library_key = Column(String(100), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    author = Column(String(300), nullable=False)
    cover_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
