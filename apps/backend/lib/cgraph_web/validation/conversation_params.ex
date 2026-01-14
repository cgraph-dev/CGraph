defmodule CGraphWeb.Validation.ConversationParams do
  @moduledoc """
  Strong parameter validation for conversation and group endpoints.

  Provides strict type checking, sanitization, and business rule validation
  for DMs and group conversation operations.

  ## Endpoints Covered

  - POST /conversations (create DM)
  - POST /groups (create group)
  - PUT /groups/:id (update group)
  - POST /groups/:id/members (add members)
  - DELETE /groups/:id/members/:user_id (remove member)
  """

  use Ecto.Schema
  import Ecto.Changeset

  @max_group_name_length 100
  @max_description_length 500
  @max_topic_length 200
  @max_members 500

  embedded_schema do
    # DM creation
    field :recipient_id, Ecto.UUID
    field :initial_message, :string

    # Group fields
    field :name, :string
    field :description, :string
    field :topic, :string
    field :icon_url, :string
    field :is_encrypted, :boolean, default: true
    field :is_public, :boolean, default: false

    # Member management
    field :member_ids, {:array, Ecto.UUID}
    field :role, :string

    # Settings
    field :is_muted, :boolean
    field :muted_until, :utc_datetime
    field :is_archived, :boolean
    field :is_pinned, :boolean
    field :nickname, :string
  end

  @doc """
  Validate parameters for creating a DM conversation.
  """
  def validate_create_dm(params) do
    %__MODULE__{}
    |> cast(params, [:recipient_id, :initial_message], empty_values: [""])
    |> validate_required([:recipient_id])
    |> validate_length(:initial_message, max: 10_000)
    |> result_from_changeset()
  end

  @doc """
  Validate parameters for creating a group.
  """
  def validate_create_group(params) do
    %__MODULE__{}
    |> cast(params, [:name, :description, :icon_url, :is_encrypted, :is_public, :member_ids], empty_values: [""])
    |> validate_required([:name])
    |> validate_length(:name, min: 1, max: @max_group_name_length)
    |> validate_length(:description, max: @max_description_length)
    |> validate_url(:icon_url)
    |> validate_member_count()
    |> sanitize_name()
    |> result_from_changeset()
  end

  @doc """
  Validate parameters for updating a group.
  """
  def validate_update_group(params) do
    %__MODULE__{}
    |> cast(params, [:name, :description, :topic, :icon_url, :is_public], empty_values: [""])
    |> validate_length(:name, min: 1, max: @max_group_name_length)
    |> validate_length(:description, max: @max_description_length)
    |> validate_length(:topic, max: @max_topic_length)
    |> validate_url(:icon_url)
    |> sanitize_name()
    |> result_from_changeset()
  end

  @doc """
  Validate parameters for adding members to a group.
  """
  def validate_add_members(params) do
    %__MODULE__{}
    |> cast(params, [:member_ids], empty_values: [""])
    |> validate_required([:member_ids])
    |> validate_member_count()
    |> result_from_changeset()
  end

  @doc """
  Validate parameters for updating member role.
  """
  def validate_update_member_role(params) do
    %__MODULE__{}
    |> cast(params, [:role], empty_values: [""])
    |> validate_required([:role])
    |> validate_inclusion(:role, ~w(member moderator admin owner))
    |> result_from_changeset()
  end

  @doc """
  Validate participant settings (mute, archive, pin).
  """
  def validate_participant_settings(params) do
    %__MODULE__{}
    |> cast(params, [:is_muted, :muted_until, :is_archived, :is_pinned, :nickname], empty_values: [""])
    |> validate_mute_duration()
    |> validate_length(:nickname, max: 50)
    |> result_from_changeset()
  end

  @doc """
  Validate typing indicator params.
  """
  def validate_typing(params) do
    # Use embedded schema for typing validation
    %__MODULE__{}
    |> cast(params, [:conversation_id, :channel_id], empty_values: [""])
    |> validate_destination()
    |> result_from_changeset()
  end

  # ============================================================================
  # Private Validation Functions
  # ============================================================================

  defp validate_member_count(changeset) do
    member_ids = get_change(changeset, :member_ids) || []

    if length(member_ids) > @max_members do
      add_error(changeset, :member_ids, "cannot add more than #{@max_members} members at once")
    else
      changeset
    end
  end

  defp validate_mute_duration(changeset) do
    muted_until = get_change(changeset, :muted_until)

    if muted_until do
      now = DateTime.utc_now()

      if DateTime.compare(muted_until, now) == :lt do
        add_error(changeset, :muted_until, "must be in the future")
      else
        changeset
      end
    else
      changeset
    end
  end

  defp validate_url(changeset, field) do
    url = get_change(changeset, field)

    if url && is_binary(url) do
      case URI.parse(url) do
        %URI{scheme: scheme} when scheme in ["http", "https"] ->
          changeset

        _ ->
          add_error(changeset, field, "must be a valid HTTP or HTTPS URL")
      end
    else
      changeset
    end
  end

  defp sanitize_name(changeset) do
    update_change(changeset, :name, fn name ->
      if name && is_binary(name) do
        name
        |> String.trim()
        |> String.slice(0, @max_group_name_length)
      else
        name
      end
    end)
  end

  defp validate_destination(changeset) do
    conversation_id = get_change(changeset, :conversation_id)
    channel_id = get_change(changeset, :channel_id)

    case {conversation_id, channel_id} do
      {nil, nil} ->
        add_error(changeset, :conversation_id, "either conversation_id or channel_id is required")

      _ -> changeset
    end
  end

  # ============================================================================
  # Result Helpers
  # ============================================================================

  defp result_from_changeset(%Ecto.Changeset{} = changeset) do
    case apply_action(changeset, :validate) do
      {:ok, struct} -> {:ok, to_map(struct)}
      {:error, cs} -> {:error, cs}
    end
  end

  defp to_map(%__MODULE__{} = struct) do
    struct
    |> Map.from_struct()
    |> Map.delete(:__meta__)
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end
end
