defmodule CGraph.PaidDm do
  @moduledoc """
  Context module for the Paid DM Files domain.

  Handles sending paid file attachments in DMs, unlocking them
  via node payments, and managing per-user paid DM settings.
  """

  import Ecto.Query

  alias CGraph.Repo
  alias CGraph.PaidDm.{PaidDmFile, PaidDmSetting}
  alias CGraph.Nodes

  @expiry_hours 72
  @platform_cut_percent 20

  # ============================================================================
  # Files
  # ============================================================================

  @doc """
  Creates a paid DM file record with a 72-hour expiry window.
  """
  @spec send_paid_file(String.t(), String.t(), map(), integer()) ::
          {:ok, PaidDmFile.t()} | {:error, Ecto.Changeset.t()}
  def send_paid_file(sender_id, receiver_id, file_attrs, nodes_required) do
    expires_at =
      DateTime.utc_now()
      |> DateTime.add(@expiry_hours * 3600, :second)
      |> DateTime.truncate(:second)

    attrs =
      Map.merge(file_attrs, %{
        sender_id: sender_id,
        receiver_id: receiver_id,
        nodes_required: nodes_required,
        expires_at: expires_at,
        status: "pending"
      })

    %PaidDmFile{}
    |> PaidDmFile.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Unlocks a paid DM file by debiting the receiver and crediting the sender
  (minus a 20% platform cut). Updates the file status to "paid".
  """
  @spec unlock_paid_file(String.t(), String.t()) ::
          {:ok, PaidDmFile.t()} | {:error, atom() | Ecto.Changeset.t()}
  def unlock_paid_file(file_id, receiver_id) do
    with {:ok, file} <- get_pending_file(file_id, receiver_id),
         {:ok, _debit} <-
           Nodes.debit_nodes(receiver_id, file.nodes_required, :paid_dm_unlock,
             reference_id: file.id,
             reference_type: "paid_dm_file",
             description: "Unlock paid DM file"
           ),
         creator_amount <- calculate_creator_amount(file.nodes_required),
         {:ok, _credit} <-
           Nodes.credit_nodes(file.sender_id, creator_amount, :paid_dm_earning,
             reference_id: file.id,
             reference_type: "paid_dm_file",
             description: "Earning from paid DM file"
           ) do
      file
      |> PaidDmFile.changeset(%{status: "paid"})
      |> Repo.update()
    end
  end

  @doc """
  Lists pending (unlockable) files for a given receiver.
  """
  @spec list_pending_files(String.t()) :: [PaidDmFile.t()]
  def list_pending_files(receiver_id) do
    now = DateTime.utc_now()

    from(f in PaidDmFile,
      where: f.receiver_id == ^receiver_id and f.status == "pending" and f.expires_at > ^now,
      order_by: [desc: f.inserted_at],
      preload: [:sender]
    )
    |> Repo.all()
  end

  @doc """
  Marks all expired pending files as expired.
  """
  @spec expire_stale_files() :: {integer(), nil | [term()]}
  def expire_stale_files do
    now = DateTime.utc_now()

    from(f in PaidDmFile,
      where: f.status == "pending" and f.expires_at <= ^now
    )
    |> Repo.update_all(set: [status: "expired", updated_at: now])
  end

  # ============================================================================
  # Settings
  # ============================================================================

  @doc """
  Gets paid DM settings for a user, returns nil if not configured.
  """
  @spec get_settings(String.t()) :: PaidDmSetting.t() | nil
  def get_settings(user_id) do
    Repo.get_by(PaidDmSetting, user_id: user_id)
  end

  @doc """
  Upserts paid DM settings for a user.
  """
  @spec configure_settings(String.t(), map()) ::
          {:ok, PaidDmSetting.t()} | {:error, Ecto.Changeset.t()}
  def configure_settings(user_id, attrs) do
    case get_settings(user_id) do
      nil ->
        %PaidDmSetting{}
        |> PaidDmSetting.changeset(Map.put(attrs, :user_id, user_id))
        |> Repo.insert()

      existing ->
        existing
        |> PaidDmSetting.changeset(attrs)
        |> Repo.update()
    end
  end

  # ============================================================================
  # Private helpers
  # ============================================================================

  defp get_pending_file(file_id, receiver_id) do
    now = DateTime.utc_now()

    case Repo.get_by(PaidDmFile, id: file_id, receiver_id: receiver_id, status: "pending") do
      nil -> {:error, :not_found}
      %PaidDmFile{expires_at: exp} when exp <= now -> {:error, :expired}
      file -> {:ok, file}
    end
  end

  defp calculate_creator_amount(nodes_required) do
    trunc(nodes_required * (100 - @platform_cut_percent) / 100)
  end
end
