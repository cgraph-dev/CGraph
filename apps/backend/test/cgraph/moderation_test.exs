defmodule CGraph.ModerationTest do
  @moduledoc """
  Comprehensive tests for the moderation system.

  Tests cover:
  - Report creation and validation
  - Report review workflow
  - User restrictions (suspensions/bans)
  - Appeal system
  - Statistics and queries
  """
  use Cgraph.DataCase, async: false

  alias CGraph.Moderation
  alias CGraph.Moderation.Appeal
  alias CGraph.Moderation.Report
  alias CGraph.Moderation.ReviewAction
  alias CGraph.Moderation.UserRestriction
  import CgraphWeb.UserFixtures
  import CgraphWeb.ModerationFixtures

  describe "report creation" do
    test "create_report/2 with valid data creates a report" do
      reporter = user_fixture()
      target_user = user_fixture()

      attrs = %{
        target_type: :user,
        target_id: target_user.id,
        category: :harassment,
        description: "This user is harassing me"
      }

      assert {:ok, %Report{} = report} = Moderation.create_report(reporter, attrs)
      assert report.reporter_id == reporter.id
      assert report.target_type == :user
      assert report.target_id == target_user.id
      assert report.category == :harassment
      assert report.status == :pending
      assert report.priority == :high  # harassment is high priority
    end

    test "create_report/2 rejects self-reporting for user targets" do
      user = user_fixture()

      attrs = %{
        target_type: :user,
        target_id: user.id,
        category: :spam
      }

      assert {:error, :self_report} = Moderation.create_report(user, attrs)
    end

    test "create_report/2 allows reporting own messages (by mistake)" do
      reporter = user_fixture()
      message_id = Ecto.UUID.generate()

      attrs = %{
        target_type: :message,
        target_id: message_id,
        category: :spam
      }

      # Should succeed - we don't block self-reporting of messages
      # (user might want to report their own hacked message)
      assert {:ok, %Report{}} = Moderation.create_report(reporter, attrs)
    end

    test "create_report/2 prevents duplicate pending reports" do
      reporter = user_fixture()
      target_user = user_fixture()

      attrs = %{
        target_type: :user,
        target_id: target_user.id,
        category: :harassment
      }

      assert {:ok, _report} = Moderation.create_report(reporter, attrs)
      assert {:error, :duplicate} = Moderation.create_report(reporter, attrs)
    end

    test "create_report/2 allows multiple reports for different targets" do
      reporter = user_fixture()
      target1 = user_fixture()
      target2 = user_fixture()

      attrs1 = %{target_type: :user, target_id: target1.id, category: :spam}
      attrs2 = %{target_type: :user, target_id: target2.id, category: :spam}

      assert {:ok, _} = Moderation.create_report(reporter, attrs1)
      assert {:ok, _} = Moderation.create_report(reporter, attrs2)
    end

    test "create_report/2 sets critical priority for CSAM reports" do
      reporter = user_fixture()
      target = user_fixture()

      attrs = %{
        target_type: :user,
        target_id: target.id,
        category: :csam
      }

      assert {:ok, report} = Moderation.create_report(reporter, attrs)
      assert report.priority == :critical
    end

    test "create_report/2 sets critical priority for terrorism reports" do
      reporter = user_fixture()
      target = user_fixture()

      attrs = %{
        target_type: :user,
        target_id: target.id,
        category: :terrorism
      }

      assert {:ok, report} = Moderation.create_report(reporter, attrs)
      assert report.priority == :critical
    end

    test "create_report/2 sets high priority for violence threats" do
      reporter = user_fixture()
      target = user_fixture()

      attrs = %{
        target_type: :user,
        target_id: target.id,
        category: :violence_threat
      }

      assert {:ok, report} = Moderation.create_report(reporter, attrs)
      assert report.priority == :high
    end

    test "create_report/2 sets normal priority for spam" do
      reporter = user_fixture()
      target = user_fixture()

      attrs = %{
        target_type: :user,
        target_id: target.id,
        category: :spam
      }

      assert {:ok, report} = Moderation.create_report(reporter, attrs)
      assert report.priority == :normal
    end

    test "create_report/2 supports all target types" do
      reporter = user_fixture()

      for target_type <- [:user, :message, :group, :forum, :post, :comment] do
        attrs = %{
          target_type: target_type,
          target_id: Ecto.UUID.generate(),
          category: :spam
        }

        assert {:ok, report} = Moderation.create_report(reporter, attrs)
        assert report.target_type == target_type
      end
    end

    test "create_report/2 supports all valid categories" do
      reporter = user_fixture()

      categories = [
        :csam, :terrorism, :violence_threat, :harassment, :hate_speech,
        :doxxing, :spam, :scam, :impersonation, :copyright, :nsfw_unlabeled,
        :self_harm, :other
      ]

      for category <- categories do
        target = user_fixture()
        attrs = %{
          target_type: :user,
          target_id: target.id,
          category: category
        }

        assert {:ok, report} = Moderation.create_report(reporter, attrs)
        assert report.category == category
      end
    end

    test "create_report/2 validates description length" do
      reporter = user_fixture()
      target = user_fixture()

      long_description = String.duplicate("x", 2001)
      attrs = %{
        target_type: :user,
        target_id: target.id,
        category: :spam,
        description: long_description
      }

      assert {:error, changeset} = Moderation.create_report(reporter, attrs)
      assert "should be at most 2000 character(s)" in errors_on(changeset).description
    end

    test "create_report/2 limits evidence URLs to 10" do
      reporter = user_fixture()
      target = user_fixture()

      urls = for i <- 1..11, do: "https://example.com/evidence#{i}.png"
      attrs = %{
        target_type: :user,
        target_id: target.id,
        category: :spam,
        evidence_urls: urls
      }

      assert {:error, changeset} = Moderation.create_report(reporter, attrs)
      assert "cannot have more than 10 evidence URLs" in errors_on(changeset).evidence_urls
    end
  end

  describe "report listing" do
    test "list_reports/1 returns pending reports by default" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report1, _} = report_fixture(reporter)
      {report2, _} = report_fixture(reporter)

      # Resolve one report
      Moderation.review_report(admin, report2.id, %{action: :dismiss})

      reports = Moderation.list_reports()
      assert length(reports) == 1
      assert hd(reports).id == report1.id
    end

    test "list_reports/1 can filter by category" do
      reporter = user_fixture()
      target1 = user_fixture()
      target2 = user_fixture()

      {:ok, spam_report} = Moderation.create_report(reporter, %{
        target_type: :user, target_id: target1.id, category: :spam
      })
      {:ok, _} = Moderation.create_report(reporter, %{
        target_type: :user, target_id: target2.id, category: :harassment
      })

      reports = Moderation.list_reports(category: :spam)
      assert length(reports) == 1
      assert hd(reports).id == spam_report.id
    end

    test "list_reports/1 can filter by priority" do
      reporter = user_fixture()
      target1 = user_fixture()
      target2 = user_fixture()

      {:ok, critical_report} = Moderation.create_report(reporter, %{
        target_type: :user, target_id: target1.id, category: :csam
      })
      {:ok, _} = Moderation.create_report(reporter, %{
        target_type: :user, target_id: target2.id, category: :spam
      })

      reports = Moderation.list_reports(priority: :critical)
      assert length(reports) == 1
      assert hd(reports).id == critical_report.id
    end

    test "list_user_reports/2 returns reports by a specific user" do
      reporter1 = user_fixture()
      reporter2 = user_fixture()
      target = user_fixture()

      {:ok, report1} = Moderation.create_report(reporter1, %{
        target_type: :user, target_id: target.id, category: :spam
      })
      {:ok, _} = Moderation.create_report(reporter2, %{
        target_type: :user, target_id: target.id, category: :harassment
      })

      reports = Moderation.list_user_reports(reporter1.id)
      assert length(reports) == 1
      assert hd(reports).id == report1.id
    end

    test "get_user_report/2 returns report belonging to user" do
      reporter = user_fixture()
      {report, _} = report_fixture(reporter)

      found = Moderation.get_user_report(reporter.id, report.id)
      assert found.id == report.id
    end

    test "get_user_report/2 returns nil for other users reports" do
      reporter = user_fixture()
      other_user = user_fixture()
      {report, _} = report_fixture(reporter)

      assert is_nil(Moderation.get_user_report(other_user.id, report.id))
    end

    test "pending_report_counts/0 returns counts by priority" do
      reporter = user_fixture()
      target1 = user_fixture()
      target2 = user_fixture()
      target3 = user_fixture()

      # Create reports with different priorities
      {:ok, _} = Moderation.create_report(reporter, %{
        target_type: :user, target_id: target1.id, category: :csam
      })
      {:ok, _} = Moderation.create_report(reporter, %{
        target_type: :user, target_id: target2.id, category: :harassment
      })
      {:ok, _} = Moderation.create_report(reporter, %{
        target_type: :user, target_id: target3.id, category: :spam
      })

      counts = Moderation.pending_report_counts()
      assert Map.get(counts, :critical) == 1
      assert Map.get(counts, :high) == 1
      assert Map.get(counts, :normal) == 1
    end
  end

  describe "report review" do
    test "review_report/3 requires admin privileges" do
      reporter = user_fixture()
      regular_user = user_fixture()
      {report, _} = report_fixture(reporter)

      assert {:error, :unauthorized} = Moderation.review_report(
        regular_user, report.id, %{action: :dismiss}
      )
    end

    test "review_report/3 with dismiss action" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, _} = report_fixture(reporter)

      assert {:ok, reviewed} = Moderation.review_report(admin, report.id, %{action: :dismiss})
      assert reviewed.status == :dismissed
      assert reviewed.reviewed_at != nil
    end

    test "review_report/3 with warn action" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, _} = report_fixture(reporter)

      assert {:ok, reviewed} = Moderation.review_report(admin, report.id, %{
        action: :warn,
        notes: "First warning for spam behavior"
      })
      assert reviewed.status == :resolved
    end

    test "review_report/3 with remove_content action" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, _} = report_fixture(reporter)

      assert {:ok, reviewed} = Moderation.review_report(admin, report.id, %{
        action: :remove_content
      })
      assert reviewed.status == :resolved
    end

    test "review_report/3 with suspend action creates restriction" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, target} = report_fixture(reporter)

      # Verify no restriction before
      refute Moderation.user_restricted?(target.id)

      assert {:ok, reviewed} = Moderation.review_report(admin, report.id, %{
        action: :suspend,
        duration_hours: 24,
        notes: "Suspended for harassment"
      })

      assert reviewed.status == :resolved
      assert Moderation.user_restricted?(target.id)

      restriction = Moderation.get_user_restriction(target.id)
      assert restriction.type == :suspended
      assert restriction.expires_at != nil
    end

    test "review_report/3 with ban action creates permanent restriction" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, target} = report_fixture(reporter)

      assert {:ok, reviewed} = Moderation.review_report(admin, report.id, %{
        action: :ban,
        notes: "Permanent ban for CSAM"
      })

      assert reviewed.status == :resolved
      assert Moderation.user_restricted?(target.id)

      restriction = Moderation.get_user_restriction(target.id)
      assert restriction.type == :banned
      assert restriction.expires_at == nil  # Permanent
    end

    test "review_report/3 creates audit trail with review action" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, _} = report_fixture(reporter)

      {:ok, _} = Moderation.review_report(admin, report.id, %{
        action: :warn,
        notes: "Test notes for audit"
      })

      # Verify review action was created
      [action] = Repo.all(from a in ReviewAction, where: a.report_id == ^report.id)
      assert action.reviewer_id == admin.id
      assert action.action == :warn
      assert action.notes == "Test notes for audit"
    end

    test "review_report/3 with non-existent report returns error" do
      admin = admin_user_fixture()
      fake_id = Ecto.UUID.generate()

      assert {:error, :not_found} = Moderation.review_report(admin, fake_id, %{action: :dismiss})
    end
  end

  describe "user restrictions" do
    test "create_user_restriction/3 with suspension" do
      user = user_fixture()

      {:ok, restriction} = Moderation.create_user_restriction(user.id, :suspended, 48)

      assert restriction.type == :suspended
      assert restriction.active == true
      assert restriction.expires_at != nil

      # Check expiration is roughly 48 hours from now
      diff = DateTime.diff(restriction.expires_at, DateTime.utc_now(), :hour)
      assert diff >= 47 and diff <= 49
    end

    test "create_user_restriction/3 with permanent ban" do
      user = user_fixture()

      {:ok, restriction} = Moderation.create_user_restriction(user.id, :banned, nil)

      assert restriction.type == :banned
      assert restriction.active == true
      assert restriction.expires_at == nil
    end

    test "user_restricted?/1 returns true for active restriction" do
      user = user_fixture()
      {:ok, _} = Moderation.create_user_restriction(user.id, :suspended, 24)

      assert Moderation.user_restricted?(user.id)
    end

    test "user_restricted?/1 returns false for expired restriction" do
      user = user_fixture()

      # Create an already-expired restriction
      expires_at = DateTime.add(DateTime.utc_now(), -3600, :second)
      %UserRestriction{}
      |> UserRestriction.changeset(%{
        user_id: user.id,
        type: :suspended,
        expires_at: expires_at
      })
      |> Repo.insert!()

      refute Moderation.user_restricted?(user.id)
    end

    test "user_restricted?/1 returns false for deactivated restriction" do
      user = user_fixture()

      %UserRestriction{}
      |> UserRestriction.changeset(%{
        user_id: user.id,
        type: :suspended,
        expires_at: DateTime.add(DateTime.utc_now(), 86_400, :second),
        active: false
      })
      |> Repo.insert!()

      refute Moderation.user_restricted?(user.id)
    end

    test "user_restricted?/1 returns true for permanent ban" do
      user = user_fixture()
      {:ok, _} = Moderation.create_user_restriction(user.id, :banned, nil)

      assert Moderation.user_restricted?(user.id)
    end

    test "get_user_restriction/1 returns active restriction" do
      user = user_fixture()
      {:ok, created} = Moderation.create_user_restriction(user.id, :suspended, 24)

      found = Moderation.get_user_restriction(user.id)
      assert found.id == created.id
    end

    test "get_user_restriction/1 returns nil for unrestricted user" do
      user = user_fixture()
      assert is_nil(Moderation.get_user_restriction(user.id))
    end

    test "active_restriction_count/0 returns count of active restrictions" do
      user1 = user_fixture()
      user2 = user_fixture()
      user3 = user_fixture()

      {:ok, _} = Moderation.create_user_restriction(user1.id, :suspended, 24)
      {:ok, _} = Moderation.create_user_restriction(user2.id, :banned, nil)

      # Create an expired restriction for user3
      expires_at = DateTime.add(DateTime.utc_now(), -3600, :second)
      %UserRestriction{}
      |> UserRestriction.changeset(%{
        user_id: user3.id,
        type: :suspended,
        expires_at: expires_at
      })
      |> Repo.insert!()

      assert Moderation.active_restriction_count() == 2
    end
  end

  describe "appeals" do
    test "create_appeal/3 creates appeal for moderation action" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, target} = report_fixture(reporter)

      # Suspend the target
      {:ok, _} = Moderation.review_report(admin, report.id, %{
        action: :suspend,
        duration_hours: 24
      })

      # Get the review action
      [action] = Repo.all(from a in ReviewAction, where: a.report_id == ^report.id)

      # Target appeals
      {:ok, appeal} = Moderation.create_appeal(target, action.id, %{
        reason: "I did not harass anyone. This is a misunderstanding and I can provide context."
      })

      assert appeal.user_id == target.id
      assert appeal.review_action_id == action.id
      assert appeal.status == :pending
      assert appeal.reason =~ "misunderstanding"
    end

    test "create_appeal/3 requires minimum reason length" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, target} = report_fixture(reporter)

      {:ok, _} = Moderation.review_report(admin, report.id, %{action: :warn})
      [action] = Repo.all(from a in ReviewAction, where: a.report_id == ^report.id)

      {:error, changeset} = Moderation.create_appeal(target, action.id, %{
        reason: "Short"
      })

      assert "should be at least 20 character(s)" in errors_on(changeset).reason
    end

    test "create_appeal/3 prevents duplicate appeals" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, target} = report_fixture(reporter)

      {:ok, _} = Moderation.review_report(admin, report.id, %{action: :warn})
      [action] = Repo.all(from a in ReviewAction, where: a.report_id == ^report.id)

      reason = "This is a valid appeal reason with enough characters."
      {:ok, _} = Moderation.create_appeal(target, action.id, %{reason: reason})
      {:error, :already_appealed} = Moderation.create_appeal(target, action.id, %{reason: reason})
    end

    test "create_appeal/3 rejects appeal from wrong user" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      other_user = user_fixture()
      {report, _target} = report_fixture(reporter)

      {:ok, _} = Moderation.review_report(admin, report.id, %{action: :warn})
      [action] = Repo.all(from a in ReviewAction, where: a.report_id == ^report.id)

      {:error, :unauthorized} = Moderation.create_appeal(other_user, action.id, %{
        reason: "This is a valid appeal reason with enough characters."
      })
    end

    test "review_appeal/3 approves and lifts restriction" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, target} = report_fixture(reporter)

      # Suspend the target
      {:ok, _} = Moderation.review_report(admin, report.id, %{
        action: :suspend,
        duration_hours: 24
      })
      [action] = Repo.all(from a in ReviewAction, where: a.report_id == ^report.id)

      # Verify target is restricted
      assert Moderation.user_restricted?(target.id)

      # Target appeals
      {:ok, appeal} = Moderation.create_appeal(target, action.id, %{
        reason: "I did not harass anyone. This is a misunderstanding and I can provide context."
      })

      # Admin approves appeal
      {:ok, reviewed_appeal} = Moderation.review_appeal(admin, appeal.id, %{
        approved: true,
        notes: "Appeal accepted, restriction lifted."
      })

      assert reviewed_appeal.status == :approved
      assert reviewed_appeal.reviewer_id == admin.id

      # Verify restriction is lifted
      refute Moderation.user_restricted?(target.id)
    end

    test "review_appeal/3 denies appeal" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, target} = report_fixture(reporter)

      {:ok, _} = Moderation.review_report(admin, report.id, %{
        action: :suspend,
        duration_hours: 24
      })
      [action] = Repo.all(from a in ReviewAction, where: a.report_id == ^report.id)

      {:ok, appeal} = Moderation.create_appeal(target, action.id, %{
        reason: "This is a valid appeal reason with enough characters."
      })

      {:ok, reviewed} = Moderation.review_appeal(admin, appeal.id, %{
        approved: false,
        notes: "Evidence clearly shows violation"
      })

      assert reviewed.status == :denied
      # Restriction should still be active
      assert Moderation.user_restricted?(target.id)
    end

    test "review_appeal/3 requires admin privileges" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      regular_user = user_fixture()
      {report, target} = report_fixture(reporter)

      {:ok, _} = Moderation.review_report(admin, report.id, %{action: :warn})
      [action] = Repo.all(from a in ReviewAction, where: a.report_id == ^report.id)

      {:ok, appeal} = Moderation.create_appeal(target, action.id, %{
        reason: "This is a valid appeal reason with enough characters."
      })

      {:error, :unauthorized} = Moderation.review_appeal(regular_user, appeal.id, %{
        approved: true
      })
    end

    test "list_appeals/1 returns pending appeals" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report, target} = report_fixture(reporter)

      {:ok, _} = Moderation.review_report(admin, report.id, %{action: :warn})
      [action] = Repo.all(from a in ReviewAction, where: a.report_id == ^report.id)

      {:ok, appeal} = Moderation.create_appeal(target, action.id, %{
        reason: "This is a valid appeal reason with enough characters."
      })

      appeals = Moderation.list_appeals()
      assert length(appeals) == 1
      assert hd(appeals).id == appeal.id
    end
  end

  describe "statistics" do
    test "reports_reviewed_today/0 counts today's reviews" do
      reporter = user_fixture()
      admin = admin_user_fixture()
      {report1, _} = report_fixture(reporter)
      {report2, _} = report_fixture(reporter)
      {report3, _} = report_fixture(reporter)

      # Review two reports
      {:ok, _} = Moderation.review_report(admin, report1.id, %{action: :dismiss})
      {:ok, _} = Moderation.review_report(admin, report2.id, %{action: :warn})

      # Leave one pending
      _ = report3

      assert Moderation.reports_reviewed_today() == 2
    end

    test "report_categories/0 returns all valid categories" do
      categories = Moderation.report_categories()

      assert :csam in categories
      assert :terrorism in categories
      assert :harassment in categories
      assert :spam in categories
      assert :other in categories
      assert length(categories) == 13
    end
  end

  describe "Report schema" do
    test "changeset validates required fields" do
      changeset = Report.changeset(%Report{}, %{})

      refute changeset.valid?
      assert "can't be blank" in errors_on(changeset).target_type
      assert "can't be blank" in errors_on(changeset).target_id
      assert "can't be blank" in errors_on(changeset).category
      assert "can't be blank" in errors_on(changeset).reporter_id
    end

    test "changeset validates category values" do
      changeset = Report.changeset(%Report{}, %{
        target_type: :user,
        target_id: Ecto.UUID.generate(),
        category: :invalid_category,
        reporter_id: Ecto.UUID.generate()
      })

      refute changeset.valid?
      assert errors_on(changeset).category != nil
    end
  end

  describe "ReviewAction schema" do
    test "changeset requires duration for suspensions" do
      changeset = ReviewAction.changeset(%ReviewAction{}, %{
        report_id: Ecto.UUID.generate(),
        reviewer_id: Ecto.UUID.generate(),
        action: :suspend
        # Missing duration_hours
      })

      refute changeset.valid?
      assert "is required for suspensions" in errors_on(changeset).duration_hours
    end

    test "changeset validates duration range" do
      changeset = ReviewAction.changeset(%ReviewAction{}, %{
        report_id: Ecto.UUID.generate(),
        reviewer_id: Ecto.UUID.generate(),
        action: :suspend,
        duration_hours: 9000  # More than 8760 (1 year)
      })

      refute changeset.valid?
      assert "must be less than or equal to 8760" in errors_on(changeset).duration_hours
    end
  end

  describe "UserRestriction schema" do
    test "changeset requires expiration for suspensions" do
      changeset = UserRestriction.changeset(%UserRestriction{}, %{
        user_id: Ecto.UUID.generate(),
        type: :suspended
        # Missing expires_at
      })

      refute changeset.valid?
      assert "is required for suspensions" in errors_on(changeset).expires_at
    end

    test "changeset rejects expiration for bans" do
      changeset = UserRestriction.changeset(%UserRestriction{}, %{
        user_id: Ecto.UUID.generate(),
        type: :banned,
        expires_at: DateTime.add(DateTime.utc_now(), 86_400, :second)
      })

      refute changeset.valid?
      assert "should not be set for permanent bans" in errors_on(changeset).expires_at
    end
  end

  describe "Appeal schema" do
    test "changeset validates reason length" do
      changeset = Appeal.changeset(%Appeal{}, %{
        user_id: Ecto.UUID.generate(),
        review_action_id: Ecto.UUID.generate(),
        reason: "Too short"
      })

      refute changeset.valid?
      assert "should be at least 20 character(s)" in errors_on(changeset).reason
    end

    test "changeset accepts valid reason" do
      changeset = Appeal.changeset(%Appeal{}, %{
        user_id: Ecto.UUID.generate(),
        review_action_id: Ecto.UUID.generate(),
        reason: "This is a valid appeal reason with enough characters to meet the minimum."
      })

      assert changeset.valid?
    end
  end
end
