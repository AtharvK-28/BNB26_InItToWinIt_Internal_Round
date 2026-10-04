from alembic import context
from sqlalchemy import create_engine, pool, text

from creatorai.config import Settings
from creatorai.database import Base


def run_migrations():
    supplied = context.config.attributes.get("connection")
    if supplied is not None:
        migrate(supplied)
        return
    settings = Settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    engine = create_engine(settings.sql_url, poolclass=pool.NullPool)
    with engine.connect() as connection:
        migrate(connection)


def migrate(connection):
    if connection.dialect.name == "postgresql":
        connection.execute(text("CREATE SCHEMA IF NOT EXISTS creatorai"))
        connection.execute(text("REVOKE ALL ON SCHEMA creatorai FROM PUBLIC"))
        for role in ("anon", "authenticated"):
            exists = connection.scalar(
                text("SELECT 1 FROM pg_roles WHERE rolname = :role"), {"role": role}
            )
            if exists:
                connection.execute(text(f"REVOKE ALL ON SCHEMA creatorai FROM {role}"))
        connection.execute(text("SET search_path TO creatorai"))
        connection.commit()
    context.configure(connection=connection, target_metadata=Base.metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


run_migrations()
