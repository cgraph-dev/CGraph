defmodule CGraph.Repo.Migrations.AddForumFulltextSearch do
  @moduledoc """
  Adds tsvector columns and GIN indexes for full-text search on forum tables.

  Creates:
  - search_vector tsvector columns on threads, thread_posts, posts, comments
  - GIN indexes for fast full-text search
  - Trigger functions to auto-update tsvector on INSERT/UPDATE
  - Backfills existing data
  """
  use Ecto.Migration

  def up do
    # ── 1. Add tsvector columns ──────────────────────────────────────────
    alter table(:threads) do
      add :search_vector, :tsvector
    end

    alter table(:thread_posts) do
      add :search_vector, :tsvector
    end

    alter table(:posts) do
      add :search_vector, :tsvector
    end

    alter table(:comments) do
      add :search_vector, :tsvector
    end

    # ── 2. Create GIN indexes ────────────────────────────────────────────
    create index(:threads, [:search_vector], using: :gin, name: :threads_search_vector_idx)
    create index(:thread_posts, [:search_vector], using: :gin, name: :thread_posts_search_vector_idx)
    create index(:posts, [:search_vector], using: :gin, name: :posts_search_vector_idx)
    create index(:comments, [:search_vector], using: :gin, name: :comments_search_vector_idx)

    # ── 3. Trigger functions ─────────────────────────────────────────────

    # threads: weight title A, content B
    execute """
    CREATE OR REPLACE FUNCTION threads_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """

    # thread_posts: content only
    execute """
    CREATE OR REPLACE FUNCTION thread_posts_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        to_tsvector('english', coalesce(NEW.content, ''));
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """

    # posts: weight title A, content B
    execute """
    CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """

    # comments: content only
    execute """
    CREATE OR REPLACE FUNCTION comments_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        to_tsvector('english', coalesce(NEW.content, ''));
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """

    # ── 4. Attach triggers ───────────────────────────────────────────────
    execute """
    CREATE TRIGGER threads_search_vector_trigger
      BEFORE INSERT OR UPDATE OF title, content ON threads
      FOR EACH ROW EXECUTE FUNCTION threads_search_vector_update();
    """

    execute """
    CREATE TRIGGER thread_posts_search_vector_trigger
      BEFORE INSERT OR UPDATE OF content ON thread_posts
      FOR EACH ROW EXECUTE FUNCTION thread_posts_search_vector_update();
    """

    execute """
    CREATE TRIGGER posts_search_vector_trigger
      BEFORE INSERT OR UPDATE OF title, content ON posts
      FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();
    """

    execute """
    CREATE TRIGGER comments_search_vector_trigger
      BEFORE INSERT OR UPDATE OF content ON comments
      FOR EACH ROW EXECUTE FUNCTION comments_search_vector_update();
    """

    # ── 5. Backfill existing data ────────────────────────────────────────
    execute """
    UPDATE threads SET search_vector =
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(content, '')), 'B');
    """

    execute """
    UPDATE thread_posts SET search_vector =
      to_tsvector('english', coalesce(content, ''));
    """

    execute """
    UPDATE posts SET search_vector =
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(content, '')), 'B');
    """

    execute """
    UPDATE comments SET search_vector =
      to_tsvector('english', coalesce(content, ''));
    """
  end

  def down do
    # Drop triggers
    execute "DROP TRIGGER IF EXISTS threads_search_vector_trigger ON threads;"
    execute "DROP TRIGGER IF EXISTS thread_posts_search_vector_trigger ON thread_posts;"
    execute "DROP TRIGGER IF EXISTS posts_search_vector_trigger ON posts;"
    execute "DROP TRIGGER IF EXISTS comments_search_vector_trigger ON comments;"

    # Drop trigger functions
    execute "DROP FUNCTION IF EXISTS threads_search_vector_update();"
    execute "DROP FUNCTION IF EXISTS thread_posts_search_vector_update();"
    execute "DROP FUNCTION IF EXISTS posts_search_vector_update();"
    execute "DROP FUNCTION IF EXISTS comments_search_vector_update();"

    # Drop indexes
    drop_if_exists index(:threads, [:search_vector], name: :threads_search_vector_idx)
    drop_if_exists index(:thread_posts, [:search_vector], name: :thread_posts_search_vector_idx)
    drop_if_exists index(:posts, [:search_vector], name: :posts_search_vector_idx)
    drop_if_exists index(:comments, [:search_vector], name: :comments_search_vector_idx)

    # Drop columns
    alter table(:threads) do
      remove :search_vector
    end

    alter table(:thread_posts) do
      remove :search_vector
    end

    alter table(:posts) do
      remove :search_vector
    end

    alter table(:comments) do
      remove :search_vector
    end
  end
end
