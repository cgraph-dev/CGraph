defmodule CGraphWeb.Validation.SubscriptionParams do
  @moduledoc """
  Strong parameter validation for subscription endpoints.

  Uses embedded schemas so we can reuse the same validation rules across
  create, update, and bulk-update flows without persisting anything.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @notification_modes ~w(instant digest none)

  embedded_schema do
    field :type, :string
    field :target_id, :integer
    field :notification_mode, :string, default: "instant"
    field :email_notifications, :boolean, default: true
    field :push_notifications, :boolean, default: true
    field :include_replies, :boolean, default: true
  end

  @doc """
  Validate payload for creating a subscription. Enforces:
  - required type and target
  - supported type values
  - normalized boolean flags and notification mode
  """
  def validate_create(params) do
    %__MODULE__{}
    |> cast(params, [:type, :target_id, :notification_mode, :email_notifications, :push_notifications, :include_replies],
      empty_values: [""]
    )
    |> validate_required([:type, :target_id])
    |> update_change(:type, &String.downcase/1)
    |> validate_inclusion(:type, ["forum", "board", "thread"])
    |> set_default_if_nil(:notification_mode, "instant")
    |> validate_optional_inclusion(:notification_mode, @notification_modes)
    |> apply_boolean_defaults()
    |> result_from_changeset()
  end

  @doc """
  Validate payload for updating a single subscription. Allows partial updates
  but enforces that provided keys are valid and modes are supported.
  """
  def validate_update(params) do
    %__MODULE__{}
    |> cast(params, [:notification_mode, :email_notifications, :push_notifications, :include_replies], empty_values: [""])
    |> validate_optional_inclusion(:notification_mode, @notification_modes)
    |> require_at_least_one([:notification_mode, :email_notifications, :push_notifications, :include_replies])
    |> result_from_changeset()
  end

  @doc """
  Validate payload for bulk update. Shares rules with update but keeps
  `include_replies` optional for now.
  """
  def validate_bulk_update(params) do
    %__MODULE__{}
    |> cast(params, [:notification_mode, :email_notifications, :push_notifications, :include_replies], empty_values: [""])
    |> validate_optional_inclusion(:notification_mode, @notification_modes)
    |> require_at_least_one([:notification_mode, :email_notifications, :push_notifications, :include_replies])
    |> result_from_changeset()
  end

  defp apply_boolean_defaults(changeset) do
    changeset
    |> put_default_if_nil(:email_notifications, true)
    |> put_default_if_nil(:push_notifications, true)
    |> put_default_if_nil(:include_replies, true)
  end

  defp put_default_if_nil(changeset, field, default) do
    case fetch_field(changeset, field) do
      {_data?, nil} -> put_change(changeset, field, default)
      _ -> changeset
    end
  end

  defp set_default_if_nil(changeset, field, default) do
    case fetch_field(changeset, field) do
      {_data?, nil} -> put_change(changeset, field, default)
      _ -> changeset
    end
  end

  defp validate_optional_inclusion(changeset, field, values) do
    case get_field(changeset, field) do
      nil -> changeset
      _ -> validate_inclusion(changeset, field, values)
    end
  end

  defp require_at_least_one(changeset, fields) do
    if Enum.any?(fields, &Map.has_key?(changeset.changes, &1)) do
      changeset
    else
      add_error(changeset, :base, "At least one field must be provided")
    end
  end

  defp result_from_changeset(%Ecto.Changeset{} = changeset) do
    case apply_action(changeset, :validate) do
      {:ok, params} -> {:ok, params}
      {:error, cs} -> {:error, cs}
    end
  end
end