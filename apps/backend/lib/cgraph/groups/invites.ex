defmodule CGraph.Groups.Invites do
  @moduledoc """
  Invite operations for groups.

  Handles invite CRUD, join-via-invite, and invite code generation.
  """

  import Ecto.Query, warn: false

  alias CGraph.Groups.{Invite, Member}
  alias CGraph.Repo

  # ============================================================================
  # Invite CRUD
  # ============================================================================

  @doc "List invites for a group."
  @spec list_invites(struct()) :: list()
  def list_invites(group) do
    from(i in Invite,
      where: i.group_id == ^group.id,
      preload: [:creator]
    )
    |> Repo.all()
  end

  @doc "Get a specific invite by group and invite ID."
  @spec get_invite(struct(), binary()) :: Invite.t() | nil
  def get_invite(group, invite_id) do
    from(i in Invite,
      where: i.id == ^invite_id,
      where: i.group_id == ^group.id,
      preload: [:creator, :group]
    )
    |> Repo.one()
  end

  @doc "Get an invite by its code."
  @spec get_invite_by_code(binary()) :: Invite.t() | nil
  def get_invite_by_code(code) do
    from(i in Invite,
      where: i.code == ^code,
      preload: [:creator, :group]
    )
    |> Repo.one()
  end

  @doc "Create an invite with default options."
  @spec create_invite(struct(), struct(), map() | list()) :: {:ok, Invite.t()} | {:error, Ecto.Changeset.t()}
  def create_invite(group, user, opts \\ %{})

  def create_invite(group, user, opts) when is_map(opts) do
    create_invite_impl(group, user, opts)
  end

  def create_invite(group, user, opts) when is_list(opts) do
    create_invite_impl(group, user, Enum.into(opts, %{}))
  end

  @doc "Delete an invite."
  @spec delete_invite(Invite.t()) :: {:ok, Invite.t()}
  def delete_invite(invite) do
    Repo.delete!(invite)
    {:ok, invite}
  end

  # ============================================================================
  # Join via Invite
  # ============================================================================

  @doc "Join a group via an invite code. Atomically increments the use count."
  @spec join_via_invite(Invite.t(), struct()) :: {:ok, Member.t()} | {:error, any()}
  def join_via_invite(invite, user) do
    # Increment uses atomically
    from(i in Invite, where: i.id == ^invite.id)
    |> Repo.update_all(inc: [uses: 1])

    member_attrs = %{
      group_id: invite.group_id,
      user_id: user.id
    }

    %Member{}
    |> Member.changeset(member_attrs)
    |> Repo.insert()
  end

  # ============================================================================
  # Private Helpers
  # ============================================================================

  defp create_invite_impl(group, user, opts) do
    invite_attrs = %{
      group_id: group.id,
      creator_id: user.id,
      code: generate_invite_code(),
      max_uses: Map.get(opts, :max_uses) || Map.get(opts, "max_uses"),
      expires_at: Map.get(opts, :expires_at) || Map.get(opts, "expires_at")
    }

    %Invite{}
    |> Invite.changeset(invite_attrs)
    |> Repo.insert()
    |> case do
      {:ok, invite} -> {:ok, Repo.preload(invite, [:creator, :group])}
      error -> error
    end
  end

  defp generate_invite_code do
    :crypto.strong_rand_bytes(6)
    |> Base.url_encode64(padding: false)
    |> String.replace(~r/[^a-zA-Z0-9]/, "")
    |> String.slice(0, 8)
  end
end
