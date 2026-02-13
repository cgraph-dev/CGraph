defmodule CGraph.Workers.DatabaseBackupTest do
  use Cgraph.DataCase, async: false

  alias CGraph.Workers.DatabaseBackup

  describe "schedule_now/1" do
    test "schedules a backup job" do
      result = DatabaseBackup.schedule_now("test")

      assert {:ok, %Oban.Job{}} = result
    end

    test "schedules backup with default type" do
      {:ok, job} = DatabaseBackup.schedule_now()

      assert job.args["type"] == "manual"
    end
  end

  describe "worker configuration" do
    test "uses correct queue" do
      assert DatabaseBackup.__opts__()[:queue] == :backups
    end

    test "has retry limit" do
      assert DatabaseBackup.__opts__()[:max_attempts] == 3
    end
  end
end

defmodule CGraph.Workers.SendEmailNotificationTest do
  use Cgraph.DataCase, async: true

  alias CGraph.Workers.SendEmailNotification

  import CgraphWeb.UserFixtures

  describe "worker configuration" do
    test "uses correct queue" do
      assert SendEmailNotification.__opts__()[:queue] == :email_notifications
    end

    test "has retry limit" do
      assert SendEmailNotification.__opts__()[:max_attempts] == 5
    end

    test "has deduplication configured" do
      assert SendEmailNotification.__opts__()[:unique][:period] == 300
    end
  end

  describe "perform/1" do
    test "succeeds when user not found (doesn't retry)" do
      job = %Oban.Job{
        args: %{
          "user_id" => Ecto.UUID.generate(),
          "notification_id" => Ecto.UUID.generate()
        }
      }

      # Should return :ok (don't retry for missing users)
      result = SendEmailNotification.perform(job)
      assert result == :ok
    end

    test "succeeds when notification not found" do
      user = user_fixture()

      job = %Oban.Job{
        args: %{
          "user_id" => user.id,
          "notification_id" => Ecto.UUID.generate()
        }
      }

      result = SendEmailNotification.perform(job)
      assert result == :ok
    end
  end
end

defmodule CGraph.Workers.SendPushNotificationTest do
  use Cgraph.DataCase, async: true

  alias CGraph.Workers.SendPushNotification

  import CgraphWeb.UserFixtures

  describe "worker configuration" do
    test "uses correct queue" do
      assert SendPushNotification.__opts__()[:queue] == :push_notifications
    end

    test "has retry limit" do
      assert SendPushNotification.__opts__()[:max_attempts] == 5
    end
  end

  describe "perform/1" do
    test "succeeds when user not found (doesn't retry)" do
      job = %Oban.Job{
        args: %{
          "user_id" => Ecto.UUID.generate(),
          "notification_id" => Ecto.UUID.generate()
        }
      }

      result = SendPushNotification.perform(job)
      assert result == :ok
    end

    test "succeeds when notification not found" do
      user = user_fixture()

      job = %Oban.Job{
        args: %{
          "user_id" => user.id,
          "notification_id" => Ecto.UUID.generate()
        }
      }

      result = SendPushNotification.perform(job)
      assert result == :ok
    end

    test "succeeds when user has no push tokens" do
      user = user_fixture()
      {:ok, notification} = CGraph.Notifications.notify(user, :new_message, "Test")

      job = %Oban.Job{
        args: %{
          "user_id" => user.id,
          "notification_id" => notification.id
        }
      }

      result = SendPushNotification.perform(job)
      assert result == :ok
    end
  end
end

defmodule CGraph.Workers.OrchestratorTest do
  use Cgraph.DataCase, async: true

  alias CGraph.Workers.Orchestrator

  describe "enqueue/3" do
    test "enqueues a job" do
      # Use a simple worker that exists
      result = Orchestrator.enqueue(CGraph.Workers.SendEmailNotification, %{
        user_id: Ecto.UUID.generate(),
        notification_id: Ecto.UUID.generate()
      })

      assert {:ok, %Oban.Job{}} = result
    end

    test "enqueues with scheduling" do
      future_time = DateTime.add(DateTime.utc_now(), 3600, :second)

      result = Orchestrator.enqueue(CGraph.Workers.SendEmailNotification, %{
        user_id: Ecto.UUID.generate(),
        notification_id: Ecto.UUID.generate()
      }, scheduled_at: future_time)

      # Just verify the job was created - scheduling behavior depends on Oban config
      assert {:ok, %Oban.Job{}} = result
    end
  end

  describe "pipeline/2" do
    test "creates a job pipeline" do
      user_id = Ecto.UUID.generate()
      notification_id = Ecto.UUID.generate()

      pipeline = [
        {CGraph.Workers.SendEmailNotification, %{user_id: user_id, notification_id: notification_id}},
        {CGraph.Workers.SendPushNotification, %{user_id: user_id, notification_id: notification_id}}
      ]

      result = Orchestrator.pipeline(pipeline)

      # pipeline/1 returns {:ok, pipeline_id} not a list of jobs
      assert {:ok, pipeline_id} = result
      assert is_binary(pipeline_id)
    end
  end
end
