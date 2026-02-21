defmodule CGraph.OAuth.UserManager do
  @moduledoc """
  OAuth user management: creation, linking, and unlinking of OAuth accounts.

  Handles finding or creating users based on OAuth provider data,
  linking additional OAuth providers to existing users, and unlinking
  providers while ensuring users retain at least one authentication method.
  """

  alias CGraph.{Accounts, Repo}
  alias CGraph.Accounts.User

  @type provider :: :google | :apple | :facebook | :tiktok

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Link an OAuth account to an existing user.

  ## Parameters

  - `user` - The existing user
  - `provider` - The OAuth provider
  - `provider_uid` - The unique ID from the provider
  - `provider_data` - Additional data from the provider
  """
  @spec link_account(User.t(), provider(), String.t(), map()) :: {:ok, User.t()} | {:error, term()}
  def link_account(%User{} = user, provider, provider_uid, provider_data) do
    attrs = %{
      oauth_provider: to_string(provider),
      oauth_uid: provider_uid,
      oauth_data: Map.merge(user.oauth_data || %{}, %{
        to_string(provider) => %{
          uid: provider_uid,
          data: provider_data,
          linked_at: DateTime.utc_now() |> DateTime.to_iso8601()
        }
      })
    }

    user
    |> User.oauth_changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Unlink an OAuth account from an existing user.

  Only allows unlinking if the user has another authentication method.
  """
  @spec unlink_account(User.t(), provider()) :: {:ok, User.t()} | {:error, term()}
  def unlink_account(%User{} = user, provider) do
    provider_key = to_string(provider)

    has_password = user.password_hash != nil
    has_other_oauth = user.oauth_data && Map.keys(user.oauth_data) -- [provider_key] != []
    has_wallet = user.wallet_address != nil

    if has_password or has_other_oauth or has_wallet do
      new_oauth_data = Map.delete(user.oauth_data || %{}, provider_key)

      attrs = if user.oauth_provider == provider_key do
        %{oauth_provider: nil, oauth_uid: nil, oauth_data: new_oauth_data}
      else
        %{oauth_data: new_oauth_data}
      end

      user
      |> User.oauth_changeset(attrs)
      |> Repo.update()
    else
      {:error, :cannot_unlink_only_auth_method}
    end
  end

  @doc """
  Find or create a user based on OAuth provider data.

  Looks up the user by provider + uid first, then falls back to email matching.
  """
  @spec find_or_create_user(provider(), map()) :: {:ok, User.t()} | {:error, term()}
  def find_or_create_user(provider, user_info) do
    provider_str = to_string(provider)
    uid = user_info.uid

    case Accounts.get_user_by_oauth(provider_str, uid) do
      %User{} = user -> update_oauth_data(user, user_info)
      nil -> find_or_create_by_email(user_info)
    end
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp find_or_create_by_email(%{email: nil} = user_info), do: create_oauth_user(user_info)
  defp find_or_create_by_email(%{email_verified: false} = user_info), do: create_oauth_user(user_info)
  defp find_or_create_by_email(user_info) do
    case Accounts.get_user_by_email(user_info.email) do
      {:ok, user} -> link_oauth_to_user(user, user_info)
      {:error, :not_found} -> create_oauth_user(user_info)
    end
  end

  defp update_oauth_data(user, user_info) do
    provider_str = to_string(user_info.provider)

    oauth_data = Map.merge(user.oauth_data || %{}, %{
      provider_str => %{
        "uid" => user_info.uid,
        "last_login" => DateTime.utc_now() |> DateTime.to_iso8601(),
        "name" => user_info.name,
        "picture" => user_info.picture
      }
    })

    user
    |> User.oauth_changeset(%{
      oauth_data: oauth_data,
      avatar_url: user.avatar_url || user_info.picture
    })
    |> Repo.update()
  end

  defp link_oauth_to_user(user, user_info) do
    provider_str = to_string(user_info.provider)

    oauth_data = Map.merge(user.oauth_data || %{}, %{
      provider_str => %{
        "uid" => user_info.uid,
        "linked_at" => DateTime.utc_now() |> DateTime.to_iso8601(),
        "name" => user_info.name,
        "picture" => user_info.picture
      }
    })

    attrs = %{
      oauth_provider: user.oauth_provider || provider_str,
      oauth_uid: user.oauth_uid || user_info.uid,
      oauth_data: oauth_data
    }

    user
    |> User.oauth_changeset(attrs)
    |> Repo.update()
  end

  defp create_oauth_user(user_info) do
    provider_str = to_string(user_info.provider)

    base_username = if user_info.name do
      user_info.name
      |> String.downcase()
      |> String.replace(~r/[^a-z0-9]/, "")
      |> String.slice(0, 15)
    else
      "#{provider_str}user"
    end

    username = generate_unique_username(base_username)

    oauth_data = %{
      provider_str => %{
        "uid" => user_info.uid,
        "created_at" => DateTime.utc_now() |> DateTime.to_iso8601(),
        "name" => user_info.name,
        "picture" => user_info.picture
      }
    }

    attrs = %{
      email: user_info.email,
      username: username,
      display_name: user_info.name,
      avatar_url: user_info.picture,
      auth_type: :oauth,
      oauth_provider: provider_str,
      oauth_uid: user_info.uid,
      oauth_data: oauth_data,
      email_verified_at: if(user_info.email_verified, do: DateTime.utc_now())
    }

    %User{}
    |> User.oauth_registration_changeset(attrs)
    |> Repo.insert()
  end

  defp generate_unique_username(base, attempt \\ 0) do
    username = if attempt == 0 do
      base
    else
      "#{base}#{:rand.uniform(9999)}"
    end

    case Accounts.get_user_by_username(username) do
      {:error, :not_found} -> username
      {:ok, _user} when attempt < 10 -> generate_unique_username(base, attempt + 1)
      {:ok, _user} -> "#{base}#{System.unique_integer([:positive])}"
    end
  end
end
