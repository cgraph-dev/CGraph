defmodule CGraph.Nodes do
  @moduledoc """
  The Nodes context.

  Handles the virtual currency system: wallet management, transactions,
  tipping, content unlock, and withdrawal requests.

  ## Key concepts

  - **Available balance** — spendable immediately (from purchases or released holds)
  - **Pending balance** — earned nodes held for 21 days before release
  - **Platform cut** — 20% on earned transactions (tips, subscriptions)
  - **Hold period** — 21 days on earned nodes before withdrawal

  ## Transaction types

  purchase, tip_received, tip_sent, content_unlock,
  subscription_received, subscription_sent, withdrawal, cosmetic_purchase
  """

  import Ecto.Query, warn: false

  alias CGraph.Repo
  alias CGraph.ReadRepo
  alias CGraph.Nodes.{NodeWallet, NodeTransaction, WithdrawalRequest}

  require Logger

  @platform_cut_percent 20
  @hold_days 21
  @min_withdrawal 1000
  @eur_per_100_nodes Decimal.new("0.80")
  # Exchange rate: 0.008 EUR per Node (equivalent to @eur_per_100_nodes / 100).
  # Sourced from config for runtime override flexibility.
  @exchange_rate_eur Application.compile_env(:cgraph, :nodes_exchange_rate, 0.008)

  # ==================== WALLET MANAGEMENT ====================

  @doc """
  Get or create a wallet for a user.
  Returns the wallet (creates one with zero balances if not found).
  """
  @spec get_or_create_wallet(String.t()) :: {:ok, NodeWallet.t()}
  def get_or_create_wallet(user_id) when is_binary(user_id) do
    case ReadRepo.get(NodeWallet, user_id) do
      nil ->
        %NodeWallet{}
        |> NodeWallet.changeset(%{user_id: user_id})
        |> Repo.insert(on_conflict: :nothing, conflict_target: :user_id)
        |> case do
          {:ok, wallet} -> {:ok, wallet}
          {:error, _} -> {:ok, Repo.get!(NodeWallet, user_id)}
        end

      wallet ->
        {:ok, wallet}
    end
  end

  @doc "Get a user's balance. Returns {available, pending}."
  @spec get_balance(String.t()) :: {non_neg_integer(), non_neg_integer()}
  def get_balance(user_id) when is_binary(user_id) do
    case ReadRepo.get(NodeWallet, user_id) do
      nil -> {0, 0}
      wallet -> {wallet.available_balance, wallet.pending_balance}
    end
  end

  # ==================== CREDIT / DEBIT ====================

  @doc """
  Credit nodes to a user's available balance (for purchases).
  Creates a transaction record.
  """
  @spec credit_nodes(String.t(), pos_integer(), atom(), keyword()) ::
          {:ok, NodeTransaction.t()} | {:error, term()}
  def credit_nodes(user_id, amount, type, opts \\ []) when amount > 0 do
    type_str = to_string(type)

    Ecto.Multi.new()
    |> Ecto.Multi.run(:wallet, fn _repo, _changes ->
      get_or_create_wallet(user_id)
    end)
    |> Ecto.Multi.run(:update_wallet, fn _repo, %{wallet: wallet} ->
      wallet
      |> Ecto.Changeset.change(%{
        available_balance: wallet.available_balance + amount,
        lifetime_earned: wallet.lifetime_earned + amount
      })
      |> Repo.update()
    end)
    |> Ecto.Multi.insert(:transaction, fn _changes ->
      NodeTransaction.changeset(%NodeTransaction{}, %{
        user_id: user_id,
        amount: amount,
        type: type_str,
        reference_id: Keyword.get(opts, :reference_id),
        reference_type: Keyword.get(opts, :reference_type),
        description: Keyword.get(opts, :description),
        metadata: %{description: Keyword.get(opts, :description)},
        inserted_at: DateTime.utc_now()
      })
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{transaction: transaction}} -> {:ok, transaction}
      {:error, _step, changeset, _changes} -> {:error, changeset}
    end
  end

  @doc """
  Debit nodes from a user's available balance (for spending).
  Returns {:error, :insufficient_balance} if not enough.
  Uses SELECT FOR UPDATE to prevent race conditions.
  """
  @spec debit_nodes(String.t(), pos_integer(), atom(), keyword()) ::
          {:ok, NodeTransaction.t()} | {:error, :insufficient_balance | term()}
  def debit_nodes(user_id, amount, type, opts \\ []) when amount > 0 do
    type_str = to_string(type)

    Ecto.Multi.new()
    |> Ecto.Multi.run(:lock_wallet, fn _repo, _changes ->
      case from(w in NodeWallet, where: w.user_id == ^user_id, lock: "FOR UPDATE")
           |> Repo.one() do
        nil ->
          # Create wallet on-the-fly (will have 0 balance)
          get_or_create_wallet(user_id)

        wallet ->
          {:ok, wallet}
      end
    end)
    |> Ecto.Multi.run(:check_balance, fn _repo, %{lock_wallet: wallet} ->
      if wallet.available_balance >= amount do
        {:ok, wallet}
      else
        {:error, :insufficient_balance}
      end
    end)
    |> Ecto.Multi.run(:update_wallet, fn _repo, %{lock_wallet: wallet} ->
      wallet
      |> Ecto.Changeset.change(%{
        available_balance: wallet.available_balance - amount,
        lifetime_spent: wallet.lifetime_spent + amount
      })
      |> Repo.update()
    end)
    |> Ecto.Multi.insert(:transaction, fn _changes ->
      NodeTransaction.changeset(%NodeTransaction{}, %{
        user_id: user_id,
        amount: -amount,
        type: type_str,
        reference_id: Keyword.get(opts, :reference_id),
        reference_type: Keyword.get(opts, :reference_type),
        metadata: %{description: Keyword.get(opts, :description)},
        inserted_at: DateTime.utc_now()
      })
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{transaction: transaction}} -> {:ok, transaction}
      {:error, :check_balance, :insufficient_balance, _} -> {:error, :insufficient_balance}
      {:error, _step, changeset, _changes} -> {:error, changeset}
    end
  end

  # ==================== TIPPING ====================

  @doc """
  Send a tip from one user to another.
  Debits sender, credits recipient (with 20% platform cut, 21-day hold).
  """
  @spec tip(String.t(), String.t(), pos_integer()) ::
          {:ok, NodeTransaction.t()} | {:error, :insufficient_balance | :self_tip | term()}
  def tip(sender_id, recipient_id, amount) when amount > 0 do
    if sender_id == recipient_id, do: throw({:error, :self_tip})

    platform_cut = floor(amount * @platform_cut_percent / 100)
    net_amount = amount - platform_cut
    hold_until = DateTime.utc_now() |> DateTime.add(@hold_days * 24 * 3600, :second)

    Ecto.Multi.new()
    # Lock sender wallet
    |> Ecto.Multi.run(:sender_wallet, fn _repo, _changes ->
      case from(w in NodeWallet, where: w.user_id == ^sender_id, lock: "FOR UPDATE")
           |> Repo.one() do
        nil -> get_or_create_wallet(sender_id)
        wallet -> {:ok, wallet}
      end
    end)
    |> Ecto.Multi.run(:check_balance, fn _repo, %{sender_wallet: wallet} ->
      if wallet.available_balance >= amount do
        {:ok, :sufficient}
      else
        {:error, :insufficient_balance}
      end
    end)
    # Debit sender
    |> Ecto.Multi.run(:debit_sender, fn _repo, %{sender_wallet: wallet} ->
      wallet
      |> Ecto.Changeset.change(%{
        available_balance: wallet.available_balance - amount,
        lifetime_spent: wallet.lifetime_spent + amount
      })
      |> Repo.update()
    end)
    # Credit recipient pending balance
    |> Ecto.Multi.run(:recipient_wallet, fn _repo, _changes ->
      get_or_create_wallet(recipient_id)
    end)
    |> Ecto.Multi.run(:credit_recipient, fn _repo, %{recipient_wallet: wallet} ->
      wallet
      |> Ecto.Changeset.change(%{
        pending_balance: wallet.pending_balance + net_amount,
        lifetime_earned: wallet.lifetime_earned + net_amount
      })
      |> Repo.update()
    end)
    # Sender transaction (debit)
    |> Ecto.Multi.insert(:sender_transaction, fn _changes ->
      NodeTransaction.changeset(%NodeTransaction{}, %{
        user_id: sender_id,
        amount: -amount,
        type: "tip_sent",
        reference_id: recipient_id,
        reference_type: "user",
        platform_cut: 0,
        net_amount: -amount,
        metadata: %{recipient_id: recipient_id},
        inserted_at: DateTime.utc_now()
      })
    end)
    # Recipient transaction (credit with hold)
    |> Ecto.Multi.insert(:recipient_transaction, fn _changes ->
      NodeTransaction.changeset(%NodeTransaction{}, %{
        user_id: recipient_id,
        amount: net_amount,
        type: "tip_received",
        reference_id: sender_id,
        reference_type: "user",
        platform_cut: platform_cut,
        net_amount: net_amount,
        hold_until: hold_until,
        metadata: %{sender_id: sender_id, gross_amount: amount},
        inserted_at: DateTime.utc_now()
      })
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{sender_transaction: transaction}} -> {:ok, transaction}
      {:error, :check_balance, :insufficient_balance, _} -> {:error, :insufficient_balance}
      {:error, _step, changeset, _changes} -> {:error, changeset}
    end
  catch
    {:error, reason} -> {:error, reason}
  end

  # ==================== CONTENT UNLOCK ====================

  @doc """
  Unlock gated content (thread) by paying gate_price_nodes.
  Debits buyer, credits thread author (with 20% platform cut, 21-day hold).
  """
  @spec unlock_content(String.t(), String.t()) ::
          {:ok, NodeTransaction.t()} | {:error, atom()}
  def unlock_content(user_id, thread_id) do
    alias CGraph.Forums.Thread

    thread = Repo.get(Thread, thread_id)

    cond do
      is_nil(thread) ->
        {:error, :not_found}

      not thread.is_content_gated ->
        {:error, :not_gated}

      is_nil(thread.gate_price_nodes) or thread.gate_price_nodes <= 0 ->
        {:error, :invalid_gate_price}

      already_unlocked?(user_id, thread_id) ->
        {:error, :already_unlocked}

      true ->
        amount = thread.gate_price_nodes
        author_id = thread.author_id
        platform_cut = floor(amount * @platform_cut_percent / 100)
        net_amount = amount - platform_cut
        hold_until = DateTime.utc_now() |> DateTime.add(@hold_days * 24 * 3600, :second)

        Ecto.Multi.new()
        # Lock buyer wallet
        |> Ecto.Multi.run(:buyer_wallet, fn _repo, _changes ->
          case from(w in NodeWallet, where: w.user_id == ^user_id, lock: "FOR UPDATE")
               |> Repo.one() do
            nil -> get_or_create_wallet(user_id)
            wallet -> {:ok, wallet}
          end
        end)
        |> Ecto.Multi.run(:check_balance, fn _repo, %{buyer_wallet: wallet} ->
          if wallet.available_balance >= amount do
            {:ok, :sufficient}
          else
            {:error, :insufficient_balance}
          end
        end)
        # Debit buyer
        |> Ecto.Multi.run(:debit_buyer, fn _repo, %{buyer_wallet: wallet} ->
          wallet
          |> Ecto.Changeset.change(%{
            available_balance: wallet.available_balance - amount,
            lifetime_spent: wallet.lifetime_spent + amount
          })
          |> Repo.update()
        end)
        # Credit author
        |> Ecto.Multi.run(:author_wallet, fn _repo, _changes ->
          get_or_create_wallet(author_id)
        end)
        |> Ecto.Multi.run(:credit_author, fn _repo, %{author_wallet: wallet} ->
          wallet
          |> Ecto.Changeset.change(%{
            pending_balance: wallet.pending_balance + net_amount,
            lifetime_earned: wallet.lifetime_earned + net_amount
          })
          |> Repo.update()
        end)
        # Buyer transaction
        |> Ecto.Multi.insert(:buyer_transaction, fn _changes ->
          NodeTransaction.changeset(%NodeTransaction{}, %{
            user_id: user_id,
            amount: -amount,
            type: "content_unlock",
            reference_id: thread_id,
            reference_type: "thread",
            metadata: %{thread_id: thread_id, author_id: author_id},
            inserted_at: DateTime.utc_now()
          })
        end)
        # Author transaction (earned with hold)
        |> Ecto.Multi.insert(:author_transaction, fn _changes ->
          NodeTransaction.changeset(%NodeTransaction{}, %{
            user_id: author_id,
            amount: net_amount,
            type: "subscription_received",
            reference_id: thread_id,
            reference_type: "thread",
            platform_cut: platform_cut,
            net_amount: net_amount,
            hold_until: hold_until,
            metadata: %{buyer_id: user_id, thread_id: thread_id, gross_amount: amount},
            inserted_at: DateTime.utc_now()
          })
        end)
        |> Repo.transaction()
        |> case do
          {:ok, %{buyer_transaction: transaction}} -> {:ok, transaction}
          {:error, :check_balance, :insufficient_balance, _} -> {:error, :insufficient_balance}
          {:error, _step, changeset, _changes} -> {:error, changeset}
        end
    end
  end

  defp already_unlocked?(user_id, thread_id) do
    from(t in NodeTransaction,
      where: t.user_id == ^user_id and t.type == "content_unlock" and t.reference_id == ^thread_id
    )
    |> ReadRepo.exists?()
  end

  # ==================== HOLD RELEASE ====================

  @doc """
  Release held nodes — move from pending to available balance.
  Called by scheduled Oban worker. Finds all transactions with hold_until <= now.
  """
  @spec release_held_nodes() :: {:ok, non_neg_integer()}
  def release_held_nodes do
    now = DateTime.utc_now()

    held_transactions =
      from(t in NodeTransaction,
        where: t.hold_until <= ^now and t.type in ["tip_received", "subscription_received"],
        where: not is_nil(t.hold_until),
        select: {t.user_id, sum(t.net_amount)},
        group_by: t.user_id
      )
      |> Repo.all()

    released_count =
      Enum.reduce(held_transactions, 0, fn {user_id, total}, acc ->
        total_int = if is_nil(total), do: 0, else: total

        case from(w in NodeWallet, where: w.user_id == ^user_id)
             |> Repo.one() do
          nil ->
            acc

          wallet ->
            wallet
            |> Ecto.Changeset.change(%{
              available_balance: wallet.available_balance + total_int,
              pending_balance: max(wallet.pending_balance - total_int, 0)
            })
            |> Repo.update!()

            acc + 1
        end
      end)

    # Clear hold_until on released transactions
    from(t in NodeTransaction,
      where: t.hold_until <= ^now and t.type in ["tip_received", "subscription_received"]
    )
    |> Repo.update_all(set: [hold_until: nil])

    {:ok, released_count}
  end

  # ==================== WITHDRAWAL ====================

  @doc """
  Request a withdrawal. Minimum 1000 nodes.
  Conversion: €0.80 per 100 nodes (nodes × 0.008 = EUR).
  """
  @spec request_withdrawal(String.t(), pos_integer()) ::
          {:ok, WithdrawalRequest.t()} | {:error, atom()}
  def request_withdrawal(user_id, nodes_amount) when nodes_amount >= @min_withdrawal do
    fiat_amount =
      Decimal.mult(Decimal.new(nodes_amount), Decimal.div(@eur_per_100_nodes, Decimal.new(100)))

    Ecto.Multi.new()
    |> Ecto.Multi.run(:lock_wallet, fn _repo, _changes ->
      case from(w in NodeWallet, where: w.user_id == ^user_id, lock: "FOR UPDATE")
           |> Repo.one() do
        nil -> {:error, :no_wallet}
        wallet -> {:ok, wallet}
      end
    end)
    |> Ecto.Multi.run(:check_balance, fn _repo, %{lock_wallet: wallet} ->
      if wallet.available_balance >= nodes_amount do
        {:ok, :sufficient}
      else
        {:error, :insufficient_balance}
      end
    end)
    |> Ecto.Multi.run(:debit_wallet, fn _repo, %{lock_wallet: wallet} ->
      wallet
      |> Ecto.Changeset.change(%{
        available_balance: wallet.available_balance - nodes_amount,
        lifetime_spent: wallet.lifetime_spent + nodes_amount
      })
      |> Repo.update()
    end)
    |> Ecto.Multi.insert(:withdrawal, fn _changes ->
      WithdrawalRequest.changeset(%WithdrawalRequest{}, %{
        user_id: user_id,
        nodes_amount: nodes_amount,
        fiat_amount: fiat_amount,
        status: "pending"
      })
    end)
    |> Ecto.Multi.insert(:transaction, fn _changes ->
      NodeTransaction.changeset(%NodeTransaction{}, %{
        user_id: user_id,
        amount: -nodes_amount,
        type: "withdrawal",
        metadata: %{fiat_amount: Decimal.to_string(fiat_amount), currency: "EUR"},
        inserted_at: DateTime.utc_now()
      })
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{withdrawal: withdrawal}} -> {:ok, withdrawal}
      {:error, :check_balance, :insufficient_balance, _} -> {:error, :insufficient_balance}
      {:error, :lock_wallet, :no_wallet, _} -> {:error, :no_wallet}
      {:error, _step, changeset, _changes} -> {:error, changeset}
    end
  end

  def request_withdrawal(_user_id, _nodes_amount) do
    {:error, :minimum_not_met}
  end

  # ==================== QUERY HELPERS ====================

  @doc "List transactions for a user with optional type filter and pagination."
  @spec list_transactions(String.t(), keyword()) :: [NodeTransaction.t()]
  def list_transactions(user_id, opts \\ []) do
    type = Keyword.get(opts, :type)
    limit = Keyword.get(opts, :limit, 50)
    offset = Keyword.get(opts, :offset, 0)

    query =
      from(t in NodeTransaction,
        where: t.user_id == ^user_id,
        order_by: [desc: t.inserted_at],
        limit: ^limit,
        offset: ^offset
      )

    query = if type, do: where(query, [t], t.type == ^type), else: query

    ReadRepo.all(query)
  end

  @doc "Check if a user has unlocked a specific thread."
  @spec content_unlocked?(String.t(), String.t()) :: boolean()
  def content_unlocked?(user_id, thread_id) do
    already_unlocked?(user_id, thread_id)
  end
end
