"""Add Clerk integration fields to User model

Revision ID: clerk_fields_001
Revises: 77dd2d147d7e
Create Date: 2025-12-07
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'clerk_fields_001'
down_revision = '77dd2d147d7e'
branch_labels = None
depends_on = None


def upgrade():
    # Add Clerk integration fields to User table
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('clerk_id', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('approval_status', sa.String(length=20), nullable=True, server_default='none'))
        batch_op.add_column(sa.Column('is_verified_buyer', sa.Boolean(), nullable=True, server_default='0'))
        batch_op.create_unique_constraint('uq_user_clerk_id', ['clerk_id'])
    
    # Update existing users to have default values
    op.execute("UPDATE user SET approval_status = 'none' WHERE approval_status IS NULL")
    op.execute("UPDATE user SET is_verified_buyer = 0 WHERE is_verified_buyer IS NULL")


def downgrade():
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_constraint('uq_user_clerk_id', type_='unique')
        batch_op.drop_column('is_verified_buyer')
        batch_op.drop_column('approval_status')
        batch_op.drop_column('clerk_id')

