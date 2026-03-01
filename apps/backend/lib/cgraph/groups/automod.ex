defmodule CGraph.Groups.Automod do
  @moduledoc """
  Context for managing automated moderation rules on Groups.

  Provides CRUD operations for automod rules scoped to individual groups.
  Only group owners and users with the relevant permission can manage rules.
  """

  import Ecto.Query
  alias CGraph.Groups.AutomodRule
  alias CGraph.Repo

  @doc "List all automod rules for a group."
  @spec list_rules(Ecto.UUID.t()) :: [AutomodRule.t()]
  def list_rules(group_id) do
    AutomodRule
    |> where(group_id: ^group_id)
    |> order_by(asc: :inserted_at)
    |> Repo.all()
  end

  @doc "Get a single automod rule by id, scoped to a group."
  @spec get_rule(Ecto.UUID.t(), Ecto.UUID.t()) :: {:ok, AutomodRule.t()} | {:error, :not_found}
  def get_rule(group_id, rule_id) do
    case Repo.get_by(AutomodRule, id: rule_id, group_id: group_id) do
      nil -> {:error, :not_found}
      rule -> {:ok, rule}
    end
  end

  @doc "Create a new automod rule for a group."
  @spec create_rule(Ecto.UUID.t(), map()) :: {:ok, AutomodRule.t()} | {:error, Ecto.Changeset.t()}
  def create_rule(group_id, attrs) do
    %AutomodRule{}
    |> AutomodRule.changeset(attrs |> stringify_keys() |> Map.put("group_id", group_id))
    |> Repo.insert()
  end

  @doc "Update an existing automod rule."
  @spec update_rule(AutomodRule.t(), map()) :: {:ok, AutomodRule.t()} | {:error, Ecto.Changeset.t()}
  def update_rule(%AutomodRule{} = rule, attrs) do
    rule
    |> AutomodRule.changeset(attrs)
    |> Repo.update()
  end

  @doc "Delete an automod rule."
  @spec delete_rule(AutomodRule.t()) :: {:ok, AutomodRule.t()} | {:error, Ecto.Changeset.t()}
  def delete_rule(%AutomodRule{} = rule) do
    Repo.delete(rule)
  end

  @doc "Toggle the enabled state of a rule."
  @spec toggle_rule(AutomodRule.t()) :: {:ok, AutomodRule.t()} | {:error, Ecto.Changeset.t()}
  def toggle_rule(%AutomodRule{} = rule) do
    rule
    |> AutomodRule.changeset(%{is_enabled: !rule.is_enabled})
    |> Repo.update()
  end

  @doc "Get all enabled rules for a group."
  @spec get_enabled_rules(Ecto.UUID.t()) :: [AutomodRule.t()]
  def get_enabled_rules(group_id) do
    AutomodRule
    |> where(group_id: ^group_id, is_enabled: true)
    |> order_by(asc: :inserted_at)
    |> Repo.all()
  end

  @doc "Seed default automod rules for a newly created group."
  @spec seed_default_rules(Ecto.UUID.t()) :: :ok
  def seed_default_rules(group_id) do
    defaults = [
      %{
        "name" => "Basic Word Filter",
        "rule_type" => "word_filter",
        "pattern" => "spam,scam,phishing,nigger,faggot,retard",
        "action" => "delete",
        "is_enabled" => true,
        "group_id" => group_id
      },
      %{
        "name" => "Phishing Link Filter",
        "rule_type" => "link_filter",
        "pattern" => "bit.ly,tinyurl.com,grabify.link,iplogger.org",
        "action" => "flag_for_review",
        "is_enabled" => true,
        "group_id" => group_id
      }
    ]

    Enum.each(defaults, fn attrs ->
      %AutomodRule{}
      |> AutomodRule.changeset(attrs)
      |> Repo.insert()
    end)

    :ok
  end

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end
end
