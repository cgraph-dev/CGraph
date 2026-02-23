defmodule CGraph.SecuritySupervisor do
  @moduledoc "Supervisor for security-related processes including JWT key rotation, token blacklisting, and account lockout."
  use Supervisor

  @spec start_link(keyword()) :: Supervisor.on_start()
  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  @spec init(keyword()) :: {:ok, {Supervisor.sup_flags(), [Supervisor.child_spec()]}}
  def init(_init_arg) do
    children = [
      # JWT key rotation manager
      CGraph.Security.JWTKeyRotation,

      # Token blacklist for JWT revocation
      CGraph.Security.TokenBlacklist,

      # Account lockout for brute force protection
      CGraph.Security.AccountLockout
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end
