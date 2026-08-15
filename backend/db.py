import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./local.db")
# Some Postgres providers hand out "postgres://" URLs, but SQLAlchemy's
# psycopg2 dialect requires the "postgresql://" scheme.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
# pool_pre_ping: serverless Postgres providers (e.g. Neon) close idle
# connections server-side; without this, a pooled connection that went
# stale raises "SSL connection has been closed unexpectedly" instead of
# transparently reconnecting.
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True, pool_recycle=300)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def sync_schema(target_engine=None):
    """Create any new tables, then add any new columns to tables that
    already existed. Base.metadata.create_all() only does the former — it
    silently no-ops on existing tables, so a column added to a model never
    reaches a live database without this. Only handles additive columns
    (our actual usage); renames/drops/type changes still need a real
    migration tool if this app ever needs them.

    Accepts an optional engine so tests can point this at an isolated
    throwaway database instead of the process-wide one."""
    target_engine = target_engine or engine
    Base.metadata.create_all(bind=target_engine)
    inspector = inspect(target_engine)
    with target_engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue
            existing_cols = {c["name"] for c in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing_cols:
                    continue
                col_type = column.type.compile(dialect=target_engine.dialect)
                conn.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" {col_type}'))

                # ADD COLUMN never touches pre-existing rows, so a plain
                # scalar default (e.g. default=False) only ever applies to
                # new inserts made through the ORM -- every row that existed
                # before this migration ran is left with NULL regardless of
                # what the model declares. For a nullable=False column that
                # silently breaks the first read of any old row (this took
                # production down once: Group.is_public). Backfill explicitly
                # instead of trusting the model default to have applied.
                default = column.default
                if default is not None and getattr(default, "is_scalar", False):
                    conn.execute(
                        text(f'UPDATE "{table.name}" SET "{column.name}" = :val WHERE "{column.name}" IS NULL'),
                        {"val": default.arg},
                    )
                if not column.nullable and target_engine.dialect.name == "postgresql":
                    conn.execute(text(f'ALTER TABLE "{table.name}" ALTER COLUMN "{column.name}" SET NOT NULL'))
