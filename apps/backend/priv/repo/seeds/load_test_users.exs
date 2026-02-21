# Load Test User Seeder
#
# Creates 100 load test accounts for k6 staging tests.
# Each account gets a deterministic email: loadtest+{1..100}@cgraph.org
#
# Usage:
#   mix run priv/repo/seeds/load_test_users.exs
#   MIX_ENV=staging mix run priv/repo/seeds/load_test_users.exs
#
# Idempotent — safely re-runnable. Skips existing accounts.

alias CGraph.Repo
alias CGraph.Accounts
alias CGraph.Accounts.User
alias CGraph.Messaging

require Logger

defmodule LoadTestSeeder do
  @total_users 100
  @password "loadtest123!"
  @domain "cgraph.org"

  def run do
    Logger.info("[LoadTestSeeder] Creating #{@total_users} load test accounts...")

    results =
      1..@total_users
      |> Enum.map(fn vu_id ->
        email = "loadtest+#{vu_id}@#{@domain}"
        username = "loadtest_user_#{vu_id}"
        display_name = "Load Test User #{vu_id}"

        case create_or_skip(email, username, display_name) do
          {:created, _user} ->
            if rem(vu_id, 25) == 0, do: Logger.info("[LoadTestSeeder] Progress: #{vu_id}/#{@total_users}")
            :created

          {:exists, _user} ->
            :exists

          {:error, reason} ->
            Logger.warning("[LoadTestSeeder] Failed to create #{email}: #{inspect(reason)}")
            :error
        end
      end)

    created = Enum.count(results, &(&1 == :created))
    existing = Enum.count(results, &(&1 == :exists))
    errors = Enum.count(results, &(&1 == :error))

    Logger.info("""
    [LoadTestSeeder] Complete!
      Created: #{created}
      Already existed: #{existing}
      Errors: #{errors}
      Total: #{@total_users}
    """)

    # Create a test group and conversation for messaging flows
    ensure_test_fixtures()
  end

  defp create_or_skip(email, username, display_name) do
    case Repo.get_by(User, email: email) do
      nil ->
        attrs = %{
          email: email,
          username: username,
          display_name: display_name,
          password: @password,
          password_confirmation: @password
        }

        case Accounts.register_user(attrs) do
          {:ok, user} ->
            # Auto-confirm the user so load tests can log in immediately
            user
            |> Ecto.Changeset.change(%{confirmed_at: DateTime.utc_now()})
            |> Repo.update!()

            {:created, user}

          {:error, changeset} ->
            {:error, changeset.errors}
        end

      user ->
        {:exists, user}
    end
  end

  defp ensure_test_fixtures do
    Logger.info("[LoadTestSeeder] Ensuring test fixtures (group + conversation)...")

    # Get the first two load test users for a test conversation
    user1 = Repo.get_by(User, email: "loadtest+1@#{@domain}")
    user2 = Repo.get_by(User, email: "loadtest+2@#{@domain}")

    if user1 && user2 do
      # Create a test conversation between user1 and user2 if none exists
      case Messaging.get_or_create_dm(user1, user2) do
        {:ok, conv} ->
          Logger.info("[LoadTestSeeder] Test conversation ready: #{conv.id}")

        {:error, reason} ->
          Logger.warning("[LoadTestSeeder] Could not create test conversation: #{inspect(reason)}")
      end
    end

    :ok
  rescue
    e ->
      Logger.warning("[LoadTestSeeder] Test fixtures skipped: #{inspect(e)}")
      :ok
  end
end

LoadTestSeeder.run()
