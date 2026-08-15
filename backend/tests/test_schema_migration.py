"""Regression test for a real production incident: sync_schema() added
Group.is_public via a plain ALTER TABLE ADD COLUMN, which never touches
pre-existing rows. Every group created before that migration ended up with
is_public=NULL despite the model declaring nullable=False, default=False --
which crashed GET /api/groups (list_my_groups) for any user with an older
group, the moment Pydantic tried to validate None as a bool. Fixed by having
sync_schema() backfill existing NULLs to the column's scalar default."""
import os
import tempfile

from sqlalchemy import create_engine, text

from backend.db import sync_schema


def test_sync_schema_backfills_existing_rows_for_new_notnull_column():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    try:
        engine = create_engine(f"sqlite:///{path}")

        # Simulate the pre-migration schema: a "groups" table without the
        # is_public/category/rules columns the current model declares, with
        # one row already in it -- exactly the state production was in.
        with engine.begin() as conn:
            conn.execute(text(
                "CREATE TABLE groups ("
                "id INTEGER PRIMARY KEY, name VARCHAR NOT NULL, invite_code VARCHAR NOT NULL UNIQUE, "
                "leader_id INTEGER NOT NULL, parent_group_id INTEGER, created_at DATETIME"
                ")"
            ))
            conn.execute(text(
                "INSERT INTO groups (id, name, invite_code, leader_id) VALUES (1, 'Old Group', 'abc123', 1)"
            ))

        sync_schema(target_engine=engine)

        with engine.begin() as conn:
            row = conn.execute(text("SELECT is_public, category, rules FROM groups WHERE id = 1")).fetchone()
        is_public, category, rules = row
        assert is_public in (False, 0), f"expected backfilled False, got {is_public!r}"
        assert category is None
        assert rules is None
    finally:
        engine.dispose()
        os.remove(path)


def test_sync_schema_is_idempotent_on_a_fresh_database():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    try:
        engine = create_engine(f"sqlite:///{path}")
        sync_schema(target_engine=engine)
        sync_schema(target_engine=engine)  # must not error on a second run
    finally:
        engine.dispose()
        os.remove(path)
