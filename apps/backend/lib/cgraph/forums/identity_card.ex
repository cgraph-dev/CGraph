defmodule CGraph.Forums.IdentityCard do
  @moduledoc """
  Identity card schema for forum users.

  Each user has a single identity card that aggregates their cosmetic
  customizations (avatar frame, badges, title) and forum profile info
  (display name, bio, reputation) for rendering on posts and profiles.

  The identity card is snapshotted onto `thread_posts` at creation time
  so that historical posts preserve the author's appearance at the time
  of writing.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  @derive {Jason.Encoder,
           only: [
             :id,
             :user_id,
             :display_name,
             :avatar_frame_id,
             :badge_ids,
             :title_id,
             :bio_snippet,
             :reputation_score,
             :custom_css
           ]}

  schema "identity_cards" do
    field :display_name, :string
    field :avatar_frame_id, :binary_id
    field :badge_ids, {:array, :binary_id}, default: []
    field :title_id, :binary_id
    field :bio_snippet, :string
    field :reputation_score, :integer, default: 0
    field :custom_css, :map, default: %{}

    belongs_to :user, CGraph.Accounts.User

    timestamps()
  end

  @required_fields [:user_id, :display_name]
  @optional_fields [
    :avatar_frame_id,
    :badge_ids,
    :title_id,
    :bio_snippet,
    :reputation_score,
    :custom_css
  ]

  @doc """
  Changeset for creating a new identity card.
  """
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(identity_card, attrs) do
    identity_card
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:display_name, min: 1, max: 32)
    |> validate_length(:bio_snippet, max: 140)
    |> unique_constraint(:user_id)
    |> foreign_key_constraint(:user_id)
  end

  @doc """
  Changeset for updating an existing identity card.
  """
  @spec update_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def update_changeset(identity_card, attrs) do
    identity_card
    |> cast(attrs, @optional_fields ++ [:display_name])
    |> validate_length(:display_name, min: 1, max: 32)
    |> validate_length(:bio_snippet, max: 140)
  end

  @doc """
  Returns a snapshot map of the identity card for embedding in post metadata.
  """
  @spec to_snapshot(%__MODULE__{}) :: map()
  def to_snapshot(%__MODULE__{} = card) do
    %{
      display_name: card.display_name,
      avatar_frame_id: card.avatar_frame_id,
      badge_ids: card.badge_ids || [],
      title_id: card.title_id,
      bio_snippet: card.bio_snippet,
      reputation_score: card.reputation_score,
      custom_css: card.custom_css || %{}
    }
  end
end
