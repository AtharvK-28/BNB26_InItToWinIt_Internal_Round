"""Project ownership and immutable original assets."""

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"


def upgrade():
    with op.batch_alter_table("projects") as batch:
        batch.add_column(
            sa.Column(
                "owner_id",
                sa.String(36),
                nullable=False,
                server_default="00000000-0000-0000-0000-000000000001",
            )
        )
        batch.create_index("ix_projects_owner_id", ["owner_id"])
    op.create_table(
        "assets",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "project_id",
            sa.String(36),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("owner_id", sa.String(36), nullable=False),
        sa.Column("filename", sa.String(240), nullable=False),
        sa.Column("content_type", sa.String(60), nullable=False),
        sa.Column("bytes", sa.Integer(), nullable=False),
        sa.Column("sha256", sa.String(64), nullable=False),
        sa.Column("duration", sa.Float(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("codec", sa.String(40), nullable=False),
        sa.Column("original_key", sa.String(300), nullable=False),
        sa.Column("thumbnail_key", sa.String(300), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("project_id", "sha256", name="uq_asset_project_hash"),
    )
    op.create_index("ix_assets_owner_id", "assets", ["owner_id"])
    op.create_index("ix_assets_project_id", "assets", ["project_id"])
    if op.get_bind().dialect.name == "postgresql":
        # Backend queries enforce ownership; no browser grants are added.
        op.execute("ALTER TABLE projects ENABLE ROW LEVEL SECURITY")
        op.execute("ALTER TABLE assets ENABLE ROW LEVEL SECURITY")


def downgrade():
    op.drop_table("assets")
    with op.batch_alter_table("projects") as batch:
        batch.drop_index("ix_projects_owner_id")
        batch.drop_column("owner_id")
