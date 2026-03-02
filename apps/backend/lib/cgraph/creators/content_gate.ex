defmodule CGraph.Creators.ContentGate do
  @moduledoc """
  Content gating logic for paid forums.

  When a forum has `monetization_enabled: true`, threads are gated by default.
  Non-subscribers only see the title and a teaser (first 200 chars).
  Forum owners can also mark individual threads as `access: "free"` to allow
  public viewing even in paid forums.

  ## Usage in Controllers

      case ContentGate.gate_thread(thread, forum, current_user) do
        {:ok, :full_access} -> render full thread
        {:ok, :gated, teaser_data} -> render gated view with teaser
      end
  """

  alias CGraph.Creators.PaidSubscription
  alias CGraph.Forums.Forum

  @teaser_length 200

  @doc """
  Determines whether a thread should be gated for the given user.

  Returns:
  - `{:ok, :full_access}` — user can see full content
  - `{:ok, :gated, teaser_data}` — user sees gated view
  """
  @spec gate_thread(map(), Forum.t(), map() | nil) :: {:ok, :full_access} | {:ok, :gated, map()}
  def gate_thread(thread, forum, current_user) do
    cond do
      # Forum is not monetized — always full access
      !forum.monetization_enabled ->
        {:ok, :full_access}

      # Thread explicitly marked as free
      Map.get(thread, :access) == "free" ->
        {:ok, :full_access}

      # Forum owner always has access
      current_user && current_user.id == forum.owner_id ->
        {:ok, :full_access}

      # Subscriber has access
      current_user && PaidSubscription.has_active_subscription?(current_user.id, forum.id) ->
        {:ok, :full_access}

      # Not subscribed — gated
      true ->
        {:ok, :gated, build_teaser(thread, forum)}
    end
  end

  @doc """
  Annotates a list of threads with gating info for the current user.
  Returns threads with an `is_gated` boolean added.
  """
  @spec annotate_threads([map()], Forum.t(), map() | nil) :: [map()]
  def annotate_threads(threads, forum, current_user) do
    has_access = has_full_access?(forum, current_user)

    Enum.map(threads, fn thread ->
      is_gated = !has_access && forum.monetization_enabled && Map.get(thread, :access) != "free"
      Map.put(thread, :is_gated, is_gated)
    end)
  end

  @doc "Checks whether a user has full access to a paid forum's content."
  @spec has_full_access?(Forum.t(), map() | nil) :: boolean()
  def has_full_access?(forum, nil), do: !forum.monetization_enabled
  def has_full_access?(%Forum{monetization_enabled: false}, _user), do: true
  def has_full_access?(%Forum{owner_id: owner_id}, %{id: user_id}) when owner_id == user_id, do: true
  def has_full_access?(%Forum{id: forum_id}, %{id: user_id}) do
    PaidSubscription.has_active_subscription?(user_id, forum_id)
  end

  # ── Private ──────────────────────────────────────────────────────

  defp build_teaser(thread, forum) do
    body = Map.get(thread, :body) || Map.get(thread, :content) || ""
    teaser = String.slice(body, 0, @teaser_length)

    price_display =
      if forum.subscription_price_cents do
        "$#{format_cents(forum.subscription_price_cents)}/mo"
      else
        nil
      end

    %{
      gated: true,
      title: Map.get(thread, :title),
      teaser: teaser,
      subscribe_url: "/forums/#{forum.id}/subscribe",
      price_display: price_display,
      forum_name: forum.name
    }
  end

  defp format_cents(cents) when is_integer(cents) do
    dollars = div(cents, 100)
    remainder = rem(cents, 100)
    "#{dollars}.#{String.pad_leading("#{remainder}", 2, "0")}"
  end
end
