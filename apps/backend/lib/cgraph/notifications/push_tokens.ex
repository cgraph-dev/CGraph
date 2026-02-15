defmodule CGraph.Notifications.PushTokens do
  @moduledoc "Push token registration and management."

  import Ecto.Query

  alias CGraph.Accounts.{PushToken, User}
  alias CGraph.Repo

  @doc "Register a push token for a user. Updates existing if token matches."
  @spec register_push_token(User.t(), map()) :: {:ok, PushToken.t()} | {:error, Ecto.Changeset.t()}
  def register_push_token(%User{} = user, token_params) do
    attrs = Map.merge(token_params, %{"user_id" => user.id})
    existing = Repo.get_by(PushToken, user_id: user.id, token: attrs["token"])

    case existing do
      nil ->
        %PushToken{}
        |> PushToken.changeset(attrs)
        |> Repo.insert()

      token ->
        token
        |> PushToken.changeset(attrs)
        |> Repo.update()
    end
  end

  @doc "List all push tokens for a user."
  @spec list_push_tokens(User.t()) :: [PushToken.t()]
  def list_push_tokens(%User{} = user) do
    PushToken
    |> where([p], p.user_id == ^user.id)
    |> Repo.all()
  end

  @doc "Get a specific push token by ID."
  @spec get_push_token(User.t(), String.t()) :: {:ok, PushToken.t()} | {:error, :not_found}
  def get_push_token(%User{} = user, token_id) do
    case PushToken
         |> where([p], p.id == ^token_id and p.user_id == ^user.id)
         |> Repo.one() do
      nil -> {:error, :not_found}
      token -> {:ok, token}
    end
  end

  @doc "Get a specific push token by its value (the actual token string)."
  @spec get_push_token_by_value(User.t(), String.t()) :: {:ok, PushToken.t()} | {:error, :not_found}
  def get_push_token_by_value(%User{} = user, token_value) do
    case PushToken
         |> where([p], p.token == ^token_value and p.user_id == ^user.id)
         |> Repo.one() do
      nil -> {:error, :not_found}
      token -> {:ok, token}
    end
  end

  @doc "Update a push token by device_id."
  @spec update_push_token(User.t(), map()) :: {:ok, PushToken.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def update_push_token(%User{} = user, token_params) do
    case Repo.get_by(PushToken, user_id: user.id, device_id: token_params["device_id"]) do
      nil -> {:error, :not_found}
      token ->
        token
        |> PushToken.changeset(token_params)
        |> Repo.update()
    end
  end

  @doc "Delete a push token. Accepts a PushToken struct or token ID string."
  @spec delete_push_token(PushToken.t() | String.t()) :: {:ok, PushToken.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def delete_push_token(%PushToken{} = token) do
    Repo.delete(token)
  end

  def delete_push_token(token_id) when is_binary(token_id) do
    case Repo.get(PushToken, token_id) do
      nil -> {:error, :not_found}
      token -> Repo.delete(token)
    end
  end

  @doc "Delete a push token by device ID."
  @spec delete_push_token_by_device(User.t(), String.t()) :: {:ok, PushToken.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def delete_push_token_by_device(%User{} = user, device_id) do
    case Repo.get_by(PushToken, user_id: user.id, device_id: device_id) do
      nil -> {:error, :not_found}
      token -> Repo.delete(token)
    end
  end
end
