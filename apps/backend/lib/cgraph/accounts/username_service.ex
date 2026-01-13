defmodule CGraph.Accounts.UsernameService do
  @moduledoc """
  Service for managing username changes with cooldown and history tracking.
  """
  
  import Ecto.Query, warn: false
  alias CGraph.Repo
  alias CGraph.Accounts.{User, UsernameChange}
  
  # Default cooldown: 30 days
  @default_cooldown_days 30
  
  # Premium users: 7 days cooldown
  @premium_cooldown_days 7
  
  @doc """
  Check if a user can change their username.
  Returns {:ok, remaining_days} if allowed, {:error, reason} otherwise.
  """
  def can_change_username?(user_id, is_premium \\ false) do
    user = Repo.get!(User, user_id)
    cooldown_days = if is_premium, do: @premium_cooldown_days, else: @default_cooldown_days
    
    case user.last_username_change_at do
      nil ->
        {:ok, 0}
        
      last_change ->
        days_since = DateTime.diff(DateTime.utc_now(), last_change, :day)
        
        if days_since >= cooldown_days do
          {:ok, 0}
        else
          {:error, {:cooldown, cooldown_days - days_since}}
        end
    end
  end
  
  @doc """
  Change a user's username.
  """
  def change_username(user_id, new_username, opts \\ []) do
    is_admin = Keyword.get(opts, :admin, false)
    is_premium = Keyword.get(opts, :premium, false)
    reason = Keyword.get(opts, :reason)
    
    user = Repo.get!(User, user_id)
    
    # Check cooldown (unless admin is doing it)
    unless is_admin do
      case can_change_username?(user_id, is_premium) do
        {:ok, _} -> :ok
        {:error, reason} -> throw({:error, reason})
      end
    end
    
    # Check username availability
    if username_taken?(new_username, user_id) do
      throw({:error, :username_taken})
    end
    
    # Check for recently used usernames (prevent sniping)
    if username_recently_released?(new_username) do
      throw({:error, :username_recently_released})
    end
    
    Repo.transaction(fn ->
      # Record the change
      {:ok, _change} = 
        %UsernameChange{}
        |> UsernameChange.changeset(%{
          user_id: user_id,
          old_username: user.username,
          new_username: new_username,
          reason: reason,
          changed_by_admin: is_admin
        })
        |> Repo.insert()
      
      # Update the user
      {:ok, updated_user} =
        user
        |> User.changeset(%{
          username: new_username,
          last_username_change_at: DateTime.utc_now(),
          username_changes_count: (user.username_changes_count || 0) + 1
        })
        |> Repo.update()
      
      updated_user
    end)
  catch
    {:error, reason} -> {:error, reason}
  end
  
  @doc """
  Get username change history for a user.
  """
  def get_history(user_id) do
    from(uc in UsernameChange,
      where: uc.user_id == ^user_id,
      order_by: [desc: uc.inserted_at]
    )
    |> Repo.all()
  end
  
  @doc """
  Check if a username was recently released (within 30 days).
  """
  def username_recently_released?(username) do
    thirty_days_ago = DateTime.add(DateTime.utc_now(), -30, :day)
    
    from(uc in UsernameChange,
      where: uc.old_username == ^username,
      where: uc.inserted_at > ^thirty_days_ago,
      limit: 1
    )
    |> Repo.exists?()
  end
  
  @doc """
  Check if a username is taken by another user.
  """
  def username_taken?(username, exclude_user_id \\ nil) do
    query = from(u in User, where: u.username == ^username)
    
    query = 
      if exclude_user_id do
        from(u in query, where: u.id != ^exclude_user_id)
      else
        query
      end
    
    Repo.exists?(query)
  end
  
  @doc """
  Admin: Force change a user's username.
  """
  def admin_change_username(admin_id, user_id, new_username, reason) do
    change_username(user_id, new_username, admin: true, reason: "Admin (#{admin_id}): #{reason}")
  end
end
