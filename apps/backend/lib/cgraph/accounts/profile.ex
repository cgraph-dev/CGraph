defmodule CGraph.Accounts.Profile do
  @moduledoc """
  User profile management functionality.

  Handles profile viewing, updating bio, signature, and other profile fields.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.MemberDirectory
  alias CGraph.Accounts.User
  alias CGraph.Repo

  @doc """
  Get a user's profile.
  """
  @spec get_profile(Ecto.UUID.t(), term()) :: term()
  def get_profile(user_id, viewer) do
    MemberDirectory.get_member_profile(user_id, viewer)
  end

  @doc """
  Update a user's signature.
  """
  @spec update_signature(Ecto.UUID.t(), String.t()) :: {:ok, %User{}} | {:error, :not_found}
  def update_signature(user_id, signature) do
    case Repo.get(User, user_id) do
      nil -> {:error, :not_found}
      user ->
        user
        |> Ecto.Changeset.change(signature: signature)
        |> Repo.update()
    end
  end

  @doc """
  Update a user's bio.
  """
  @spec update_bio(Ecto.UUID.t(), String.t()) :: {:ok, %User{}} | {:error, :not_found}
  def update_bio(user_id, bio) do
    case Repo.get(User, user_id) do
      nil -> {:error, :not_found}
      user ->
        user
        |> Ecto.Changeset.change(bio: bio)
        |> Repo.update()
    end
  end

  @doc """
  Update a user's profile fields.
  """
  @spec update_profile(Ecto.UUID.t(), map()) :: {:ok, %User{}} | {:error, :not_found | Ecto.Changeset.t()}
  def update_profile(user_id, attrs) do
    case Repo.get(User, user_id) do
      nil -> {:error, :not_found}
      user ->
        allowed_fields = [:display_name, :bio, :signature]
        changes = Map.take(attrs, Enum.map(allowed_fields, &to_string/1))
        |> Enum.map(fn {k, v} -> {String.to_existing_atom(k), v} end)
        |> Enum.into(%{})

        user
        |> Ecto.Changeset.cast(changes, allowed_fields)
        |> Ecto.Changeset.validate_length(:bio, max: 500)
        |> Ecto.Changeset.validate_length(:signature, max: 500)
        |> Ecto.Changeset.validate_length(:display_name, max: 50)
        |> Repo.update()
    end
  end

  @doc """
  Get a user's activity feed.
  """
  @spec get_user_activity(Ecto.UUID.t(), term(), keyword()) :: {:ok, list(), map()}
  def get_user_activity(_user_id, _viewer, _opts \\ []) do
    # Would need to implement activity tracking
    {:ok, [], %{page: 1, per_page: 20, total_count: 0, total_pages: 0}}
  end

  @doc """
  Get profile visitors.
  """
  @spec get_profile_visitors(Ecto.UUID.t(), keyword()) :: {list(), map()}
  def get_profile_visitors(_user_id, _opts \\ []) do
    # Would need to implement visitor tracking
    {[], %{page: 1, per_page: 20, total_count: 0, total_pages: 0}}
  end
end
