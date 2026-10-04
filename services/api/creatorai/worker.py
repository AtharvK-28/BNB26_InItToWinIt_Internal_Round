"""Optional standalone worker: python -m creatorai.worker."""

from creatorai.config import Settings
from creatorai.database import make_database
from creatorai.jobs import JobEngine
from creatorai.migrate import upgrade_database
from creatorai.storage import make_storage


def main():
    settings = Settings()
    upgrade_database(settings.sql_url, settings.data_dir)
    engine, sessions = make_database(settings.sql_url)
    worker = JobEngine(settings, sessions, make_storage(settings))
    try:
        worker.loop()
    except KeyboardInterrupt:
        worker.stop()
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
