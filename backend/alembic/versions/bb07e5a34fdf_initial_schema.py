from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'bb07e5a34fdf'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('tags',
    sa.Column('slug', sa.String(length=50), nullable=False),
    sa.Column('label', sa.String(length=100), nullable=False),
    sa.Column('category', sa.Enum('style', 'content', 'commission_type', name='tag_category', native_enum=False, length=32), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('is_restricted', sa.Boolean(), nullable=False),
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('category', 'slug', name='uq_tag_category_slug')
    )
    with op.batch_alter_table('tags', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_tags_category'), ['category'], unique=False)
        batch_op.create_index(batch_op.f('ix_tags_is_restricted'), ['is_restricted'], unique=False)
        batch_op.create_index(batch_op.f('ix_tags_slug'), ['slug'], unique=False)

    op.create_table('users',
    sa.Column('email', sa.String(length=320), nullable=False),
    sa.Column('username', sa.String(length=50), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('display_name', sa.String(length=100), nullable=False),
    sa.Column('avatar_url', sa.String(length=500), nullable=True),
    sa.Column('bio', sa.Text(), nullable=True),
    sa.Column('is_artist', sa.Boolean(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('is_admin', sa.Boolean(), nullable=False),
    sa.Column('age_verified', sa.Boolean(), nullable=False),
    sa.Column('last_active_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)
        batch_op.create_index(batch_op.f('ix_users_username'), ['username'], unique=True)

    op.create_table('artist_profiles',
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('handle', sa.String(length=50), nullable=False),
    sa.Column('tagline', sa.String(length=200), nullable=True),
    sa.Column('banner_url', sa.String(length=500), nullable=True),
    sa.Column('location', sa.String(length=120), nullable=True),
    sa.Column('languages', sa.JSON(), nullable=False),
    sa.Column('terms_of_service', sa.Text(), nullable=True),
    sa.Column('is_open', sa.Boolean(), nullable=False),
    sa.Column('slots_open', sa.Integer(), nullable=False),
    sa.Column('slots_total', sa.Integer(), nullable=False),
    sa.Column('turnaround_days', sa.Integer(), nullable=False),
    sa.Column('price_min', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('price_max', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('currency', sa.String(length=3), nullable=False),
    sa.Column('completed_commissions', sa.Integer(), nullable=False),
    sa.Column('rating_avg', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('review_count', sa.Integer(), nullable=False),
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('artist_profiles', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_artist_profiles_handle'), ['handle'], unique=True)
        batch_op.create_index(batch_op.f('ix_artist_profiles_is_open'), ['is_open'], unique=False)
        batch_op.create_index(batch_op.f('ix_artist_profiles_price_min'), ['price_min'], unique=False)
        batch_op.create_index(batch_op.f('ix_artist_profiles_rating_avg'), ['rating_avg'], unique=False)
        batch_op.create_index(batch_op.f('ix_artist_profiles_user_id'), ['user_id'], unique=True)

    op.create_table('user_preferences',
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('preferred_style_tags', sa.JSON(), nullable=False),
    sa.Column('preferred_content_tags', sa.JSON(), nullable=False),
    sa.Column('excluded_content_tags', sa.JSON(), nullable=False),
    sa.Column('preferred_commission_types', sa.JSON(), nullable=False),
    sa.Column('budget_min', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('budget_max', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('show_restricted', sa.Boolean(), nullable=False),
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('user_preferences', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_user_preferences_user_id'), ['user_id'], unique=True)

    op.create_table('artist_tags',
    sa.Column('artist_id', sa.String(length=36), nullable=False),
    sa.Column('tag_id', sa.String(length=36), nullable=False),
    sa.ForeignKeyConstraint(['artist_id'], ['artist_profiles.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('artist_id', 'tag_id')
    )
    with op.batch_alter_table('artist_tags', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_artist_tags_artist_id'), ['artist_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_artist_tags_tag_id'), ['tag_id'], unique=False)

    op.create_table('commission_offerings',
    sa.Column('artist_id', sa.String(length=36), nullable=False),
    sa.Column('commission_type', sa.Enum('bust', 'half_body', 'full_body', 'ref_sheet', 'illustration', 'emote_set', 'icon', 'animation', 'character_design', name='commission_type', native_enum=False, length=32), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('delivery_days', sa.Integer(), nullable=False),
    sa.Column('example_image_url', sa.String(length=500), nullable=True),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['artist_id'], ['artist_profiles.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('commission_offerings', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_commission_offerings_artist_id'), ['artist_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_commission_offerings_commission_type'), ['commission_type'], unique=False)

    op.create_table('portfolio_images',
    sa.Column('artist_id', sa.String(length=36), nullable=False),
    sa.Column('url', sa.String(length=500), nullable=False),
    sa.Column('caption', sa.String(length=300), nullable=True),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('is_restricted', sa.Boolean(), nullable=False),
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['artist_id'], ['artist_profiles.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('portfolio_images', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_portfolio_images_artist_id'), ['artist_id'], unique=False)

    op.create_table('saved_artists',
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('artist_id', sa.String(length=36), nullable=False),
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['artist_id'], ['artist_profiles.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'artist_id', name='uq_saved_artist_user_artist')
    )
    with op.batch_alter_table('saved_artists', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_saved_artists_artist_id'), ['artist_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_saved_artists_user_id'), ['user_id'], unique=False)

    op.create_table('sheet_images',
    sa.Column('artist_id', sa.String(length=36), nullable=False),
    sa.Column('url', sa.String(length=500), nullable=False),
    sa.Column('caption', sa.String(length=300), nullable=True),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('is_restricted', sa.Boolean(), nullable=False),
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['artist_id'], ['artist_profiles.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('sheet_images', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_sheet_images_artist_id'), ['artist_id'], unique=False)

    op.create_table('commissions',
    sa.Column('artist_id', sa.String(length=36), nullable=False),
    sa.Column('client_id', sa.String(length=36), nullable=False),
    sa.Column('offering_id', sa.String(length=36), nullable=True),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('brief', sa.Text(), nullable=True),
    sa.Column('status', sa.Enum('requested', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled', name='commission_status', native_enum=False, length=32), nullable=False),
    sa.Column('agreed_price', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('requested_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['artist_id'], ['artist_profiles.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['client_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['offering_id'], ['commission_offerings.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('commissions', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_commissions_artist_id'), ['artist_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_commissions_client_id'), ['client_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_commissions_offering_id'), ['offering_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_commissions_status'), ['status'], unique=False)

    op.create_table('reviews',
    sa.Column('author_id', sa.String(length=36), nullable=False),
    sa.Column('subject_user_id', sa.String(length=36), nullable=False),
    sa.Column('subject_type', sa.Enum('artist', 'client', name='review_subject_type', native_enum=False, length=32), nullable=False),
    sa.Column('commission_id', sa.String(length=36), nullable=True),
    sa.Column('rating', sa.Integer(), nullable=False),
    sa.Column('body', sa.Text(), nullable=True),
    sa.Column('sub_ratings', sa.JSON(), nullable=False),
    sa.Column('would_work_again', sa.Boolean(), nullable=True),
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint('author_id != subject_user_id', name='ck_review_no_self_review'),
    sa.CheckConstraint('rating >= 1 AND rating <= 5', name='ck_review_rating_range'),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['commission_id'], ['commissions.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['subject_user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('author_id', 'subject_user_id', 'commission_id', name='uq_review_author_subject_commission')
    )
    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_reviews_author_id'), ['author_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_reviews_commission_id'), ['commission_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_reviews_subject_type'), ['subject_type'], unique=False)
        batch_op.create_index(batch_op.f('ix_reviews_subject_user_id'), ['subject_user_id'], unique=False)
        batch_op.create_index('ix_reviews_subject_user_type', ['subject_user_id', 'subject_type'], unique=False)

def downgrade() -> None:
    with op.batch_alter_table('reviews', schema=None) as batch_op:
        batch_op.drop_index('ix_reviews_subject_user_type')
        batch_op.drop_index(batch_op.f('ix_reviews_subject_user_id'))
        batch_op.drop_index(batch_op.f('ix_reviews_subject_type'))
        batch_op.drop_index(batch_op.f('ix_reviews_commission_id'))
        batch_op.drop_index(batch_op.f('ix_reviews_author_id'))

    op.drop_table('reviews')
    with op.batch_alter_table('commissions', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_commissions_status'))
        batch_op.drop_index(batch_op.f('ix_commissions_offering_id'))
        batch_op.drop_index(batch_op.f('ix_commissions_client_id'))
        batch_op.drop_index(batch_op.f('ix_commissions_artist_id'))

    op.drop_table('commissions')
    with op.batch_alter_table('sheet_images', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_sheet_images_artist_id'))

    op.drop_table('sheet_images')
    with op.batch_alter_table('saved_artists', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_saved_artists_user_id'))
        batch_op.drop_index(batch_op.f('ix_saved_artists_artist_id'))

    op.drop_table('saved_artists')
    with op.batch_alter_table('portfolio_images', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_portfolio_images_artist_id'))

    op.drop_table('portfolio_images')
    with op.batch_alter_table('commission_offerings', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_commission_offerings_commission_type'))
        batch_op.drop_index(batch_op.f('ix_commission_offerings_artist_id'))

    op.drop_table('commission_offerings')
    with op.batch_alter_table('artist_tags', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_artist_tags_tag_id'))
        batch_op.drop_index(batch_op.f('ix_artist_tags_artist_id'))

    op.drop_table('artist_tags')
    with op.batch_alter_table('user_preferences', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_user_preferences_user_id'))

    op.drop_table('user_preferences')
    with op.batch_alter_table('artist_profiles', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_artist_profiles_user_id'))
        batch_op.drop_index(batch_op.f('ix_artist_profiles_rating_avg'))
        batch_op.drop_index(batch_op.f('ix_artist_profiles_price_min'))
        batch_op.drop_index(batch_op.f('ix_artist_profiles_is_open'))
        batch_op.drop_index(batch_op.f('ix_artist_profiles_handle'))

    op.drop_table('artist_profiles')
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_username'))
        batch_op.drop_index(batch_op.f('ix_users_email'))

    op.drop_table('users')
    with op.batch_alter_table('tags', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_tags_slug'))
        batch_op.drop_index(batch_op.f('ix_tags_is_restricted'))
        batch_op.drop_index(batch_op.f('ix_tags_category'))

    op.drop_table('tags')
