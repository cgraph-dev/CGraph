defmodule Cgraph.Forums.ForumAnnouncement do
  @moduledoc """
  Forum announcement schema - announcements displayed at the top of forums/boards.
  Supports global announcements, board-specific announcements, and scheduling.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "forum_announcements" do
    field :title, :string
    field :content, :string
    field :is_global, :boolean, default: false  # shown on all boards
    field :is_active, :boolean, default: true
    field :priority, :integer, default: 0  # higher = shown first
    
    # Display settings
    field :style, :string, default: "info"  # info, warning, success, danger
    field :dismissible, :boolean, default: true
    field :show_icon, :boolean, default: true
    
    # Scheduling
    field :start_date, :utc_datetime_usec
    field :end_date, :utc_datetime_usec
    
    # Targeting
    field :target_groups, {:array, :string}, default: []  # empty = all groups
    
    # Stats
    field :view_count, :integer, default: 0
    field :dismiss_count, :integer, default: 0
    
    belongs_to :forum, Cgraph.Forums.Forum
    belongs_to :board, Cgraph.Forums.Board  # nil if global or forum-wide
    belongs_to :author, Cgraph.Accounts.User

    timestamps()
  end

  def changeset(announcement, attrs) do
    announcement
    |> cast(attrs, [
      :title, :content, :is_global, :is_active, :priority,
      :style, :dismissible, :show_icon,
      :start_date, :end_date, :target_groups,
      :forum_id, :board_id, :author_id
    ])
    |> validate_required([:title, :content, :forum_id, :author_id])
    |> validate_inclusion(:style, ["info", "warning", "success", "danger"])
    |> validate_dates()
    |> foreign_key_constraint(:forum_id)
    |> foreign_key_constraint(:board_id)
    |> foreign_key_constraint(:author_id)
  end

  defp validate_dates(changeset) do
    start_date = get_field(changeset, :start_date)
    end_date = get_field(changeset, :end_date)

    cond do
      is_nil(start_date) or is_nil(end_date) ->
        changeset

      DateTime.compare(end_date, start_date) == :lt ->
        add_error(changeset, :end_date, "must be after start date")

      true ->
        changeset
    end
  end

  @doc """
  Checks if the announcement should be displayed based on dates.
  """
  def active?(%__MODULE__{is_active: false}), do: false
  def active?(%__MODULE__{start_date: nil, end_date: nil, is_active: true}), do: true
  def active?(%__MODULE__{start_date: start_date, end_date: end_date, is_active: true}) do
    now = DateTime.utc_now()
    
    after_start = is_nil(start_date) or DateTime.compare(now, start_date) in [:gt, :eq]
    before_end = is_nil(end_date) or DateTime.compare(now, end_date) in [:lt, :eq]
    
    after_start and before_end
  end
end
