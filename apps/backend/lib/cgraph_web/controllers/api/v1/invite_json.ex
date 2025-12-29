defmodule CgraphWeb.API.V1.InviteJSON do
  @moduledoc """
  JSON rendering for invite responses.
  """

  alias CgraphWeb.API.V1.{UserJSON, GroupJSON}

  def index(%{invites: invites}) do
    %{data: Enum.map(invites, &invite_data/1)}
  end

  def show(%{invite: invite}) do
    %{data: invite_data(invite)}
  end

  def joined(%{member: member, group: group}) do
    %{
      data: %{
        member: CgraphWeb.API.V1.GroupMemberJSON.member_data(member),
        group: GroupJSON.group_data(group)
      }
    }
  end

  @doc """
  Render invite data.
  """
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
      Map.has_key?(invite, :inviter) && !match?(%Ecto.Association.NotLoaded{}, invite.inviter) -> invite.inviter
      Map.has_key?(invite, :created_by) && !match?(%Ecto.Association.NotLoaded{}, invite.created_by) -> invite.created_by
      true -> nil
    end
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
      icon: group.icon,
      member_count: Map.get(group, :member_count),
      description: group.description
    }
  end
end
