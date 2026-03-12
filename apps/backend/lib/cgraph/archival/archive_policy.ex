defmodule CGraph.Archival.ArchivePolicy do
  @moduledoc """
  Defines an archive policy — the rules for when and how data
  gets moved from a live table to its archive counterpart.

  ## Fields

  | Field             | Type      | Default | Description                              |
  |-------------------|-----------|---------|------------------------------------------|
  | `name`            | atom      | —       | Unique policy identifier                 |
  | `days_threshold`  | integer   | 365     | Age in days before archival              |
  | `target_table`    | string    | —       | Source table (e.g. `"messages"`)         |
  | `archive_table`   | string    | —       | Destination table (e.g. `"archive_messages"`) |
  | `timestamp_column`| atom      | `:inserted_at` | Column to measure age against     |
  | `batch_size`      | integer   | 1000    | Rows moved per batch                     |
  | `conditions`      | keyword   | `[]`    | Extra WHERE conditions (Ecto fragments)  |
  | `enabled`         | boolean   | true    | Whether the policy is active             |

  ## Example

      %ArchivePolicy{
        name: :old_messages,
        days_threshold: 365,
        target_table: "messages",
        archive_table: "archive_messages",
        batch_size: 1000
      }
  """

  @type t :: %__MODULE__{
          name: atom(),
          days_threshold: pos_integer(),
          target_table: String.t(),
          archive_table: String.t(),
          timestamp_column: atom(),
          batch_size: pos_integer(),
          conditions: keyword(),
          enabled: boolean()
        }

  @enforce_keys [:name, :target_table, :archive_table]
  defstruct name: nil,
            days_threshold: 365,
            target_table: nil,
            archive_table: nil,
            timestamp_column: :inserted_at,
            batch_size: 1000,
            conditions: [],
            enabled: true

  @doc """
  Returns the built-in archive policies.
  """
  @spec default_policies() :: [t()]
  def default_policies do
    [
      %__MODULE__{
        name: :old_messages,
        days_threshold: 365,
        target_table: "messages",
        archive_table: "archive_messages",
        timestamp_column: :inserted_at,
        batch_size: 1000
      },
      %__MODULE__{
        name: :old_forum_posts,
        days_threshold: 365,
        target_table: "posts",
        archive_table: "archive_forum_posts",
        timestamp_column: :inserted_at,
        batch_size: 1000
      }
    ]
  end

  @doc """
  Compute the cutoff datetime for a policy.
  """
  @spec cutoff(%__MODULE__{}) :: DateTime.t()
  def cutoff(%__MODULE__{days_threshold: days}) do
    DateTime.utc_now() |> DateTime.add(-days * 86_400)
  end
end
