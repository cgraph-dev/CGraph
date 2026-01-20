defmodule CGraph.Forums.PermissionTemplate do
  @moduledoc """
  PermissionTemplate schema for reusable permission presets.

  Templates can be:
  - System templates (global, can't be deleted)
  - Forum-specific templates (created by forum admins)

  ## Built-in Templates
  - Full Access: All permissions granted
  - Read Only: View only, no posting
  - No Access: Board/forum is hidden
  - Reply Only: Can view and reply but not create threads
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [:id, :name, :description, :is_system, :permissions]}

  schema "permission_templates" do
    field :name, :string
    field :description, :string
    field :is_system, :boolean, default: false
    field :permissions, :map, default: %{}

    belongs_to :forum, CGraph.Forums.Forum

    timestamps()
  end

  @doc """
  Create or update a permission template.
  """
  def changeset(template, attrs) do
    template
    |> cast(attrs, [:name, :description, :is_system, :permissions, :forum_id])
    |> validate_required([:name])
    |> validate_length(:name, min: 1, max: 100)
    |> validate_length(:description, max: 500)
    |> validate_permissions_map()
    |> unique_constraint([:forum_id, :name])
    |> foreign_key_constraint(:forum_id)
    |> protect_system_template()
  end

  defp validate_permissions_map(changeset) do
    case get_change(changeset, :permissions) do
      nil -> changeset
      permissions when is_map(permissions) ->
        valid_values = ["inherit", "allow", "deny"]
        invalid = Enum.reject(permissions, fn {_k, v} -> v in valid_values end)

        if Enum.empty?(invalid) do
          changeset
        else
          add_error(changeset, :permissions, "contains invalid values (must be inherit, allow, or deny)")
        end
      _ ->
        add_error(changeset, :permissions, "must be a map")
    end
  end

  defp protect_system_template(changeset) do
    case get_field(changeset, :is_system) do
      true ->
        case changeset.data.id do
          nil -> changeset  # New template, allow
          _id ->
            # Existing system template, prevent modification of is_system
            delete_change(changeset, :is_system)
        end
      _ ->
        changeset
    end
  end

  # =============================================================================
  # QUERIES
  # =============================================================================

  @doc """
  Query for all system (global) templates.
  """
  def system_templates_query do
    from t in __MODULE__,
      where: t.is_system == true,
      order_by: [asc: t.name]
  end

  @doc """
  Query for templates available to a forum.
  Includes system templates and forum-specific templates.
  """
  def available_for_forum_query(forum_id) do
    from t in __MODULE__,
      where: t.is_system == true or t.forum_id == ^forum_id,
      order_by: [desc: t.is_system, asc: t.name]
  end

  @doc """
  Query for templates created by a specific forum.
  """
  def for_forum_query(forum_id) do
    from t in __MODULE__,
      where: t.forum_id == ^forum_id,
      order_by: [asc: t.name]
  end

  # =============================================================================
  # BUILT-IN TEMPLATES
  # =============================================================================

  @doc """
  Get built-in template definitions.
  """
  def built_in_templates do
    [
      %{
        name: "Full Access",
        description: "All permissions granted",
        is_system: true,
        permissions: %{
          "can_view" => "allow",
          "can_view_threads" => "allow",
          "can_create_threads" => "allow",
          "can_reply" => "allow",
          "can_edit_own_posts" => "allow",
          "can_delete_own_posts" => "allow",
          "can_upload_attachments" => "allow",
          "can_create_polls" => "allow",
          "can_vote_polls" => "allow"
        }
      },
      %{
        name: "Read Only",
        description: "View only, no posting",
        is_system: true,
        permissions: %{
          "can_view" => "allow",
          "can_view_threads" => "allow",
          "can_create_threads" => "deny",
          "can_reply" => "deny",
          "can_edit_own_posts" => "deny",
          "can_delete_own_posts" => "deny",
          "can_upload_attachments" => "deny",
          "can_create_polls" => "deny",
          "can_vote_polls" => "allow"
        }
      },
      %{
        name: "No Access",
        description: "Board/forum is completely hidden",
        is_system: true,
        permissions: %{
          "can_view" => "deny",
          "can_view_threads" => "deny",
          "can_create_threads" => "deny",
          "can_reply" => "deny",
          "can_edit_own_posts" => "deny",
          "can_delete_own_posts" => "deny",
          "can_upload_attachments" => "deny",
          "can_create_polls" => "deny",
          "can_vote_polls" => "deny"
        }
      },
      %{
        name: "Reply Only",
        description: "Can view and reply but not create threads",
        is_system: true,
        permissions: %{
          "can_view" => "allow",
          "can_view_threads" => "allow",
          "can_create_threads" => "deny",
          "can_reply" => "allow",
          "can_edit_own_posts" => "allow",
          "can_delete_own_posts" => "deny",
          "can_upload_attachments" => "allow",
          "can_create_polls" => "deny",
          "can_vote_polls" => "allow"
        }
      },
      %{
        name: "Moderator",
        description: "Full moderation capabilities",
        is_system: true,
        permissions: %{
          "can_view" => "allow",
          "can_view_threads" => "allow",
          "can_create_threads" => "allow",
          "can_reply" => "allow",
          "can_edit_own_posts" => "allow",
          "can_delete_own_posts" => "allow",
          "can_upload_attachments" => "allow",
          "can_create_polls" => "allow",
          "can_vote_polls" => "allow",
          "can_moderate" => "allow",
          "can_edit_posts" => "allow",
          "can_delete_posts" => "allow",
          "can_move_threads" => "allow",
          "can_lock_threads" => "allow",
          "can_pin_threads" => "allow"
        }
      },
      %{
        name: "Guest",
        description: "Anonymous visitor permissions",
        is_system: true,
        permissions: %{
          "can_view" => "allow",
          "can_view_threads" => "allow",
          "can_create_threads" => "deny",
          "can_reply" => "deny",
          "can_edit_own_posts" => "deny",
          "can_delete_own_posts" => "deny",
          "can_upload_attachments" => "deny",
          "can_create_polls" => "deny",
          "can_vote_polls" => "deny"
        }
      }
    ]
  end

  @doc """
  Get a specific built-in template by name.
  """
  def get_built_in(name) do
    Enum.find(built_in_templates(), fn t -> t.name == name end)
  end
end
