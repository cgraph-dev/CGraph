defmodule CGraph.Accounts.UserManagement do
  @moduledoc """
  User CRUD, profile management, and admin operations.

  Extracted from `CGraph.Accounts` to keep the facade under 500 lines.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.{User, UserSettings}
  alias CGraph.Repo

  @doc "Get a user by ID."
  @spec get_user(String.t()) :: {:ok, User.t()} | {:error, :not_found}
  def get_user(id) do
    case Repo.get(User, id) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc "Get a user by ID (raises on not found)."
  @spec get_user!(String.t()) :: User.t()
  def get_user!(id) do
    Repo.get!(User, id)
    |> Repo.preload(:customization)
  end

  @doc "Deactivate a user account."
  @spec deactivate_user(User.t()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def deactivate_user(user) do
    now = DateTime.truncate(DateTime.utc_now(), :second)
    user
    |> Ecto.Changeset.change(%{deactivated_at: now, deleted_at: now, is_active: false})
    |> Repo.update()
  end

  @doc "Get a user by username (case-insensitive)."
  @spec get_user_by_username(String.t()) :: {:ok, User.t()} | {:error, :not_found}
  def get_user_by_username(username) do
    query = from u in User,
      where: fragment("lower(?)", u.username) == ^String.downcase(username),
      preload: [:customization]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc "Get a user profile by ID with customization."
  @spec get_user_profile(String.t()) :: {:ok, User.t()} | {:error, :not_found}
  def get_user_profile(user_id) do
    query = from u in User,
      where: u.id == ^user_id,
      preload: [:customization]

    case Repo.one(query) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end

  @doc "List users with cursor pagination and optional filters."
  @spec list_users(keyword()) :: {[User.t()], map()}
  def list_users(opts \\ []) do
    query = from u in User,
      where: is_nil(u.deleted_at),
      preload: [:customization]

    query = case Keyword.get(opts, :search) do
      nil -> query
      search ->
        term = "%#{search}%"
        from u in query,
          where: ilike(u.username, ^term) or ilike(u.email, ^term)
    end

    CGraph.Pagination.paginate(query, CGraph.Pagination.parse_params(Enum.into(opts, %{})))
  end

  @doc "List admin users."
  @spec list_admin_users() :: [User.t()]
  def list_admin_users do
    from(u in User,
      where: u.role in ["admin", "superadmin"],
      where: is_nil(u.deleted_at),
      order_by: [asc: u.username],
      preload: [:customization]
    )
    |> Repo.all()
  end

  @doc "List top users by karma."
  @spec list_top_users_by_karma(keyword()) :: [User.t()]
  def list_top_users_by_karma(opts \\ []) do
    per_page = Keyword.get(opts, :per_page, Keyword.get(opts, :limit, 10))
    page = Keyword.get(opts, :page, 1)

    query = from(u in User,
      where: is_nil(u.deleted_at),
      order_by: [desc: u.karma],
      preload: [:customization]
    )

    pagination_opts = CGraph.Pagination.parse_params(
      %{"per_page" => per_page, "page" => page},
      sort_field: :karma,
      sort_direction: :desc,
      default_limit: per_page
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc "Update user attributes."
  @spec update_user(User.t(), map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def update_user(user, attrs) do
    user
    |> User.update_changeset(attrs)
    |> Repo.update()
  end

  @doc "Flag a user's profile for review."
  @spec flag_profile_for_review(String.t()) :: {:ok, User.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def flag_profile_for_review(user_id) do
    case get_user(user_id) do
      {:ok, user} ->
        user
        |> Ecto.Changeset.change(%{
          profile_flagged: true,
          profile_flagged_at: DateTime.truncate(DateTime.utc_now(), :second)
        })
        |> Repo.update()
      error -> error
    end
  end

  @doc "Remove specific profile content."
  @spec remove_profile_content(String.t(), atom(), keyword()) :: {:ok, User.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def remove_profile_content(user_id, content_type, opts \\ []) do
    reason = Keyword.get(opts, :reason, :moderation)

    case get_user(user_id) do
      {:ok, user} ->
        changes = case content_type do
          :avatar -> %{avatar_url: nil, avatar_removed_reason: reason}
          :bio -> %{bio: nil, bio_removed_reason: reason}
          :display_name -> %{display_name: user.username, display_name_removed_reason: reason}
          :signature -> %{signature: nil, signature_removed_reason: reason}
          _ -> %{}
        end

        user
        |> Ecto.Changeset.change(changes)
        |> Repo.update()
      error -> error
    end
  end

  @doc "Change a user's username (rate-limited: once per 30 days)."
  @spec change_username(User.t(), String.t()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def change_username(user, new_username) do
    user
    |> User.username_changeset(%{username: new_username})
    |> Ecto.Changeset.put_change(:username_changed_at, DateTime.truncate(DateTime.utc_now(), :second))
    |> Repo.update()
  end

  @doc "Check if a user can change their username."
  @spec can_change_username?(User.t()) :: boolean()
  def can_change_username?(user) do
    case user.username_changed_at do
      nil -> true
      last_change -> DateTime.diff(DateTime.utc_now(), last_change, :day) >= 30
    end
  end

  @doc "Get next allowed username change date."
  @spec next_username_change_date(User.t()) :: DateTime.t()
  def next_username_change_date(user) do
    case user.username_changed_at do
      nil -> DateTime.utc_now()
      last_change -> DateTime.add(last_change, 30 * 24 * 60 * 60, :second)
    end
  end

  @doc "Soft-delete a user."
  @spec delete_user(User.t()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def delete_user(user) do
    now = DateTime.truncate(DateTime.utc_now(), :second)
    user |> Ecto.Changeset.change(deleted_at: now) |> Repo.update()
  end

  @doc "Update a user's avatar URL."
  @spec update_avatar(User.t(), String.t()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def update_avatar(user, avatar_url) do
    user
    |> Ecto.Changeset.change(avatar_url: avatar_url)
    |> Repo.update()
  end

  @doc "Schedule user deletion after 30-day grace period."
  @spec schedule_user_deletion(User.t()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def schedule_user_deletion(user) do
    deletion_time =
      DateTime.truncate(DateTime.utc_now(), :second)
      |> DateTime.add(30 * 24 * 60 * 60, :second)
      |> DateTime.truncate(:second)

    user
    |> Ecto.Changeset.change(deleted_at: deletion_time)
    |> Repo.update()
  end

  @doc "Upload a user's avatar."
  @spec upload_avatar(User.t(), %{filename: String.t()}) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def upload_avatar(user, upload) do
    avatar_url = "/uploads/avatars/#{user.id}/#{upload.filename}"
    update_avatar(user, avatar_url)
  end

  @doc "Update user preferences."
  @spec update_user_preferences(User.t(), map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def update_user_preferences(user, preferences) do
    user
    |> Ecto.Changeset.change(preferences: Map.merge(user.preferences || %{}, preferences))
    |> Repo.update()
  end

  @doc "Get user settings."
  @spec get_settings(User.t()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
  def get_settings(user) do
    case Repo.get_by(UserSettings, user_id: user.id) do
      nil -> create_default_settings(user)
      settings -> {:ok, settings}
    end
  end

  @doc "Update user settings."
  @spec update_settings(User.t(), map()) :: {:ok, UserSettings.t()} | {:error, Ecto.Changeset.t()}
  def update_settings(user, attrs) do
    with {:ok, settings} <- get_settings(user) do
      settings
      |> UserSettings.changeset(attrs)
      |> Repo.update()
    end
  end

  defp create_default_settings(user) do
    %UserSettings{user_id: user.id}
    |> UserSettings.changeset(%{})
    |> Repo.insert()
  end
end
