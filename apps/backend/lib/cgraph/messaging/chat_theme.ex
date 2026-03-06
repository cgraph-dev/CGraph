defmodule CGraph.Messaging.ChatTheme do
  @moduledoc """
  Per-user, per-conversation chat themes.

  Users can customise the look of any conversation with background
  colours, bubble styles, text colours, and optional wallpaper URLs.
  Ten built-in preset themes are available.
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias CGraph.Repo

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "chat_themes" do
    field :theme, :map, default: %{}

    belongs_to :user, CGraph.Accounts.User
    belongs_to :conversation, CGraph.Messaging.Conversation

    timestamps()
  end

  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(ct, attrs) do
    ct
    |> cast(attrs, [:theme, :user_id, :conversation_id])
    |> validate_required([:theme, :user_id, :conversation_id])
    |> validate_theme()
    |> unique_constraint([:user_id, :conversation_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:conversation_id)
  end

  defp validate_theme(changeset) do
    validate_change(changeset, :theme, fn :theme, theme ->
      hex_re = ~r/^#[0-9a-fA-F]{6}$/

      errors =
        Enum.flat_map(~w(bg_color bubble_color text_color), fn key ->
          case Map.get(theme, key) do
            nil -> []
            val when is_binary(val) ->
              if Regex.match?(hex_re, val), do: [], else: [{:theme, "#{key} must be a valid hex color"}]
            _ -> [{:theme, "#{key} must be a string"}]
          end
        end)

      errors
    end)
  end

  # ── Presets ──────────────────────────────────────────

  @presets %{
    "midnight"  => %{"bg_color" => "#0d1117", "bubble_color" => "#161b22", "text_color" => "#c9d1d9"},
    "ocean"     => %{"bg_color" => "#0a192f", "bubble_color" => "#112240", "text_color" => "#8892b0"},
    "forest"    => %{"bg_color" => "#1a2e1a", "bubble_color" => "#2d4a2d", "text_color" => "#a8d5a8"},
    "sunset"    => %{"bg_color" => "#2d1b2e", "bubble_color" => "#4a2c4d", "text_color" => "#e8b4cb"},
    "lavender"  => %{"bg_color" => "#2b2040", "bubble_color" => "#3d2e5c", "text_color" => "#c4b5d9"},
    "minimal"   => %{"bg_color" => "#ffffff", "bubble_color" => "#f0f0f0", "text_color" => "#333333"},
    "dark"      => %{"bg_color" => "#1e1e1e", "bubble_color" => "#2d2d2d", "text_color" => "#d4d4d4"},
    "light"     => %{"bg_color" => "#fafafa", "bubble_color" => "#e8e8e8", "text_color" => "#1a1a1a"},
    "neon"      => %{"bg_color" => "#0a0a0a", "bubble_color" => "#1a1a2e", "text_color" => "#00ff88"},
    "pastel"    => %{"bg_color" => "#fef0f0", "bubble_color" => "#e8f4f8", "text_color" => "#5a5a7a"}
  }

  @doc "Return map of all 10 preset themes."
  @spec list_preset_themes() :: map()
  def list_preset_themes, do: @presets

  # ── Public API ──────────────────────────────────────────

  @doc "Set (upsert) a theme for a user + conversation."
  @spec set_theme(String.t(), String.t(), map()) ::
          {:ok, %__MODULE__{}} | {:error, Ecto.Changeset.t()}
  def set_theme(user_id, conversation_id, theme_map) do
    attrs = %{user_id: user_id, conversation_id: conversation_id, theme: theme_map}

    case get_record(user_id, conversation_id) do
      nil ->
        %__MODULE__{}
        |> changeset(attrs)
        |> Repo.insert()

      existing ->
        existing
        |> changeset(%{theme: theme_map})
        |> Repo.update()
    end
  end

  @doc "Get a user's theme for a conversation (or nil)."
  @spec get_theme(String.t(), String.t()) :: %__MODULE__{} | nil
  def get_theme(user_id, conversation_id) do
    get_record(user_id, conversation_id)
  end

  @doc "Delete (reset to default) a user's theme for a conversation."
  @spec delete_theme(String.t(), String.t()) :: :ok
  def delete_theme(user_id, conversation_id) do
    case get_record(user_id, conversation_id) do
      nil -> :ok
      record -> Repo.delete(record) && :ok
    end
  end

  defp get_record(user_id, conversation_id) do
    from(ct in __MODULE__,
      where: ct.user_id == ^user_id,
      where: ct.conversation_id == ^conversation_id
    )
    |> Repo.one()
  end
end
