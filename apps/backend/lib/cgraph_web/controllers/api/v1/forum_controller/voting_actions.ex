defmodule CGraphWeb.API.V1.ForumController.VotingActions do
  @moduledoc """
  Helper module for forum voting actions.

  Handles upvoting, downvoting, getting votes, and removing votes on forums.
  Includes security measures such as account-age checks, karma requirements,
  cooldowns, and self-vote prevention.
  """
  import Plug.Conn
  import Phoenix.Controller
  import CGraphWeb.Helpers.ParamParser

  alias CGraph.Forums
  alias CGraphWeb.ErrorHelpers

  @doc """
  Vote on a forum.
  POST /api/v1/forums/:id/vote
  Body: { "value": 1 } for upvote, { "value": -1 } for downvote

  Security measures:
  - Account must be at least 1 day old
  - Downvoting requires 10+ karma
  - Vote changes have 60s cooldown
  - Cannot vote on own forums or forums you moderate
  """
  @spec vote(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def vote(conn, %{"id" => forum_id, "value" => value}) when value in [1, -1, "1", "-1"] do
    user = conn.assigns.current_user
    # Safe parsing - only allow 1 or -1, default to 0 (invalid) if parsing fails
    vote_value = parse_int(value, 0, min: -1, max: 1)

    # Reject if parsed value is 0 (invalid vote)
    if vote_value == 0 do
      conn
      |> put_status(:unprocessable_entity)
      |> json(%{error: "value must be 1 (upvote) or -1 (downvote)"})
    else
      with {:ok, forum} <- Forums.get_forum(forum_id),
           :ok <- Forums.authorize_action(user, forum, :vote) do
        case Forums.vote_forum(user, forum_id, vote_value) do
        {:ok, result} ->
          {:ok, updated_forum} = Forums.get_forum_with_vote(forum_id, user.id)
          conn
          |> put_status(:ok)
          |> json(%{
            result: result,
            forum: %{
              id: updated_forum.id,
              score: updated_forum.score,
              upvotes: updated_forum.upvotes,
              downvotes: updated_forum.downvotes,
              user_vote: updated_forum.user_vote
            }
          })

        {:error, :account_too_new} ->
          conn
          |> put_status(:forbidden)
          |> json(%{error: "Your account must be at least 1 day old to vote"})

        {:error, :insufficient_karma_for_downvote} ->
          conn
          |> put_status(:forbidden)
          |> json(%{error: "You need at least 10 karma to downvote forums"})

        {:error, :cannot_vote_own_forum} ->
          conn
          |> put_status(:forbidden)
          |> json(%{error: "You cannot vote on your own forums"})

        {:error, :moderators_cannot_vote} ->
          conn
          |> put_status(:forbidden)
          |> json(%{error: "Moderators cannot vote on forums they moderate"})

        {:error, {:vote_cooldown, remaining}} ->
          conn
          |> put_status(:too_many_requests)
          |> json(%{error: "Please wait #{remaining} seconds before changing your vote"})

        {:error, reason} ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{error: ErrorHelpers.safe_error_message(reason, context: "forum_vote")})
        end
      else
        {:error, :not_found} ->
          conn
          |> put_status(:not_found)
          |> json(%{error: "Forum not found"})

        {:error, :unauthorized} ->
          conn
          |> put_status(:forbidden)
          |> json(%{error: "Not authorized to vote on this forum"})

        _ ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{error: "Unable to process vote"})
      end
    end
  end

  @spec vote(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def vote(conn, %{"id" => _forum_id}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: "value must be 1 (upvote) or -1 (downvote)"})
  end

  @doc """
  Get user's vote on a forum.
  GET /api/v1/forums/:id/vote
  """
  @spec get_vote(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get_vote(conn, %{"id" => forum_id}) do
    user = conn.assigns.current_user

    vote = Forums.get_user_forum_vote(user.id, forum_id)
    user_vote = if vote, do: vote.value, else: 0

    conn
    |> put_status(:ok)
    |> json(%{user_vote: user_vote})
  end

  @doc """
  Remove vote on a forum.
  DELETE /api/v1/forums/:id/vote
  """
  @spec remove_vote(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def remove_vote(conn, %{"id" => forum_id}) do
    user = conn.assigns.current_user

    case Forums.get_user_forum_vote(user.id, forum_id) do
      nil ->
        conn
        |> put_status(:ok)
        |> json(%{result: :no_vote})

      vote ->
        with {:ok, _} <- Forums.vote_forum(user, forum_id, vote.value) do
          conn
          |> put_status(:ok)
          |> json(%{result: :removed})
        end
    end
  end
end
