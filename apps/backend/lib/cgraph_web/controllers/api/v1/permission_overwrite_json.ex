defmodule CGraphWeb.API.V1.PermissionOverwriteJSON do
  @moduledoc """
  JSON rendering for permission overwrite responses.
  """
  alias CGraph.Groups.PermissionOverwrite

  @spec index(map()) :: map()
  def index(%{overwrites: overwrites}) do
    %{data: Enum.map(overwrites, &overwrite_data/1)}
  end

  @spec show(map()) :: map()
  def show(%{overwrite: overwrite}) do
    %{data: overwrite_data(overwrite)}
  end

  defp overwrite_data(%PermissionOverwrite{} = overwrite) do
    %{
      id: overwrite.id,
      channel_id: overwrite.channel_id,
      type: overwrite.type,
      role_id: overwrite.role_id,
      member_id: overwrite.member_id,
      allow: overwrite.allow,
      deny: overwrite.deny,
      created_at: overwrite.inserted_at,
      updated_at: overwrite.updated_at
    }
  end
end
