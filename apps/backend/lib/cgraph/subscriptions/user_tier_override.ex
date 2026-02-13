defmodule CGraph.Subscriptions.UserTierOverride do
  @moduledoc """
  Schema for per-user limit overrides.

  Allows granting specific users increased or decreased limits beyond
  their subscription tier. Useful for:

  - Promotional bonuses
  - Beta testers
  - Staff members
  - Temporary limit increases

  ## Example

      # Grant a user 100 forums instead of their tier's default
      %UserTierOverride{
        user_id: user.id,
        limit_key: "max_forums_owned",
        override_value: "100",
        reason: "Community moderator bonus",
        expires_at: ~U[2026-12-31 23:59:59Z]
      }
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @valid_limit_keys ~w(
    max_forums_owned max_forums_joined max_boards_per_forum
    max_threads_per_day max_posts_per_day max_comments_per_hour
    max_custom_emojis max_storage_bytes max_file_size_bytes
    max_attachments_per_post max_conversations max_group_size
    max_messages_per_minute max_friends max_blocked_users
    max_private_messages_per_day max_daily_trades
    ai_moderation_requests_per_day ai_suggestions_requests_per_day
    api_requests_per_hour max_webhooks concurrent_sessions max_devices
    rate_limit_multiplier
  )

  schema "user_tier_overrides" do
    field :limit_key, :string
    field :override_value, :string
    field :reason, :string
    field :expires_at, :utc_datetime_usec

    belongs_to :user, CGraph.Accounts.User
    belongs_to :granted_by, CGraph.Accounts.User, foreign_key: :granted_by_id

    timestamps(type: :utc_datetime_usec)
  end

  @doc """
  Creates a changeset for a user tier override.
  """
  def changeset(override, attrs) do
    override
    |> cast(attrs, [:user_id, :limit_key, :override_value, :reason, :granted_by_id, :expires_at])
    |> validate_required([:user_id, :limit_key, :override_value])
    |> validate_inclusion(:limit_key, @valid_limit_keys)
    |> unique_constraint([:user_id, :limit_key])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:granted_by_id)
  end

  @doc """
  Returns valid limit keys.
  """
  def valid_limit_keys, do: @valid_limit_keys

  @doc """
  Parses the override value based on the limit key type.
  """
  def parse_value(limit_key, value) when limit_key in ~w(rate_limit_multiplier) do
    case Float.parse(value) do
      {float, ""} -> {:ok, float}
      _ -> {:error, "invalid float value"}
    end
  end

  def parse_value(_limit_key, value) do
    case Integer.parse(value) do
      {int, ""} -> {:ok, int}
      _ -> {:error, "invalid integer value"}
    end
  end

  @doc """
  Checks if an override has expired.
  """
  def expired?(%__MODULE__{expires_at: nil}), do: false
  def expired?(%__MODULE__{expires_at: expires_at}) do
    DateTime.compare(DateTime.utc_now(), expires_at) == :gt
  end
end
