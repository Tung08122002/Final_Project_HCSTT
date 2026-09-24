"""Small, idempotent upgrade for existing local databases."""

import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import inspect, text

from app.models.entities import ConsultationSession


def migrate_history_ownership(engine):
    inspector = inspect(engine)
    if "consultation_sessions" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("consultation_sessions")}
    if "owner_id" not in columns:
        # Old sessions have no recoverable owner. Preserve them in the admin history.
        # SQLite's backup API produces a consistent copy even if the app is running.
        database = engine.url.database
        if engine.dialect.name == "sqlite" and database and database != ":memory:":
            path = Path(database)
            stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S-%f")
            backup = path.with_name(f"{path.stem}.before-history-ownership-{stamp}{path.suffix}")
            with (
                closing(sqlite3.connect(path)) as source,
                closing(sqlite3.connect(backup)) as target,
            ):
                source.backup(target)
        with engine.begin() as connection:
            connection.execute(
                text(
                    "ALTER TABLE consultation_sessions ADD COLUMN owner_id "
                    "VARCHAR(80) NOT NULL DEFAULT 'demo-admin'"
                )
            )
    # Also repair a missing index after an interrupted upgrade.
    for index in ConsultationSession.__table__.indexes:
        index.create(engine, checkfirst=True)
