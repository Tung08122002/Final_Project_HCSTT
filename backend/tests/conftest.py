from contextlib import asynccontextmanager

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app.knowledge_base.seed import seed_database
from app.main import app


@pytest.fixture
def client(monkeypatch):
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    from sqlalchemy import event

    @event.listens_for(engine, "connect")
    def fk(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory() as db:
        seed_database(db)

    def override():
        with factory() as db:
            yield db

    app.dependency_overrides[get_db] = override

    # Never initialize or mutate the real development database from tests.
    @asynccontextmanager
    async def isolated_lifespan(_):
        yield

    monkeypatch.setattr(app.router, "lifespan_context", isolated_lifespan)
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()
    engine.dispose()
