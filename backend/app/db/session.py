from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import BACKEND_DIR, DATABASE_URL


class Base(DeclarativeBase):
    pass


url = make_url(DATABASE_URL)
if url.drivername.startswith("sqlite") and url.database and url.database != ":memory:":
    path = Path(url.database)
    if not path.is_absolute():
        path = BACKEND_DIR / path
    path.parent.mkdir(parents=True, exist_ok=True)
    url = url.set(database=str(path.resolve()))
engine = create_engine(
    url,
    connect_args={"check_same_thread": False} if url.drivername.startswith("sqlite") else {},
)
if url.drivername.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def sqlite_pragmas(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA busy_timeout=5000")


SessionLocal = sessionmaker(engine, expire_on_commit=False)


def get_db():
    with SessionLocal() as session:
        yield session
