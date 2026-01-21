defmodule CGraph.Repo.Migrations.AddForumHierarchy do
  @moduledoc """
  Migration to add infinite nesting/hierarchy support to forums.

  This enables:
  - Forums to have parent forums (sub-forums)
  - Breadcrumb navigation
  - Recursive forum trees
  - Depth-limited queries for performance
  - Materialized path for efficient tree traversal
  """
  use Ecto.Migration

  def change do
    # Add hierarchy fields to forums table
    alter table(:forums) do
      # Parent forum reference for hierarchy
      add_if_not_exists :parent_forum_id, references(:forums, type: :binary_id, on_delete: :nilify_all)

      # Display order within parent - SKIP: already added in 20260121000001
      # add :display_order, :integer, default: 0

      # Materialized path for efficient tree operations (e.g., "/root-id/parent-id/this-id")
      # Allows O(1) ancestor lookups and efficient subtree queries
      add_if_not_exists :path, :string, default: "/"

      # Depth level for easy depth-limiting (0 = root forum)
      add_if_not_exists :depth, :integer, default: 0

      # Whether this forum is visible in hierarchy navigation
      add_if_not_exists :show_in_navigation, :boolean, default: true

      # Collapsed by default in navigation (useful for large hierarchies)
      add_if_not_exists :collapsed_by_default, :boolean, default: false

      # Forum type: 'category' (no posts, just organizes sub-forums), 'forum' (normal), 'link' (redirect)
      add_if_not_exists :forum_type, :string, default: "forum"

      # Redirect URL for link-type forums
      add_if_not_exists :redirect_url, :string

      # Number of redirects for link-type forums
      add_if_not_exists :redirect_count, :integer, default: 0

      # Inherit permissions from parent
      add_if_not_exists :inherit_permissions, :boolean, default: true

      # Aggregate stats including sub-forums
      add_if_not_exists :total_thread_count, :integer, default: 0
      add_if_not_exists :total_post_count, :integer, default: 0
      add_if_not_exists :total_member_count, :integer, default: 0
    end

    # Index for parent lookups
    create index(:forums, [:parent_forum_id])

    # Index for ordered listing within parent
    create index(:forums, [:parent_forum_id, :display_order])

    # Index for materialized path queries (LIKE 'path%')
    create index(:forums, [:path])

    # Index for depth-limited queries
    create index(:forums, [:depth])

    # Index for navigation visibility
    create index(:forums, [:show_in_navigation])

    # Create a function to update the materialized path
    execute """
    CREATE OR REPLACE FUNCTION update_forum_path()
    RETURNS TRIGGER AS $$
    DECLARE
      parent_path TEXT;
      parent_depth INTEGER;
    BEGIN
      IF NEW.parent_forum_id IS NULL THEN
        NEW.path := '/' || NEW.id || '/';
        NEW.depth := 0;
      ELSE
        SELECT path, depth INTO parent_path, parent_depth
        FROM forums WHERE id = NEW.parent_forum_id;

        IF parent_path IS NOT NULL THEN
          NEW.path := parent_path || NEW.id || '/';
          NEW.depth := parent_depth + 1;
        ELSE
          NEW.path := '/' || NEW.id || '/';
          NEW.depth := 0;
        END IF;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """, """
    DROP FUNCTION IF EXISTS update_forum_path();
    """

    # Trigger to automatically update path on insert/update
    execute """
    CREATE TRIGGER forum_path_trigger
    BEFORE INSERT OR UPDATE OF parent_forum_id ON forums
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_path();
    """, """
    DROP TRIGGER IF EXISTS forum_path_trigger ON forums;
    """

    # Create a function to get all ancestors of a forum
    execute """
    CREATE OR REPLACE FUNCTION get_forum_ancestors(forum_uuid UUID)
    RETURNS TABLE(
      id UUID,
      name VARCHAR,
      slug VARCHAR,
      depth INTEGER
    ) AS $$
    BEGIN
      RETURN QUERY
      WITH RECURSIVE ancestors AS (
        SELECT f.id, f.name, f.slug, f.depth, f.parent_forum_id
        FROM forums f
        WHERE f.id = forum_uuid

        UNION ALL

        SELECT p.id, p.name, p.slug, p.depth, p.parent_forum_id
        FROM forums p
        INNER JOIN ancestors a ON p.id = a.parent_forum_id
      )
      SELECT ancestors.id, ancestors.name, ancestors.slug, ancestors.depth
      FROM ancestors
      WHERE ancestors.id != forum_uuid
      ORDER BY ancestors.depth ASC;
    END;
    $$ LANGUAGE plpgsql;
    """, """
    DROP FUNCTION IF EXISTS get_forum_ancestors(UUID);
    """

    # Create a function to get all descendants of a forum
    execute """
    CREATE OR REPLACE FUNCTION get_forum_descendants(forum_uuid UUID, max_depth INTEGER DEFAULT 10)
    RETURNS TABLE(
      id UUID,
      name VARCHAR,
      slug VARCHAR,
      parent_forum_id UUID,
      depth INTEGER
    ) AS $$
    BEGIN
      RETURN QUERY
      WITH RECURSIVE descendants AS (
        SELECT f.id, f.name, f.slug, f.parent_forum_id, f.depth
        FROM forums f
        WHERE f.parent_forum_id = forum_uuid

        UNION ALL

        SELECT c.id, c.name, c.slug, c.parent_forum_id, c.depth
        FROM forums c
        INNER JOIN descendants d ON c.parent_forum_id = d.id
        WHERE c.depth <= (SELECT depth FROM forums WHERE id = forum_uuid) + max_depth
      )
      SELECT * FROM descendants
      ORDER BY depth ASC;
    END;
    $$ LANGUAGE plpgsql;
    """, """
    DROP FUNCTION IF EXISTS get_forum_descendants(UUID, INTEGER);
    """

    # Create a function to update aggregate stats including sub-forums
    execute """
    CREATE OR REPLACE FUNCTION update_forum_aggregate_stats()
    RETURNS TRIGGER AS $$
    DECLARE
      parent_id UUID;
      current_id UUID;
    BEGIN
      -- Start with the forum that was updated
      current_id := COALESCE(NEW.id, OLD.id);

      -- Walk up the tree updating aggregate stats
      WHILE current_id IS NOT NULL LOOP
        UPDATE forums
        SET
          total_thread_count = COALESCE((
            SELECT SUM(thread_count) FROM forums
            WHERE path LIKE (SELECT path FROM forums WHERE id = current_id) || '%'
          ), 0),
          total_post_count = COALESCE((
            SELECT SUM(post_count) FROM forums
            WHERE path LIKE (SELECT path FROM forums WHERE id = current_id) || '%'
          ), 0),
          total_member_count = COALESCE((
            SELECT SUM(member_count) FROM forums
            WHERE path LIKE (SELECT path FROM forums WHERE id = current_id) || '%'
          ), 0)
        WHERE id = current_id;

        SELECT parent_forum_id INTO parent_id FROM forums WHERE id = current_id;
        current_id := parent_id;
      END LOOP;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """, """
    DROP FUNCTION IF EXISTS update_forum_aggregate_stats();
    """

    # Initialize path and depth for existing forums
    execute """
    UPDATE forums
    SET path = '/' || id || '/', depth = 0
    WHERE parent_forum_id IS NULL AND path IS NULL;
    """, ""
  end
end
