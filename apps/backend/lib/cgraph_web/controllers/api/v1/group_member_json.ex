defmodule CgraphWeb.API.V1.GroupMemberJSON do
  @moduledoc """
  JSON rendering for group member responses.
  """

  alias CgraphWeb.API.V1.UserJSON

  def index(%{members: members, meta: meta}) do
    %{
      data: Enum.map(members, &member_data/1),
      meta: meta
    }
  end

  def show(%{member: member}) do
    %{data: member_data(member)}
  end

  def ban(%{ban: ban}) do
    %{data: ban_data(ban)}
  end

  def bans(%{bans: bans}) do
    %{data: Enum.map(bans, &ban_data/1)}
  end

  def transfer(%{group: group}) do
    %{
      data: %{
        id: group.id,
        owner_id: group.owner_id,
        message: "Ownership transferred successfully"
      }
    }
  end

  @doc """
  Render member data with user, roles, and status.
  """
  def member_data(member) do
    %{
      id: member.id,
      user_id: member.user_id,
      group_id: member.group_id,
      nickname: member.nickname,
      joined_at: member.inserted_at,
      muted_until: member.muted_until,
      roles: render_roles(member.roles),
      user: render_user(member.user)
    }
  end

  defp render_roles(nil), do: []
  defp render_roles(%Ecto.Association.NotLoaded{}), do: []
  defp render_roles(roles) when is_list(roles) do
    Enum.map(roles, fn role ->
      %{
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position
      }
    end)
  end

  defp render_user(nil), do: nil
  defp render_user(%Ecto.Association.NotLoaded{}), do: nil
  defp render_user(user) do
    UserJSON.user_data(user)
  end

  defp ban_data(ban) do
    %{
      id: ban.id,
      user_id: ban.user_id,
      group_id: ban.group_id,
      reason: ban.reason,
      banned_at: ban.inserted_at,
      expires_at: ban.expires_at,
      banned_by: render_user(ban.banned_by),
      user: render_user(ban.user)
    }
  end
end
