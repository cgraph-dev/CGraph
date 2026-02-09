defmodule CGraphWeb.API.V1.AutomodController do
  @moduledoc """
  REST controller for automod rule CRUD.

  All actions are scoped to a group and require the requesting user
  to be the group owner or have the `:manage_automod` permission.

  Routes (nested under `/api/v1/groups/:group_id`):
    GET    /automod/rules          => index
    GET    /automod/rules/:id      => show
    POST   /automod/rules          => create
    PATCH  /automod/rules/:id      => update
    DELETE /automod/rules/:id      => delete
    PATCH  /automod/rules/:id/toggle => toggle
  """

  use CGraphWeb, :controller
  action_fallback CGraphWeb.FallbackController

  alias CGraph.Groups
  alias CGraph.Groups.Automod

  # ── Index ────────────────────────────────────────────────────────────

  def index(conn, %{"group_id" => group_id}) do
    with :ok <- authorize_automod(conn, group_id) do
      rules = Automod.list_rules(group_id)
      json(conn, %{data: Enum.map(rules, &serialize_rule/1)})
    end
  end

  # ── Show ─────────────────────────────────────────────────────────────

  def show(conn, %{"group_id" => group_id, "id" => id}) do
    with :ok <- authorize_automod(conn, group_id),
         {:ok, rule} <- Automod.get_rule(group_id, id) do
      json(conn, %{data: serialize_rule(rule)})
    end
  end

  # ── Create ───────────────────────────────────────────────────────────

  def create(conn, %{"group_id" => group_id} = params) do
    with :ok <- authorize_automod(conn, group_id),
         {:ok, rule} <- Automod.create_rule(group_id, params) do
      conn
      |> put_status(:created)
      |> json(%{data: serialize_rule(rule)})
    end
  end

  # ── Update ───────────────────────────────────────────────────────────

  def update(conn, %{"group_id" => group_id, "id" => id} = params) do
    with :ok <- authorize_automod(conn, group_id),
         {:ok, rule} <- Automod.get_rule(group_id, id),
         {:ok, updated} <- Automod.update_rule(rule, params) do
      json(conn, %{data: serialize_rule(updated)})
    end
  end

  # ── Delete ───────────────────────────────────────────────────────────

  def delete(conn, %{"group_id" => group_id, "id" => id}) do
    with :ok <- authorize_automod(conn, group_id),
         {:ok, rule} <- Automod.get_rule(group_id, id),
         {:ok, _} <- Automod.delete_rule(rule) do
      send_resp(conn, :no_content, "")
    end
  end

  # ── Toggle ───────────────────────────────────────────────────────────

  def toggle(conn, %{"group_id" => group_id, "id" => id}) do
    with :ok <- authorize_automod(conn, group_id),
         {:ok, rule} <- Automod.get_rule(group_id, id),
         {:ok, toggled} <- Automod.toggle_rule(rule) do
      json(conn, %{data: serialize_rule(toggled)})
    end
  end

  # ── Helpers ──────────────────────────────────────────────────────────

  defp authorize_automod(conn, group_id) do
    user = conn.assigns.current_user

    case Groups.get_group(group_id) do
      nil ->
        {:error, :not_found}

      group ->
        if group.owner_id == user.id do
          :ok
        else
          {:error, :forbidden}
        end
    end
  end

  defp serialize_rule(rule) do
    %{
      id: rule.id,
      name: rule.name,
      rule_type: rule.rule_type,
      pattern: rule.pattern,
      action: rule.action,
      is_enabled: rule.is_enabled,
      group_id: rule.group_id,
      inserted_at: rule.inserted_at,
      updated_at: rule.updated_at
    }
  end
end
