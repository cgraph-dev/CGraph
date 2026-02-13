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
  def get_profile(user_id, viewer) do
    MemberDirectory.get_member_profile(user_id, viewer)
  end

  @doc """
  Update a user's signature.
  """
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
  def update_profile(user_id, attrs) do
    case Repo.get(User, user_id) do
      nil -> {:error, :not_found}
      user ->
        allowed_fields = [:display_name, :title, :bio, :signature, :timezone]
        changes = Map.take(attrs, Enum.map(allowed_fields, &to_string/1))
        |> Enum.map(fn {k, v} -> {String.to_existing_atom(k), v} end)
        |> Enum.into(%{})

        user
        |> Ecto.Changeset.change(changes)
        |> Repo.update()
    end
  end

  @doc """
  Get a user's activity feed.
  """
  def get_user_activity(_user_id, _viewer, _opts \\ []) do
    # Would need to implement activity tracking
    {:ok, [], %{page: 1, per_page: 20, total_count: 0, total_pages: 0}}
  end

  @doc """
  Get profile visitors.
  """
  def get_profile_visitors(_user_id, _opts \\ []) do
    # Would need to implement visitor tracking
    {[], %{page: 1, per_page: 20, total_count: 0, total_pages: 0}}
  end
end
