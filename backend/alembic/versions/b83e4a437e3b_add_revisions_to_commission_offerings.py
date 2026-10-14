from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b83e4a437e3b'
down_revision: Union[str, Sequence[str], None] = 'bb07e5a34fdf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    with op.batch_alter_table('commission_offerings', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('revisions', sa.Integer(), nullable=False, server_default='1')
        )

def downgrade() -> None:
    with op.batch_alter_table('commission_offerings', schema=None) as batch_op:
        batch_op.drop_column('revisions')
