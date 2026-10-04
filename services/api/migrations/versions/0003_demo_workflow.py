"""Persist demo jobs, media understanding, editable cuts and exports."""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "runs",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False, unique=False),
        sa.Column(
            "project_id",
            sa.String(length=36),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
        sa.Column(
            "owner_id", sa.String(length=36), primary_key=False, nullable=False, unique=False
        ),
        sa.Column("kind", sa.String(length=20), primary_key=False, nullable=False, unique=False),
        sa.Column("status", sa.String(length=20), primary_key=False, nullable=False, unique=False),
        sa.Column("stage", sa.String(length=100), primary_key=False, nullable=False, unique=False),
        sa.Column("input", sa.JSON(), primary_key=False, nullable=False, unique=False),
        sa.Column("output", sa.JSON(), primary_key=False, nullable=False, unique=False),
        sa.Column("events", sa.JSON(), primary_key=False, nullable=False, unique=False),
        sa.Column("error", sa.Text(), primary_key=False, nullable=False, unique=False),
        sa.Column(
            "lease_owner", sa.String(length=36), primary_key=False, nullable=True, unique=False
        ),
        sa.Column(
            "lease_until",
            sa.DateTime(timezone=True),
            primary_key=False,
            nullable=True,
            unique=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
    )
    op.create_index("ix_runs_owner_id", "runs", ["owner_id"])
    op.create_index("ix_runs_project_id", "runs", ["project_id"])
    op.create_index("ix_runs_status", "runs", ["status"])
    op.create_table(
        "analyses",
        sa.Column(
            "asset_id",
            sa.String(length=36),
            sa.ForeignKey("assets.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
            unique=False,
        ),
        sa.Column(
            "project_id",
            sa.String(length=36),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
        sa.Column(
            "owner_id", sa.String(length=36), primary_key=False, nullable=False, unique=False
        ),
        sa.Column(
            "pipeline", sa.String(length=100), primary_key=False, nullable=False, unique=False
        ),
        sa.Column("data", sa.JSON(), primary_key=False, nullable=False, unique=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
    )
    op.create_index("ix_analyses_owner_id", "analyses", ["owner_id"])
    op.create_index("ix_analyses_project_id", "analyses", ["project_id"])
    op.create_table(
        "clips",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False, unique=False),
        sa.Column(
            "project_id",
            sa.String(length=36),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
        sa.Column(
            "owner_id", sa.String(length=36), primary_key=False, nullable=False, unique=False
        ),
        sa.Column(
            "asset_id",
            sa.String(length=36),
            sa.ForeignKey("assets.id", ondelete="CASCADE"),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
        sa.Column(
            "run_id",
            sa.String(length=36),
            sa.ForeignKey("runs.id", ondelete="CASCADE"),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
        sa.Column("revision", sa.Integer(), primary_key=False, nullable=False, unique=False),
        sa.Column("script_revision", sa.Integer(), primary_key=False, nullable=False, unique=False),
        sa.Column("document", sa.JSON(), primary_key=False, nullable=False, unique=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
    )
    op.create_index("ix_clips_owner_id", "clips", ["owner_id"])
    op.create_index("ix_clips_project_id", "clips", ["project_id"])
    op.create_table(
        "exports",
        sa.Column("id", sa.String(length=36), primary_key=True, nullable=False, unique=False),
        sa.Column(
            "project_id",
            sa.String(length=36),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
        sa.Column(
            "owner_id", sa.String(length=36), primary_key=False, nullable=False, unique=False
        ),
        sa.Column(
            "clip_id",
            sa.String(length=36),
            sa.ForeignKey("clips.id", ondelete="CASCADE"),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
        sa.Column("clip_revision", sa.Integer(), primary_key=False, nullable=False, unique=False),
        sa.Column("preset", sa.String(length=20), primary_key=False, nullable=False, unique=False),
        sa.Column(
            "run_id",
            sa.String(length=36),
            sa.ForeignKey("runs.id", ondelete="CASCADE"),
            primary_key=False,
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "video_key", sa.String(length=300), primary_key=False, nullable=False, unique=False
        ),
        sa.Column(
            "package_key", sa.String(length=300), primary_key=False, nullable=False, unique=False
        ),
        sa.Column("bytes", sa.Integer(), primary_key=False, nullable=False, unique=False),
        sa.Column("duration", sa.Float(), primary_key=False, nullable=False, unique=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            primary_key=False,
            nullable=False,
            unique=False,
        ),
    )
    op.create_index("ix_exports_owner_id", "exports", ["owner_id"])
    op.create_index("ix_exports_project_id", "exports", ["project_id"])
    if op.get_bind().dialect.name == "postgresql":
        for name in ("runs", "analyses", "clips", "exports"):
            op.execute(f"ALTER TABLE {name} ENABLE ROW LEVEL SECURITY")


def downgrade():
    for name in ("exports", "clips", "analyses", "runs"):
        op.drop_table(name)
