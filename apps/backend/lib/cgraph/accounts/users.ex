defmodule CGraph.Accounts.Users do
  @moduledoc """
  User CRUD operations.
  
  Handles user creation, updates, and queries.
  """
  
  import Ecto.Query
  alias CGraph.Repo
  alias CGraph.Accounts.User
  
  @doc """
  Gets a user by ID.
  """
  def get_user(id) do
    case Repo.get(User, id) do
      nil -> {:error, :not_found}
      user -> {:ok, user}
    end
  end
  
  @doc """
  Gets a user by email.
  """
  def get_user_by_email(email) do
    Repo.get_by(User, email: String.downcase(email))
  end
  
  @doc """
  Gets a user by username.
  """
  def get_user_by_username(username) do
    Repo.get_by(User, username: String.downcase(username))
  end
  
  @doc """
  Gets a user by email or username.
  """
  def get_user_by_email_or_username(identifier) do
    identifier = String.downcase(identifier)
    
    Repo.one(
      from(u in User,
        where: u.email == ^identifier or u.username == ^identifier
      )
    )
  end
  
  @doc """
  Creates a new user.
  """
  def create_user(attrs) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end
  
  @doc """
  Updates a user.
  """
  def update_user(user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end
  
  @doc """
  Updates a user's profile.
  """
  def update_profile(user, attrs) do
    user
    |> User.profile_changeset(attrs)
    |> Repo.update()
  end
  
  @doc """
  Changes a user's password.
  """
  def change_password(user, current_password, new_password) do
    if User.valid_password?(user, current_password) do
      user
      |> User.password_changeset(%{password: new_password})
      |> Repo.update()
    else
      {:error, :invalid_current_password}
    end
  end
  
  @doc """
  Deletes a user (soft delete).
  """
  def delete_user(user) do
    user
    |> User.changeset(%{deleted_at: DateTime.utc_now()})
    |> Repo.update()
  end
  
  @doc """
  Lists users with optional filters.
  """
  def list_users(opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    search = Keyword.get(opts, :search)
    
    query = from(u in User, where: is_nil(u.deleted_at))
    
    query
    |> maybe_search(search)
    |> order_by([u], desc: u.inserted_at)
    |> Repo.paginate(page: page, page_size: per_page)
  end
  
  @doc """
  Counts total users.
  """
  def count_users do
    Repo.aggregate(
      from(u in User, where: is_nil(u.deleted_at)),
      :count
    )
  end
  
  # Private helpers
  
  defp maybe_search(query, nil), do: query
  defp maybe_search(query, search) do
    search_term = "%#{search}%"
    from(u in query,
      where: ilike(u.username, ^search_term) or ilike(u.email, ^search_term)
    )
  end
end
