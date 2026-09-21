import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.db.initialize import initialize
from app.db.session import SessionLocal, engine
from app.importers.excel import import_excel


def main():
    parser = argparse.ArgumentParser(description="Khởi tạo SQLite, seed tri thức và nhập Excel.")
    parser.add_argument("--excel")
    parser.add_argument("--skip-existing", action="store_true")
    args = parser.parse_args()
    print(json.dumps({"database": str(engine.url), **initialize()}, ensure_ascii=False))
    if args.excel:
        with SessionLocal() as db:
            print(
                json.dumps(
                    import_excel(db, args.excel, not args.skip_existing),
                    ensure_ascii=False,
                    indent=2,
                )
            )


if __name__ == "__main__":
    main()
