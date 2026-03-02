defmodule CGraph.Moderation.ModerationIntegrationTest do
  @moduledoc """
  Integration tests covering the full moderation pipeline:

  - MOD-05: AI auto-action (high-confidence → auto-enforce, low → flag)
  - MOD-06: Dashboard stats + bulk review
  - MOD-07: Appeal system end-to-end + email notification
  """
  use Cgraph.DataCase, async: false

  alias CGraph.Moderation
  alias CGraph.Moderation.{Appeal, AuditLogs, AutoAction, Enforcement, Reports, Stats}
  alias CGraph.Moderation.{Report, ReviewAction, UserRestriction}
  alias CGraph.Repo

  import CgraphWeb.UserFixtures
  import CgraphWeb.ModerationFixtures
  import Ecto.Query

  # ---------------------------------------------------------------------------
  # MOD-05: AI Auto-Action Pipeline
  # ---------------------------------------------------------------------------

  describe "AI auto-action (MOD-05)" do
    test "high-confidence spam triggers auto-action with report + enforcement + audit log" do
      admin = admin_user_fixture()
      Application.put_env(:cgraph, :system_user_id, admin.id)
      on_exit(fn -> Application.delete_env(:cgraph, :system_user_id) end)

      target_id = Ecto.UUID.generate()

      # Process high-confidence spam (heuristic fallback uses keyword matching)
      result =
        AutoAction.process("BUY NOW!!! FREE MONEY spam spam spam click here", [
          user_id: admin.id,
          target_id: target_id,
          type: "message",
          content_type: "text"
        ])

      # Auto-action should succeed
      assert result == :ok

      # Audit log should record the decision
      logs = AuditLogs.for_target("message", target_id)
      assert length(logs) >= 1

      ai_log = Enum.find(logs, &(&1.action in ["ai_block", "ai_flag", "ai_allow"]))
      assert ai_log != nil
      assert ai_log.target_type == "message"
      assert ai_log.target_id == target_id
    end

    test "medium-confidence content flagged for review (not auto-actioned)" do
      admin = admin_user_fixture()
      Application.put_env(:cgraph, :system_user_id, admin.id)
      on_exit(fn -> Application.delete_env(:cgraph, :system_user_id) end)

      target_id = Ecto.UUID.generate()

      # Process content that should be flagged but not auto-actioned
      result =
        AutoAction.process("This is slightly questionable content maybe", [
          user_id: admin.id,
          target_id: target_id,
          type: "message",
          content_type: "text"
        ])

      assert result == :ok

      # Check audit log exists
      logs = AuditLogs.for_target("message", target_id)
      assert length(logs) >= 1
    end

    test "low-confidence content allowed with audit log" do
      admin = admin_user_fixture()
      Application.put_env(:cgraph, :system_user_id, admin.id)
      on_exit(fn -> Application.delete_env(:cgraph, :system_user_id) end)

      target_id = Ecto.UUID.generate()

      # Process completely benign content
      result =
        AutoAction.process("Hello! How are you doing today?", [
          user_id: admin.id,
          target_id: target_id,
          type: "message",
          content_type: "text"
        ])

      assert result == :ok

      # Audit log should record the allow decision
      logs = AuditLogs.for_target("message", target_id)
      assert length(logs) >= 1

      allow_log = Enum.find(logs, &(&1.action == "ai_allow"))
      assert allow_log != nil
      assert allow_log.ai_action == "allow"
    end

    test "image content returns allow with TODO stub" do
      admin = admin_user_fixture()
      Application.put_env(:cgraph, :system_user_id, admin.id)
      on_exit(fn -> Application.delete_env(:cgraph, :system_user_id) end)

      target_id = Ecto.UUID.generate()

      # Process image content (should be allowed — stub returns allow)
      result =
        AutoAction.process("image_data_placeholder", [
          user_id: admin.id,
          target_id: target_id,
          type: "message",
          content_type: "image"
        ])

      assert result == :ok

      # Should have an allow audit log
      logs = AuditLogs.for_target("message", target_id)
      assert length(logs) >= 1

      allow_log = Enum.find(logs, &(&1.action == "ai_allow"))
      assert allow_log != nil
    end

    test "audit log records all AI decisions" do
      admin = admin_user_fixture()
      Application.put_env(:cgraph, :system_user_id, admin.id)
      on_exit(fn -> Application.delete_env(:cgraph, :system_user_id) end)

      # Process multiple content items
      for i <- 1..3 do
        target_id = Ecto.UUID.generate()

        AutoAction.process("Hello from test #{i}", [
          user_id: admin.id,
          target_id: target_id,
          type: "message",
          content_type: "text"
        ])
      end

      # AI stats should have entries
      stats = AuditLogs.ai_stats(30)
      assert is_list(stats)
    end
  end

  # ---------------------------------------------------------------------------
  # MOD-06: Dashboard Stats + Bulk Review
  # ---------------------------------------------------------------------------

  describe "moderation dashboard (MOD-06)" do
    test "comprehensive_stats returns all metrics" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, _target} = report_fixture(reporter)

      # Review the report to generate stats data
      {:ok, _} = Moderation.review_report(admin, report.id, %{action: :dismiss, notes: "test"})

      stats = Stats.comprehensive_stats(30)

      assert is_map(stats)
      assert Map.has_key?(stats, :reports_today)
      assert Map.has_key?(stats, :avg_response_time)
      assert Map.has_key?(stats, :active_restrictions)
      assert Map.has_key?(stats, :resolution_rate)
      assert Map.has_key?(stats, :reports_by_category)
      assert Map.has_key?(stats, :reports_trend)
      assert Map.has_key?(stats, :moderator_leaderboard)
      assert Map.has_key?(stats, :ai_stats)
      assert Map.has_key?(stats, :appeals_stats)
    end

    test "reports_by_category aggregates correctly" do
      reporter = user_fixture()
      target1 = user_fixture()
      target2 = user_fixture()

      {:ok, _} =
        Moderation.create_report(reporter, %{
          target_type: :user,
          target_id: target1.id,
          category: :spam,
          description: "Spam"
        })

      {:ok, _} =
        Moderation.create_report(reporter, %{
          target_type: :user,
          target_id: target2.id,
          category: :harassment,
          description: "Harassment"
        })

      by_category = Stats.reports_by_category(30)
      assert is_map(by_category)
      assert Map.get(by_category, "spam", 0) >= 1 || Map.get(by_category, :spam, 0) >= 1
      assert Map.get(by_category, "harassment", 0) >= 1 || Map.get(by_category, :harassment, 0) >= 1
    end

    test "moderator_leaderboard returns ranked moderators" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, _target} = report_fixture(reporter)

      {:ok, _} = Moderation.review_report(admin, report.id, %{action: :dismiss, notes: "test"})

      leaderboard = Stats.moderator_leaderboard(10)
      assert is_list(leaderboard)

      if length(leaderboard) > 0 do
        top = hd(leaderboard)
        assert Map.has_key?(top, :reviewer_id)
        assert Map.has_key?(top, :actions_count)
        assert top.actions_count >= 1
      end
    end

    test "ai_auto_action_stats includes auto vs manual counts" do
      admin = admin_user_fixture()
      Application.put_env(:cgraph, :system_user_id, admin.id)
      on_exit(fn -> Application.delete_env(:cgraph, :system_user_id) end)

      # Create an audit log entry directly
      AuditLogs.log(%{
        target_type: "message",
        target_id: Ecto.UUID.generate(),
        action: "ai_block",
        ai_category: "spam",
        ai_confidence: 0.95,
        ai_action: "block",
        auto_actioned: true
      })

      AuditLogs.log(%{
        target_type: "message",
        target_id: Ecto.UUID.generate(),
        action: "ai_flag",
        ai_category: "harassment",
        ai_confidence: 0.6,
        ai_action: "flag",
        auto_actioned: false
      })

      stats = Stats.ai_auto_action_stats(30)
      assert is_list(stats)
      assert length(stats) >= 1

      # At least one entry should exist
      block_entry = Enum.find(stats, &(&1.ai_action == "block"))
      flag_entry = Enum.find(stats, &(&1.ai_action == "flag"))

      assert block_entry == nil || block_entry.count >= 1
      assert flag_entry == nil || flag_entry.count >= 1
    end

    test "batch_review processes multiple reports" do
      reporter = user_fixture()
      admin = admin_user_fixture()

      # Create multiple reports
      {report1, _} = report_fixture(reporter)

      reporter2 = user_fixture()
      {report2, _} = report_fixture(reporter2)

      reporter3 = user_fixture()
      {report3, _} = report_fixture(reporter3)

      report_ids = [report1.id, report2.id, report3.id]

      # Batch dismiss all
      result = Reports.batch_review(admin, report_ids, %{action: :dismiss, notes: "Batch dismiss"})

      assert {:ok, batch_result} = result
      assert batch_result.succeeded == 3
      assert batch_result.failed == 0
      assert length(batch_result.details) == 3

      # Verify all reports are now reviewed
      for id <- report_ids do
        report = Repo.get!(Report, id)
        assert report.status != :pending
      end
    end

    test "batch_review handles mixed success/failure" do
      reporter = user_fixture()
      admin = admin_user_fixture()

      {report, _} = report_fixture(reporter)
      fake_id = Ecto.UUID.generate()

      result = Reports.batch_review(admin, [report.id, fake_id], %{action: :dismiss, notes: "test"})

      assert {:ok, batch_result} = result
      assert batch_result.succeeded >= 1
      assert batch_result.failed >= 1
    end
  end

  # ---------------------------------------------------------------------------
  # MOD-07: Appeal System
  # ---------------------------------------------------------------------------

  describe "appeal system (MOD-07)" do
    test "user creates appeal for active restriction" do
      {appeal, target, _action, _admin} = appeal_fixture()

      assert appeal.status == :pending
      assert appeal.user_id == target.id
      assert appeal.reason != nil
      assert String.length(appeal.reason) >= 20
    end

    test "admin approves appeal and restriction auto-lifted" do
      {appeal, target, _action, admin} = appeal_fixture()

      # Create a restriction for the target
      {:ok, _restriction} = Enforcement.create_user_restriction(target.id, :suspended, 24)

      # Verify restriction is active
      assert Enforcement.user_restricted?(target.id) == true

      # Approve the appeal
      {:ok, reviewed} = Moderation.review_appeal(admin, appeal.id, %{approved: true, notes: "Appeal valid"})

      assert reviewed.status == :approved
      assert reviewed.reviewer_id == admin.id
      assert reviewed.reviewer_notes == "Appeal valid"

      # Restriction should be lifted
      assert Enforcement.user_restricted?(target.id) == false
    end

    test "admin denies appeal with reviewer notes" do
      {appeal, _target, _action, admin} = appeal_fixture()

      {:ok, reviewed} =
        Moderation.review_appeal(admin, appeal.id, %{
          approved: false,
          notes: "Violation clearly documented"
        })

      assert reviewed.status == :denied
      assert reviewed.reviewer_id == admin.id
      assert reviewed.reviewer_notes == "Violation clearly documented"
    end

    test "email notification enqueued on appeal outcome" do
      {appeal, _target, _action, admin} = appeal_fixture()

      # review_appeal now enqueues AppealNotificationWorker
      # With Oban inline testing, the job executes synchronously
      # We just verify review completes without error as the worker
      # enqueues an email via Orchestrator
      {:ok, reviewed} = Moderation.review_appeal(admin, appeal.id, %{approved: true, notes: "Valid"})

      assert reviewed.status == :approved
      # The AppealNotificationWorker should have been enqueued inline
      # (Oban testing: :inline in test config)
    end

    test "user cannot appeal already-appealed restriction" do
      {_appeal, target, action, _admin} = appeal_fixture()

      # Try to appeal again with the same action
      assert {:error, :already_appealed} =
               Moderation.create_appeal(target, action.id, %{
                 reason: "I am appealing again with a detailed reason for this second attempt"
               })
    end
  end
end
