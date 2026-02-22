defmodule CGraph.Referrals do
  @moduledoc """
  Context for Referral system.
  Handles referral codes, tracking, rewards, and leaderboards.

  ## Features
  - Referral code generation
  - Referral tracking
  - Reward tiers
  - Leaderboards
  - Analytics
  """

  import Ecto.Query, warn: false
  alias CGraph.Accounts.User
  alias CGraph.Referrals.{Referral, ReferralCode, ReferralReward, RewardTier}
  alias CGraph.Repo
  alias Ecto.Adapters.SQL

  # ========================================
  # REFERRAL CODE
  # ========================================

  @doc """
  Get or create a referral code for a user.
  """
  @spec get_or_create_code(Ecto.UUID.t()) :: {:ok, ReferralCode.t()} | {:error, Ecto.Changeset.t()}
  def get_or_create_code(user_id) do
    case Repo.get_by(ReferralCode, user_id: user_id) do
      nil -> create_code(user_id)
      code -> {:ok, code}
    end
  end

  defp create_code(user_id) do
    code = generate_unique_code()

    %ReferralCode{}
    |> ReferralCode.changeset(%{user_id: user_id, code: code})
    |> Repo.insert()
  end

  defp generate_unique_code do
    code =
      :crypto.strong_rand_bytes(6)
      |> Base.encode32(case: :upper)
      |> String.slice(0..7)

    # Ensure uniqueness
    if Repo.get_by(ReferralCode, code: code) do
      generate_unique_code()
    else
      code
    end
  end

  @doc """
  Regenerate a referral code.
  """
  @spec regenerate_code(Ecto.UUID.t()) :: {:ok, ReferralCode.t()} | {:error, Ecto.Changeset.t()}
  def regenerate_code(user_id) do
    case Repo.get_by(ReferralCode, user_id: user_id) do
      nil ->
        create_code(user_id)

      existing ->
        existing
        |> ReferralCode.changeset(%{code: generate_unique_code()})
        |> Repo.update()
    end
  end

  @doc """
  Get the owner (user_id) of a referral code.
  Used for self-referral prevention checks.
  """
  @spec get_code_owner(String.t()) :: {:ok, Ecto.UUID.t()} | {:error, :not_found}
  def get_code_owner(code) do
    query =
      from rc in ReferralCode,
        where: rc.code == ^code,
        select: rc.user_id

    case Repo.one(query) do
      nil -> {:error, :not_found}
      user_id -> {:ok, user_id}
    end
  end

  @doc """
  Validate a referral code.
  """
  @spec validate_code(String.t()) :: {:ok, map()} | {:error, :invalid_code}
  def validate_code(code) do
    query =
      from rc in ReferralCode,
        where: rc.code == ^code and rc.is_active == true,
        join: u in User,
        on: u.id == rc.user_id,
        select: %{
          id: u.id,
          username: u.username,
          display_name: u.display_name,
          avatar: u.avatar_url
        }

    case Repo.one(query) do
      nil -> {:error, :invalid_code}
      referrer -> {:ok, referrer}
    end
  end

  @doc """
  Apply a referral code for a new user.
  """
  @spec apply_code(Ecto.UUID.t(), String.t()) :: {:ok, Referral.t()} | {:error, atom() | Ecto.Changeset.t()}
  def apply_code(user_id, code) do
    with {:ok, code_record} <- get_code_by_value(code),
         :ok <- validate_not_self(user_id, code_record.user_id),
         :ok <- validate_not_already_referred(user_id) do
      attrs = %{
        referrer_id: code_record.user_id,
        referred_id: user_id,
        code_used: code,
        status: "pending"
      }

      %Referral{}
      |> Referral.changeset(attrs)
      |> Repo.insert()
    end
  end

  defp get_code_by_value(code) do
    case Repo.get_by(ReferralCode, code: code, is_active: true) do
      nil -> {:error, :invalid_code}
      record -> {:ok, record}
    end
  end

  defp validate_not_self(user_id, referrer_id) do
    if user_id == referrer_id do
      {:error, :cannot_refer_self}
    else
      :ok
    end
  end

  defp validate_not_already_referred(user_id) do
    existing = Repo.get_by(Referral, referred_id: user_id)
    if existing do
      {:error, :already_referred}
    else
      :ok
    end
  end

  # ========================================
  # REFERRAL LISTING
  # ========================================

  @doc """
  List referrals made by a user.
  """
  @spec list_referrals(Ecto.UUID.t(), keyword() | map()) :: {[Referral.t()], map()}
  def list_referrals(user_id, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    status = Keyword.get(opts, :status)

    base_query =
      from r in Referral,
        where: r.referrer_id == ^user_id,
        preload: [:referred_user]

    base_query =
      if status do
        from r in base_query, where: r.status == ^status
      else
        base_query
      end

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :desc,
      default_limit: 20
    )

    CGraph.Pagination.paginate(base_query, pagination_opts)
  end

  @doc """
  List pending referrals.
  """
  @spec list_pending_referrals(Ecto.UUID.t(), keyword() | map()) :: {[Referral.t()], map()}
  def list_pending_referrals(user_id, opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    list_referrals(user_id, Keyword.put(opts, :status, "pending"))
  end

  # ========================================
  # STATISTICS
  # ========================================

  @doc """
  Get referral statistics for a user.
  """
  @spec get_user_stats(Ecto.UUID.t()) :: map()
  def get_user_stats(user_id) do
    total_referrals =
      from(r in Referral, where: r.referrer_id == ^user_id)
      |> Repo.aggregate(:count, :id)

    pending_referrals =
      from(r in Referral, where: r.referrer_id == ^user_id and r.status == "pending")
      |> Repo.aggregate(:count, :id)

    confirmed_referrals =
      from(r in Referral, where: r.referrer_id == ^user_id and r.status == "confirmed")
      |> Repo.aggregate(:count, :id)

    total_rewards =
      from(rr in ReferralReward, where: rr.user_id == ^user_id and rr.status == "claimed")
      |> Repo.aggregate(:count, :id)

    # Get this month's referrals
    start_of_month = Date.utc_today() |> Date.beginning_of_month()
    referrals_this_month =
      from(r in Referral,
        where: r.referrer_id == ^user_id and fragment("?::date >= ?", r.inserted_at, ^start_of_month)
      )
      |> Repo.aggregate(:count, :id)

    # Get this week's referrals
    start_of_week = Date.utc_today() |> Date.beginning_of_week(:monday)
    referrals_this_week =
      from(r in Referral,
        where: r.referrer_id == ^user_id and fragment("?::date >= ?", r.inserted_at, ^start_of_week)
      )
      |> Repo.aggregate(:count, :id)

    # Get user's rank
    rank = get_user_rank(user_id)

    # Get current tier
    current_tier = get_current_tier(confirmed_referrals)

    %{
      total_referrals: total_referrals,
      pending_referrals: pending_referrals,
      confirmed_referrals: confirmed_referrals,
      total_rewards_earned: total_rewards,
      current_tier: current_tier,
      next_tier_progress: calculate_tier_progress(confirmed_referrals, current_tier),
      referrals_this_month: referrals_this_month,
      referrals_this_week: referrals_this_week,
      rank: rank
    }
  end

  defp get_user_rank(user_id) do
    query = """
    SELECT rank FROM (
      SELECT referrer_id, RANK() OVER (ORDER BY COUNT(*) DESC) as rank
      FROM referrals
      WHERE status = 'confirmed'
      GROUP BY referrer_id
    ) ranked WHERE referrer_id = $1
    """

    case SQL.query(Repo, query, [Ecto.UUID.dump!(user_id)]) do
      {:ok, %{rows: [[rank]]}} -> rank
      _ -> nil
    end
  end

  defp get_current_tier(confirmed_count) do
    tiers = list_reward_tiers_internal()

    tiers
    |> Enum.filter(fn tier -> tier.required_referrals <= confirmed_count end)
    |> Enum.max_by(fn tier -> tier.required_referrals end, fn -> nil end)
  end

  defp calculate_tier_progress(confirmed_count, nil) do
    tiers = list_reward_tiers_internal()
    case Enum.min_by(tiers, & &1.required_referrals, fn -> nil end) do
      nil -> 0
      next_tier -> min(100, round(confirmed_count / next_tier.required_referrals * 100))
    end
  end

  defp calculate_tier_progress(confirmed_count, current_tier) do
    tiers = list_reward_tiers_internal()
    next_tier =
      tiers
      |> Enum.filter(fn tier -> tier.required_referrals > current_tier.required_referrals end)
      |> Enum.min_by(& &1.required_referrals, fn -> nil end)

    case next_tier do
      nil -> 100
      tier ->
        progress_in_tier = confirmed_count - current_tier.required_referrals
        tier_range = tier.required_referrals - current_tier.required_referrals
        min(100, round(progress_in_tier / tier_range * 100))
    end
  end

  # ========================================
  # LEADERBOARD
  # ========================================

  @doc """
  Get referral leaderboard.
  """
  @spec get_leaderboard(keyword() | map()) :: [map()]
  def get_leaderboard(opts \\ []) do
    opts = if is_map(opts), do: Map.to_list(opts), else: opts
    period = Keyword.get(opts, :period, "all")
    limit = Keyword.get(opts, :limit, 10)

    base_query =
      from r in Referral,
        where: r.status == "confirmed",
        join: u in User,
        on: u.id == r.referrer_id,
        group_by: [r.referrer_id, u.id, u.username, u.display_name, u.avatar_url],
        order_by: [desc: count(r.id)],
        limit: ^limit,
        select: %{
          user_id: r.referrer_id,
          username: u.username,
          display_name: u.display_name,
          avatar: u.avatar_url,
          referral_count: count(r.id)
        }

    query = apply_period_filter(base_query, period)
    Repo.all(query)
  end

  defp apply_period_filter(query, "all"), do: query
  defp apply_period_filter(query, "month") do
    start_of_month = Date.utc_today() |> Date.beginning_of_month()
    from r in query, where: fragment("?::date >= ?", r.inserted_at, ^start_of_month)
  end
  defp apply_period_filter(query, "week") do
    start_of_week = Date.utc_today() |> Date.beginning_of_week(:monday)
    from r in query, where: fragment("?::date >= ?", r.inserted_at, ^start_of_week)
  end
  defp apply_period_filter(query, _), do: query

  # ========================================
  # REWARDS
  # ========================================

  @doc """
  List reward tiers with user progress.
  """
  @spec list_reward_tiers(Ecto.UUID.t()) :: [map()]
  def list_reward_tiers(user_id) do
    tiers = list_reward_tiers_internal()

    confirmed_count =
      from(r in Referral, where: r.referrer_id == ^user_id and r.status == "confirmed")
      |> Repo.aggregate(:count, :id)

    claimed_tier_ids =
      from(rr in ReferralReward, where: rr.user_id == ^user_id, select: rr.tier_id)
      |> Repo.all()
      |> MapSet.new()

    Enum.map(tiers, fn tier ->
      %{
        id: tier.id,
        name: tier.name,
        description: tier.description,
        required_referrals: tier.required_referrals,
        reward_type: tier.reward_type,
        reward_value: tier.reward_value,
        icon: tier.icon,
        unlocked: confirmed_count >= tier.required_referrals,
        claimed: MapSet.member?(claimed_tier_ids, tier.id),
        progress: min(100, round(confirmed_count / tier.required_referrals * 100))
      }
    end)
  end

  defp list_reward_tiers_internal do
    from(rt in RewardTier, order_by: [asc: rt.required_referrals])
    |> Repo.all()
  end

  @doc """
  Claim a reward.
  """
  @spec claim_reward(Ecto.UUID.t(), Ecto.UUID.t()) :: {:ok, ReferralReward.t()} | {:error, atom()}
  def claim_reward(user_id, tier_id) do
    with {:ok, tier} <- get_reward_tier(tier_id),
         :ok <- validate_can_claim(user_id, tier) do
      attrs = %{
        user_id: user_id,
        tier_id: tier_id,
        status: "claimed"
      }

      %ReferralReward{}
      |> ReferralReward.changeset(attrs)
      |> Repo.insert()
    end
  end

  defp get_reward_tier(tier_id) do
    case Repo.get(RewardTier, tier_id) do
      nil -> {:error, :tier_not_found}
      tier -> {:ok, tier}
    end
  end

  defp validate_can_claim(user_id, tier) do
    # Check confirmed referral count
    confirmed_count =
      from(r in Referral, where: r.referrer_id == ^user_id and r.status == "confirmed")
      |> Repo.aggregate(:count, :id)

    if confirmed_count < tier.required_referrals do
      {:error, :not_enough_referrals}
    else
      # Check if already claimed
      existing = Repo.get_by(ReferralReward, user_id: user_id, tier_id: tier.id)
      if existing do
        {:error, :already_claimed}
      else
        :ok
      end
    end
  end

  # ========================================
  # CONFIRMATION
  # ========================================

  @doc """
  Confirm a referral (e.g., after referred user completes an action).
  """
  @spec confirm_referral(Ecto.UUID.t()) :: {:ok, Referral.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def confirm_referral(referral_id) do
    case Repo.get(Referral, referral_id) do
      nil ->
        {:error, :not_found}

      referral ->
        referral
        |> Referral.changeset(%{
          status: "confirmed",
          confirmed_at: DateTime.utc_now()
        })
        |> Repo.update()
    end
  end
end
