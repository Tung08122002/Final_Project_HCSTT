from app.db.session import Base, SessionLocal, engine
from app.knowledge_base.seed import seed_database
from app.models import entities  # noqa: F401


def initialize():
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        return seed_database(db)
