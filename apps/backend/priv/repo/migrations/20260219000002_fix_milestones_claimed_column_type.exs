defmodule CGraph.Repo.Migrations.FixMilestonesClaimedColumnType do
  @moduledoc """
  Fixes milestones_claimed column type mismatch.

  The original migration (20260118000002) created milestones_claimed as
  integer[] but all application code (EventsController, EventRewardDistributor)
  stores string reward IDs like "reward-5". The Ecto schema also declared
  {:array, :string}. This caused a Postgrex encode error at runtime.

  Fix: ALTER COLUMN from integer[] to text[] to match application semantics.
  """
  use Ecto.Migration

  def up do
    # Drop default, alter type, re-add default
    execute """
    ALTER TABLE user_event_progress
    ALTER COLUMN milestones_claimed DROP DEFAULT,
    ALTER COLUMN milestones_claimed TYPE text[]
      USING milestones_claimed::text[],
    ALTER COLUMN milestones_claimed SET DEFAULT '{}'::text[];
    """
  end

  def down do
    execute """
    ALTER TABLE user_event_progress
    ALTER COLUMN milestones_claimed DROP DEFAULT,
    ALTER COLUMN milestones_claimed TYPE integer[]
      USING milestones_claimed::integer[],
    ALTER COLUMN milestones_claimed SET DEFAULT '{}'::integer[];
    """
  end
end
