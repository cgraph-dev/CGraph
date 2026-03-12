defmodule CGraph.Enterprise.WhiteLabel do
  @moduledoc """
  White-label branding configuration for enterprise organizations.

  Reads branding from OrgSettings and resolves theme variables
  (colors, logos, fonts) for white-label deployments.
  """

  alias CGraph.Repo
  alias CGraph.Enterprise.OrgSettings

  import Ecto.Query

  @default_branding %{
    "primary_color" => "#6366f1",
    "secondary_color" => "#8b5cf6",
    "accent_color" => "#06b6d4",
    "logo_url" => nil,
    "favicon_url" => nil,
    "font_family" => "Inter, system-ui, sans-serif",
    "app_name" => "CGraph"
  }

  @doc "Get branding configuration for an organization."
  @spec get_branding(String.t()) :: {:ok, map()}
  def get_branding(org_id) do
    case fetch_settings(org_id) do
      {:ok, settings} ->
        branding = Map.merge(@default_branding, settings.branding || %{})
        {:ok, branding}

      _ ->
        {:ok, @default_branding}
    end
  end

  @doc "Apply branding and return CSS custom properties map."
  @spec apply_theme(String.t()) :: {:ok, map()}
  def apply_theme(org_id) do
    {:ok, branding} = get_branding(org_id)

    css_vars = %{
      "--cgraph-primary" => branding["primary_color"],
      "--cgraph-secondary" => branding["secondary_color"],
      "--cgraph-accent" => branding["accent_color"],
      "--cgraph-font" => branding["font_family"],
      "--cgraph-app-name" => branding["app_name"]
    }

    {:ok,
     %{
       branding: branding,
       css_variables: css_vars
     }}
  end

  @doc "Update branding for an organization."
  @spec update_branding(String.t(), map()) :: {:ok, map()} | {:error, Ecto.Changeset.t()}
  def update_branding(org_id, branding_params) do
    case fetch_settings(org_id) do
      {:ok, settings} ->
        merged = Map.merge(settings.branding || %{}, branding_params)
        changeset = OrgSettings.changeset(settings, %{"branding" => merged})
        Repo.update(changeset)

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp fetch_settings(org_id) do
    case Repo.one(from(s in OrgSettings, where: s.org_id == ^org_id)) do
      nil -> {:error, :not_found}
      settings -> {:ok, settings}
    end
  end
end
