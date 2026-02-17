defmodule CGraph.Forums.GroupAutoRule do
  @moduledoc """
  GroupAutoRule schema for automatic group assignment based on criteria.

  Allows forums to automatically promote users to groups when they meet criteria:
  - Milestone-based: post count, reputation, thread count
  - Time-based: member for X days
  - Subscription-based: paid tier members
  - Custom: arbitrary JSONB criteria

  ## Rule Evaluation
  Rules are evaluated in priority order (lower number = first).
  When criteria are met, the user is automatically added to the group.

  ## Example Criteria
  ```json
  {"min_posts": 100, "min_reputation": 50}
  {"member_since_days": 365}
  {"subscription_tier": "pro"}
  ```
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias CGraph.Forums.MemberSecondaryGroup

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @rule_types ["milestone", "time_based", "subscription", "custom"]
  @assign_as_values ["primary", "secondary"]

  @derive {Jason.Encoder, only: [
    :id, :name, :description, :rule_type, :is_active, :criteria,
    :priority, :assign_as, :notification_message
  ]}

  schema "group_auto_rules" do
    field :name, :string
    field :description, :string
    field :rule_type, :string
    field :is_active, :boolean, default: true
    field :criteria, :map, default: %{}
    field :priority, :integer, default: 0
    field :assign_as, :string, default: "secondary"
    field :notification_message, :string

    belongs_to :user_group, CGraph.Forums.ForumUserGroup

    timestamps()
  end

  @doc """
  Changeset for creating/updating an auto rule.
  """
  def changeset(rule, attrs) do
    rule
    |> cast(attrs, [
      :name, :description, :rule_type, :is_active, :criteria,
      :priority, :assign_as, :notification_message, :user_group_id
    ])
    |> validate_required([:name, :rule_type, :user_group_id])
    |> validate_inclusion(:rule_type, @rule_types)
    |> validate_inclusion(:assign_as, @assign_as_values)
    |> validate_criteria()
    |> foreign_key_constraint(:user_group_id)
  end

  defp validate_criteria(changeset) do
    case get_change(changeset, :criteria) do
      nil -> changeset
      criteria when is_map(criteria) -> changeset
      _ -> add_error(changeset, :criteria, "must be a map")
    end
  end

  # =============================================================================
  # QUERIES
  # =============================================================================

  @doc """
  Query for active rules for a group.
  """
  def for_group_query(group_id) do
    from r in __MODULE__,
      where: r.user_group_id == ^group_id and r.is_active == true,
      order_by: [asc: r.priority]
  end

  @doc """
  Query for all active rules in a forum.
  """
  def for_forum_query(forum_id) do
    from r in __MODULE__,
      join: g in CGraph.Forums.ForumUserGroup, on: g.id == r.user_group_id,
      where: g.forum_id == ^forum_id and r.is_active == true,
      order_by: [asc: r.priority],
      preload: [:user_group]
  end

  @doc """
  Query for rules of a specific type.
  """
  def by_type_query(rule_type) do
    from r in __MODULE__,
      where: r.rule_type == ^rule_type and r.is_active == true,
      order_by: [asc: r.priority]
  end

  # =============================================================================
  # RULE EVALUATION
  # =============================================================================

  @doc """
  Check if a member meets the criteria for a rule.
  Returns true if all criteria are met.
  """
  def meets_criteria?(rule, member) do
    case rule.rule_type do
      "milestone" -> check_milestone_criteria(rule.criteria, member)
      "time_based" -> check_time_criteria(rule.criteria, member)
      "subscription" -> check_subscription_criteria(rule.criteria, member)
      "custom" -> check_custom_criteria(rule.criteria, member)
      _ -> false
    end
  end

  defp check_milestone_criteria(criteria, member) do
    checks = [
      {:min_posts, &(&1.post_count >= &2)},
      {:min_threads, &(&1.thread_count >= &2)},
      {:min_reputation, &(&1.reputation >= &2)},
      {:min_reputation_positive, &(&1.reputation_positive >= &2)}
    ]

    Enum.all?(checks, fn {key, check_fn} ->
      case Map.get(criteria, to_string(key)) do
        nil -> true
        value -> check_fn.(member, value)
      end
    end)
  end

  defp check_time_criteria(criteria, member) do
    case Map.get(criteria, "member_since_days") do
      nil -> true
      days ->
        member_days = DateTime.diff(DateTime.utc_now(), member.joined_at, :day)
        member_days >= days
    end
  end

  @tier_hierarchy %{"free" => 0, "basic" => 1, "premium" => 2, "premium_plus" => 3}

  defp check_subscription_criteria(criteria, member) do
    case Map.get(criteria, "subscription_tier") do
      nil -> true
      required_tier ->
        # Check if member's subscription meets the required tier
        user_tier = member.user.subscription_tier || "free"
        tier_rank(user_tier) >= tier_rank(required_tier)
    end
  end

  defp tier_rank(tier), do: Map.get(@tier_hierarchy, tier, 0)

  defp check_custom_criteria(criteria, member) do
    # Evaluate custom criteria map with supported predicates
    Enum.all?(criteria, fn
      {"min_posts", min} ->
        (Map.get(member, :post_count, 0) || 0) >= min

      {"min_comments", min} ->
        (Map.get(member, :comment_count, 0) || 0) >= min

      {"min_karma", min} ->
        karma = get_in_user(member, :karma) || 0
        karma >= min

      {"min_level", min} ->
        level = get_in_user(member, :level) || 0
        level >= min

      {"joined_before_days", days} ->
        joined_at = get_in_user(member, :inserted_at)
        joined_at != nil and DateTime.diff(DateTime.utc_now(), joined_at, :day) >= days

      {"email_verified", required} ->
        verified = get_in_user(member, :email_verified) || false
        verified == required

      # Unknown criteria keys pass through (forward-compatible)
      _ -> true
    end)
  end

  defp get_in_user(member, field) do
    case member do
      %{user: %{^field => value}} -> value
      _ -> nil
    end
  end

  @doc """
  Evaluate all rules for a member and return groups to assign.
  """
  def evaluate_rules(member, rules) do
    rules
    |> Enum.filter(&meets_criteria?(&1, member))
    |> Enum.map(fn rule ->
      %{
        group_id: rule.user_group_id,
        assign_as: rule.assign_as,
        notification_message: rule.notification_message,
        rule: rule
      }
    end)
  end

  @doc """
  Apply automatic group assignments for a member.
  Returns {:ok, assigned_groups} or {:error, reason}.
  """
  def apply_auto_assignments(member, repo) do
    # Get the forum for this member
    member = repo.preload(member, [:forum])

    # Get all active rules for this forum
    rules =
      for_forum_query(member.forum_id)
      |> repo.all()

    # Evaluate which rules the member qualifies for
    assignments = evaluate_rules(member, rules)

    # Apply assignments
    results =
      Enum.map(assignments, fn assignment ->
        apply_assignment(member, assignment, repo)
      end)

    successful = Enum.filter(results, fn {status, _} -> status == :ok end)
    {:ok, successful}
  end

  defp apply_assignment(member, assignment, repo) do
    case assignment.assign_as do
      "primary" ->
        # Update primary group
        member
        |> Ecto.Changeset.change(%{user_group_id: assignment.group_id})
        |> repo.update()

      "secondary" ->
        # Add as secondary group (if not already assigned)
        existing =
          MemberSecondaryGroup.has_group_query(member.id, assignment.group_id)
          |> repo.one()

        if existing do
          {:ok, :already_assigned}
        else
          MemberSecondaryGroup.add_group(member.id, assignment.group_id,
            reason: "Auto-assigned by rule: #{assignment.rule.name}"
          )
          |> repo.insert()
        end
    end
  end

  # =============================================================================
  # BUILT-IN RULE TEMPLATES
  # =============================================================================

  @doc """
  Get built-in rule templates.
  """
  def rule_templates do
    [
      %{
        name: "Active Contributor",
        description: "Automatically promote users who have made 100+ posts",
        rule_type: "milestone",
        criteria: %{"min_posts" => 100}
      },
      %{
        name: "Thread Starter",
        description: "Promote users who have created 10+ threads",
        rule_type: "milestone",
        criteria: %{"min_threads" => 10}
      },
      %{
        name: "Reputation Master",
        description: "Promote users with 50+ positive reputation",
        rule_type: "milestone",
        criteria: %{"min_reputation" => 50}
      },
      %{
        name: "Veteran Member",
        description: "Promote users who have been members for 1 year",
        rule_type: "time_based",
        criteria: %{"member_since_days" => 365}
      },
      %{
        name: "Super Contributor",
        description: "Promote users with 500+ posts and 100+ reputation",
        rule_type: "milestone",
        criteria: %{"min_posts" => 500, "min_reputation" => 100}
      }
    ]
  end
end
