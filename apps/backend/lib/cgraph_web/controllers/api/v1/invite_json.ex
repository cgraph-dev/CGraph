defmodule CGraphWeb.API.V1.InviteJSON do
  @moduledoc """
  JSON rendering for invite responses.
  """

  alias CGraphWeb.API.V1.{GroupJSON, GroupMemberJSON, UserJSON}

  @doc "Renders a list of resources as JSON."
  @spec index(map()) :: map()
  def index(%{invites: invites}) do
    %{data: Enum.map(invites, &invite_data/1), meta: %{total: length(invites)}}
  end

  @doc "Renders a single resource as JSON."
  @spec show(map()) :: map()
  def show(%{invite: invite}) do
    %{data: invite_data(invite), meta: %{}}
  end

  @doc "Renders join confirmation as JSON."
  @spec joined(map()) :: map()
  def joined(%{member: member, group: group}) do
    %{
      data: %{
        member: GroupMemberJSON.member_data(member),
        group: GroupJSON.group_data(group)
      },
      meta: %{}
    }
  end

  @doc """
  Render invite data.
  """
  @spec invite_data(struct()) :: map()
  def invite_data(invite) do
    %{
      id: invite.id,
      code: invite.code,
      group_id: invite.group_id,
      uses: invite.uses,
      max_uses: invite.max_uses,
      expires_at: invite.expires_at,
      revoked: Map.get(invite, :is_revoked, false),
      created_at: invite.inserted_at,
      # Include creator info if available (schema uses created_by not inviter)
      inviter: render_inviter(get_inviter(invite)),
      # Include group preview info if available
      group: render_group_preview(get_group(invite))
    }
  end

  # Get inviter handling both :inviter and :created_by associations
  defp get_inviter(invite) do
    cond do
      has_loaded_assoc?(invite, :inviter) ->
        invite.inviter

      has_loaded_assoc?(invite, :created_by) ->
        invite.created_by

      true ->
        nil
    end
  end

  defp has_loaded_assoc?(struct, key) do
    Map.has_key?(struct, key) && !match?(%Ecto.Association.NotLoaded{}, Map.get(struct, key))
  end

  # Get group handling NotLoaded
  defp get_group(invite) do
    case invite.group do
      %Ecto.Association.NotLoaded{} -> nil
      group -> group
    end
  end

  defp render_inviter(nil), do: nil
  defp render_inviter(%Ecto.Association.NotLoaded{}), do: nil
  defp render_inviter(user) do
    UserJSON.user_data(user)
  end

  defp render_group_preview(nil), do: nil
  defp render_group_preview(%Ecto.Association.NotLoaded{}), do: nil
  defp render_group_preview(group) do
    %{
      id: group.id,
      name: group.name,
      icon: Map.get(group, :icon_url) || Map.get(group, :icon),
      member_count: Map.get(group, :member_count),
      description: group.description
    }
  end
end
