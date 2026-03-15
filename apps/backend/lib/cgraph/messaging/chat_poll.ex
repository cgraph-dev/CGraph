defmodule CGraph.Messaging.ChatPoll do
  @moduledoc """
  Schema and context for in-chat polls.

  Users can create polls with 2-10 options in any conversation.
  Supports single-choice and multiple-choice modes, optional
  anonymous voting and auto-close at a set time.
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias CGraph.Repo
  alias CGraph.Messaging.{ChatPollVote, ConversationParticipant}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "chat_polls" do
    field :question, :string
    field :options, {:array, :map}
    field :multiple_choice, :boolean, default: false
    field :anonymous, :boolean, default: false
    field :closes_at, :utc_datetime
    field :closed, :boolean, default: false

    belongs_to :conversation, CGraph.Messaging.Conversation
    belongs_to :creator, CGraph.Accounts.User
    has_many :votes, ChatPollVote, foreign_key: :poll_id

    timestamps()
  end

  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(poll, attrs) do
    poll
    |> cast(attrs, [:question, :options, :multiple_choice, :anonymous, :closes_at,
                    :closed, :conversation_id, :creator_id])
    |> validate_required([:question, :options, :conversation_id, :creator_id])
    |> validate_length(:question, max: 500)
    |> validate_options()
    |> foreign_key_constraint(:conversation_id)
    |> foreign_key_constraint(:creator_id)
  end

  defp validate_options(changeset) do
    validate_change(changeset, :options, fn :options, options ->
      cond do
        length(options) < 2 -> [options: "must have at least 2 options"]
        length(options) > 10 -> [options: "must have at most 10 options"]
        Enum.any?(options, &(not is_map(&1) or not Map.has_key?(&1, "text"))) ->
          [options: "each option must have a text field"]
        Enum.any?(options, &(String.length(Map.get(&1, "text", "")) > 100)) ->
          [options: "each option text must be at most 100 characters"]
        true -> []
      end
    end)
  end

  # ── Public API ──────────────────────────────────────────

  @doc "Create a poll in a conversation."
  @spec create_poll(String.t(), String.t(), String.t(), list(map()), keyword()) ::
          {:ok, %__MODULE__{}} | {:error, Ecto.Changeset.t() | atom()}
  def create_poll(creator_id, conversation_id, question, options, opts \\ []) do
    unless member?(creator_id, conversation_id) do
      {:error, :not_member}
    else
      # Generate IDs for options if not present
      options_with_ids = Enum.with_index(options, 1) |> Enum.map(fn {opt, idx} ->
        Map.put_new(opt, "id", "opt_#{idx}")
      end)

      attrs = %{
        creator_id: creator_id,
        conversation_id: conversation_id,
        question: question,
        options: options_with_ids,
        multiple_choice: Keyword.get(opts, :multiple_choice, false),
        anonymous: Keyword.get(opts, :anonymous, false),
        closes_at: Keyword.get(opts, :closes_at)
      }

      case Repo.insert(changeset(%__MODULE__{}, attrs)) do
        {:ok, poll} ->
          CGraphWeb.Endpoint.broadcast(
            "conversation:#{conversation_id}",
            "poll_created",
            %{poll: poll_data(poll)}
          )
          {:ok, poll}

        error ->
          error
      end
    end
  end

  @doc "Cast a vote on a poll."
  @spec vote(String.t(), String.t(), String.t()) :: {:ok, map()} | {:error, atom()}
  def vote(poll_id, user_id, option_id) do
    with {:ok, poll} <- fetch_open_poll(poll_id),
         :ok <- validate_option(poll, option_id) do
      result = cast_vote(poll, user_id, option_id)

      case result do
        {:ok, _} ->
          results = get_poll_results(poll_id)
          CGraphWeb.Endpoint.broadcast(
            "conversation:#{poll.conversation_id}",
            "poll_vote_updated",
            %{poll_id: poll_id, results: results}
          )
          {:ok, results}

        {:error, _} = err ->
          err
      end
    end
  end

  defp fetch_open_poll(poll_id) do
    case Repo.get(__MODULE__, poll_id) do
      nil ->
        {:error, :not_found}

      %{closed: true} ->
        {:error, :poll_closed}

      poll ->
        if poll.closes_at && DateTime.compare(DateTime.utc_now(), poll.closes_at) == :gt do
          {:error, :poll_closed}
        else
          {:ok, poll}
        end
    end
  end

  defp validate_option(poll, option_id) do
    valid_option_ids = Enum.map(poll.options, & &1["id"])
    if option_id in valid_option_ids, do: :ok, else: {:error, :invalid_option}
  end

  defp cast_vote(poll, user_id, option_id) do
    if poll.multiple_choice do
      %ChatPollVote{}
      |> ChatPollVote.changeset(%{poll_id: poll.id, user_id: user_id, option_id: option_id})
      |> Repo.insert(on_conflict: :nothing)
    else
      Repo.transaction(fn ->
        from(v in ChatPollVote, where: v.poll_id == ^poll.id and v.user_id == ^user_id)
        |> Repo.delete_all()

        %ChatPollVote{}
        |> ChatPollVote.changeset(%{poll_id: poll.id, user_id: user_id, option_id: option_id})
        |> Repo.insert!()
      end)
    end
  end

  @doc "Retract a vote."
  @spec retract_vote(String.t(), String.t(), String.t()) :: :ok | {:error, atom()}
  def retract_vote(poll_id, user_id, option_id) do
    case Repo.get(__MODULE__, poll_id) do
      nil ->
        {:error, :not_found}

      %{closed: true} ->
        {:error, :poll_closed}

      poll ->
        {count, _} = from(v in ChatPollVote,
          where: v.poll_id == ^poll_id and v.user_id == ^user_id and v.option_id == ^option_id
        )
        |> Repo.delete_all()

        if count > 0 do
          results = get_poll_results(poll_id)
          CGraphWeb.Endpoint.broadcast(
            "conversation:#{poll.conversation_id}",
            "poll_vote_updated",
            %{poll_id: poll_id, results: results}
          )
        end

        :ok
    end
  end

  @doc "Close a poll. Only the creator can close."
  @spec close_poll(String.t(), String.t()) :: {:ok, %__MODULE__{}} | {:error, atom()}
  def close_poll(poll_id, user_id) do
    case Repo.get(__MODULE__, poll_id) do
      nil ->
        {:error, :not_found}

      %{creator_id: ^user_id, closed: false} = poll ->
        {:ok, updated} =
          poll
          |> changeset(%{closed: true})
          |> Repo.update()

        results = get_poll_results(poll_id)
        CGraphWeb.Endpoint.broadcast(
          "conversation:#{poll.conversation_id}",
          "poll_closed",
          %{poll_id: poll_id, results: results}
        )
        {:ok, updated}

      %{creator_id: ^user_id, closed: true} ->
        {:error, :already_closed}

      _ ->
        {:error, :unauthorized}
    end
  end

  @doc "Get poll results as a map of option_id => vote count."
  @spec get_poll_results(String.t()) :: map()
  def get_poll_results(poll_id) do
    votes =
      from(v in ChatPollVote,
        where: v.poll_id == ^poll_id,
        group_by: v.option_id,
        select: {v.option_id, count(v.id)}
      )
      |> Repo.all()
      |> Map.new()

    total = Enum.reduce(votes, 0, fn {_, count}, acc -> acc + count end)

    %{tallies: votes, total: total}
  end

  @doc "Get a poll by ID with votes preloaded."
  @spec get_poll(String.t()) :: %__MODULE__{} | nil
  def get_poll(poll_id), do: Repo.get(__MODULE__, poll_id)

  # ── Helpers ──────────────────────────────────────────

  defp member?(user_id, conversation_id) do
    from(cp in ConversationParticipant,
      where: cp.user_id == ^user_id,
      where: cp.conversation_id == ^conversation_id,
      where: is_nil(cp.left_at)
    )
    |> Repo.exists?()
  end

  defp poll_data(poll) do
    %{
      id: poll.id,
      question: poll.question,
      options: poll.options,
      multiple_choice: poll.multiple_choice,
      anonymous: poll.anonymous,
      closed: poll.closed,
      closes_at: poll.closes_at,
      creator_id: poll.creator_id,
      conversation_id: poll.conversation_id
    }
  end
end
