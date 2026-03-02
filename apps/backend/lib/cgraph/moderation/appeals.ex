defmodule CGraph.Moderation.Appeals do
  @moduledoc """
  Appeal creation and review for moderation actions.

  Users who have been warned, suspended, or banned can file an appeal.
  Staff can then approve (lifting the restriction) or deny appeals.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.User
  alias CGraph.Moderation.Appeal
  alias CGraph.Moderation.Enforcement
  alias CGraph.Moderation.Report
  alias CGraph.Moderation.ReviewAction
  alias CGraph.Moderation.UserRestriction
  alias CGraph.Repo

  # ---------------------------------------------------------------------------
  # Appeals
  # ---------------------------------------------------------------------------

  @doc """
  List pending appeals.
  """
  @spec list_appeals(keyword()) :: [Appeal.t()]
  def list_appeals(opts \\ []) do
    limit = Keyword.get(opts, :limit, 50)

    from(a in Appeal,
      where: a.status == :pending,
      order_by: [asc: a.inserted_at],
      limit: ^limit,
      preload: [:user, review_action: :report]
    )
    |> Repo.all()
  end

  @doc """
  Create an appeal for a moderation action.
  """
  @spec create_appeal(User.t(), String.t(), map()) :: {:ok, Appeal.t()} | {:error, term()}
  def create_appeal(%User{} = user, action_id, attrs) do
    with {:ok, action} <- get_action_for_appeal(action_id, user),
         :ok <- check_appeal_eligibility(action, user) do
      %Appeal{}
      |> Appeal.changeset(%{
        user_id: user.id,
        review_action_id: action_id,
        reason: attrs[:reason],
        status: :pending
      })
      |> Repo.insert()
    end
  end

  @doc """
  Review an appeal (staff only).
  """
  @spec review_appeal(User.t(), String.t(), map()) :: {:ok, Appeal.t()} | {:error, term()}
  def review_appeal(%User{} = reviewer, appeal_id, attrs) do
    with {:ok, appeal} <- get_appeal(appeal_id),
         :ok <- Enforcement.validate_reviewer(reviewer) do

      status = if attrs[:approved], do: :approved, else: :denied

      result =
        appeal
        |> Ecto.Changeset.change(%{
          status: status,
          reviewer_id: reviewer.id,
          reviewer_notes: attrs[:notes],
          reviewed_at: DateTime.utc_now() |> DateTime.truncate(:second)
        })
        |> Repo.update()
        |> maybe_lift_restriction(status)

      # Send email notification for appeal outcome
      case result do
        {:ok, updated_appeal} ->
          %{appeal_id: updated_appeal.id, outcome: Atom.to_string(status)}
          |> CGraph.Workers.AppealNotificationWorker.new()
          |> Oban.insert()

          {:ok, updated_appeal}

        error ->
          error
      end
    end
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp get_action_for_appeal(action_id, user) do
    action = Repo.get(ReviewAction, action_id)
    report = action && Repo.get(Report, action.report_id)

    cond do
      is_nil(action) -> {:error, :not_found}
      is_nil(report) -> {:error, :not_found}
      report.target_id != user.id -> {:error, :unauthorized}
      true -> {:ok, action}
    end
  end

  defp check_appeal_eligibility(action, user) do
    # Check if appeal already exists
    exists? = Repo.exists?(
      from a in Appeal,
        where: a.review_action_id == ^action.id,
        where: a.user_id == ^user.id
    )

    if exists?, do: {:error, :already_appealed}, else: :ok
  end

  defp get_appeal(appeal_id) do
    case Repo.get(Appeal, appeal_id) do
      nil -> {:error, :not_found}
      appeal -> {:ok, appeal}
    end
  end

  defp maybe_lift_restriction({:ok, appeal}, :approved) do
    # Lift the user restriction
    action = Repo.get(ReviewAction, appeal.review_action_id)
    report = Repo.get(Report, action.report_id)

    from(r in UserRestriction,
      where: r.user_id == ^report.target_id,
      where: r.active == true
    )
    |> Repo.update_all(set: [active: false])

    {:ok, appeal}
  end
  defp maybe_lift_restriction(result, _), do: result
end
