defmodule CGraph.Moderation.AutoAction do
  @moduledoc """
  AI auto-action pipeline for content moderation.

  When `CGraph.AI.Moderation.check/2` returns `:block` with confidence
  above the threshold, this module automatically creates a report and
  applies enforcement actions (warn/mute/remove) without requiring
  moderator intervention.

  Lower-confidence detections are flagged for human review instead.

  ## Pipeline

      Content → AI check → High confidence?
        ├─ Yes → Auto-enforce + audit log
        └─ No  → Flag for review + audit log
  """

  alias CGraph.Moderation.{AuditLogs, Enforcement, Reports}
  alias CGraph.AI.Moderation, as: AIModeration
  alias CGraph.Accounts.User
  alias CGraph.Repo

  import Ecto.Query

  require Logger

  @high_confidence_threshold 0.9
  @auto_action_categories ~w(spam hate_speech violence sexual)a

  @doc """
  Process a content item through AI moderation and auto-action if high confidence.

  Called asynchronously via `CGraph.Workers.ModerationWorker`.

  ## Options

  - `:user_id` (required) - ID of the content author
  - `:target_id` (required) - ID of the content item
  - `:type` - Content type: "message", "post", "comment" (default: "message")
  - `:content_type` - Media type: "text", "image" (default: "text")

  ## Returns

  - `:ok` on success
  - `{:error, reason}` on failure
  """
  @spec process(String.t(), keyword()) :: :ok | {:error, term()}
  def process(content, opts \\ []) do
    user_id = Keyword.fetch!(opts, :user_id)
    target_type = Keyword.get(opts, :type, "message")
    target_id = Keyword.fetch!(opts, :target_id)
    content_type = Keyword.get(opts, :content_type, "text")

    case AIModeration.check(content, content_type: content_type) do
      {:ok, %{action: :block, confidence: confidence, categories: categories}}
      when confidence >= @high_confidence_threshold ->
        primary_category = List.first(categories)

        if category_atom(primary_category) in @auto_action_categories do
          auto_enforce(user_id, target_type, target_id, primary_category, confidence)
        else
          flag_for_review(user_id, target_type, target_id, primary_category, confidence)
        end

      {:ok, %{action: :block, confidence: confidence, categories: categories}} ->
        flag_for_review(user_id, target_type, target_id, List.first(categories), confidence)

      {:ok, %{action: :flag, confidence: confidence, categories: categories}} ->
        flag_for_review(user_id, target_type, target_id, List.first(categories), confidence)

      {:ok, %{action: :allow, confidence: confidence}} ->
        AuditLogs.log(%{
          target_type: target_type,
          target_id: to_string(target_id),
          action: "ai_allow",
          ai_confidence: confidence,
          ai_action: "allow"
        })

        :ok

      {:error, reason} ->
        Logger.error("ai_moderation_check_failed", reason: inspect(reason))
        {:error, reason}
    end
  end

  # ---------------------------------------------------------------------------
  # Private — Auto-Enforce
  # ---------------------------------------------------------------------------

  defp auto_enforce(user_id, target_type, target_id, category, confidence) do
    Logger.info("auto_enforce_moderation",
      user_id: user_id,
      target_type: target_type,
      category: to_string(category),
      confidence: confidence
    )

    # Use a system user for automated report creation
    system_user = get_system_user()

    with {:ok, report} <-
           Reports.create_report(system_user, %{
             target_type: safe_target_type(target_type),
             target_id: to_string(target_id),
             category: category_atom(category),
             description:
               "Auto-flagged by AI (#{category}, confidence: #{Float.round(confidence, 3)})"
           }),
         action = enforcement_action(category_atom(category)),
         {:ok, _report} <-
           Enforcement.review_report(system_user, report.id, %{
             action: action,
             notes: "Automated AI moderation action (confidence: #{Float.round(confidence, 3)})"
           }) do
      AuditLogs.log(%{
        target_type: target_type,
        target_id: to_string(target_id),
        report_id: report.id,
        action: "ai_block",
        ai_category: to_string(category),
        ai_confidence: confidence,
        ai_action: "block",
        auto_actioned: true
      })

      :ok
    else
      {:error, reason} ->
        Logger.error("auto_enforce_failed",
          user_id: user_id,
          reason: inspect(reason)
        )

        {:error, reason}
    end
  end

  # ---------------------------------------------------------------------------
  # Private — Flag for Review
  # ---------------------------------------------------------------------------

  defp flag_for_review(_user_id, target_type, target_id, category, confidence) do
    system_user = get_system_user()

    case Reports.create_report(system_user, %{
           target_type: safe_target_type(target_type),
           target_id: to_string(target_id),
           category: category_atom(category) || :other,
           description:
             "Flagged by AI for review (#{category}, confidence: #{Float.round(confidence, 3)})"
         }) do
      {:ok, report} ->
        AuditLogs.log(%{
          target_type: target_type,
          target_id: to_string(target_id),
          report_id: report.id,
          action: "ai_flag",
          ai_category: to_string(category),
          ai_confidence: confidence,
          ai_action: "flag",
          auto_actioned: false
        })

        :ok

      {:error, :duplicate} ->
        # Already reported, just log
        :ok

      {:error, reason} ->
        Logger.error("flag_for_review_failed", reason: inspect(reason))
        {:error, reason}
    end
  end

  # ---------------------------------------------------------------------------
  # Private — Helpers
  # ---------------------------------------------------------------------------

  defp enforcement_action(:spam), do: :warn
  defp enforcement_action(:hate_speech), do: :warn
  defp enforcement_action(:violence), do: :remove_content
  defp enforcement_action(:sexual), do: :remove_content
  defp enforcement_action(_), do: :warn

  defp category_atom(nil), do: nil
  defp category_atom(cat) when is_atom(cat), do: cat

  defp category_atom(cat) when is_binary(cat) do
    String.to_existing_atom(cat)
  rescue
    ArgumentError -> :other
  end

  defp safe_target_type("message"), do: :message
  defp safe_target_type("post"), do: :post
  defp safe_target_type("comment"), do: :comment
  defp safe_target_type("user"), do: :user
  defp safe_target_type("forum"), do: :forum
  defp safe_target_type("group"), do: :group
  defp safe_target_type(type) when is_atom(type), do: type
  defp safe_target_type(_), do: :message

  defp get_system_user do
    # Use a configured system user for automated actions, or fall back to first admin
    case Application.get_env(:cgraph, :system_user_id) do
      nil ->
        Repo.one(
          from(u in User,
            where: u.is_admin == true,
            limit: 1,
            order_by: [asc: u.inserted_at]
          )
        ) || raise "No admin user found for AI auto-action system"

      id ->
        # get! safe: ID from system config (AI_MODERATOR_USER_ID)
        Repo.get!(User, id)
    end
  end
end
