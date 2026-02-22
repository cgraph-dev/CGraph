defmodule CGraph.Messaging.VoiceMessage.Query do
  @moduledoc """
  Database operations for voice messages.

  Provides CRUD operations and query functions for voice message records,
  including pagination support, rate limiting, and storage cleanup on deletion.
  """

  import Ecto.Query

  alias CGraph.Messaging.VoiceMessage
  alias CGraph.Repo

  @doc """
  Create a new voice message record.
  """
  @spec create(map()) :: {:ok, VoiceMessage.t()} | {:error, Ecto.Changeset.t()}
  def create(attrs) do
    %VoiceMessage{}
    |> VoiceMessage.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Get a voice message by ID.
  """
  @spec get(Ecto.UUID.t()) :: {:ok, VoiceMessage.t()} | {:error, :not_found}
  def get(id) do
    case Repo.get(VoiceMessage, id) do
      nil -> {:error, :not_found}
      voice_message -> {:ok, voice_message}
    end
  end

  @doc """
  List voice messages for a user with pagination.

  Only returns processed voice messages, sorted by insertion time (newest first).
  """
  @spec list_for_user(Ecto.UUID.t(), keyword()) :: term()
  def list_for_user(user_id, opts \\ []) do
    query =
      from(v in VoiceMessage,
        where: v.user_id == ^user_id,
        where: v.is_processed == true
      )

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :desc
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc """
  Get all voice messages for a user.
  Alias for `list_for_user/1`.
  """
  @spec for_user(Ecto.UUID.t()) :: [VoiceMessage.t()]
  def for_user(user_id), do: list_for_user(user_id)

  @doc """
  Delete a voice message and its associated file from storage.
  """
  @spec delete(VoiceMessage.t()) :: :ok
  def delete(%VoiceMessage{} = voice_message) do
    delete_file(voice_message.url)
    Repo.delete(voice_message)
    :ok
  end

  @doc """
  Check rate limit for voice message uploads.

  Returns `:ok` if within limits, `{:error, :rate_limited}` otherwise.

  ## Limits

  - 10 messages per minute
  - 100 messages per hour
  """
  @spec check_rate_limit(Ecto.UUID.t()) :: :ok | {:error, :rate_limited}
  def check_rate_limit(user_id) do
    one_minute_ago = DateTime.add(DateTime.utc_now(), -60, :second)

    minute_count = from(v in VoiceMessage,
      where: v.user_id == ^user_id,
      where: v.inserted_at > ^one_minute_ago,
      select: count()
    )
    |> Repo.one()

    if minute_count >= 10 do
      {:error, :rate_limited}
    else
      one_hour_ago = DateTime.add(DateTime.utc_now(), -3600, :second)

      hour_count = from(v in VoiceMessage,
        where: v.user_id == ^user_id,
        where: v.inserted_at > ^one_hour_ago,
        select: count()
      )
      |> Repo.one()

      if hour_count >= 100 do
        {:error, :rate_limited}
      else
        :ok
      end
    end
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp delete_file(url) when is_binary(url) do
    storage_module = storage_backend()
    storage_module.delete(url)
  end
  defp delete_file(_), do: :ok

  defp storage_backend do
    Application.get_env(:cgraph, :storage_backend, CGraph.Storage.Local)
  end
end
