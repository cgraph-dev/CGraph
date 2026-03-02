defmodule CGraphWeb.Plugs.LevelGatePlug do
  @moduledoc """
  Plug for level-gated feature access control.

  Checks the current user's level against the required level for a
  specific feature. Returns 403 with level requirement info when
  the user has not reached the required level.

  ## Usage

  ### In Router (via pipeline)

      pipeline :level_gate_marketplace do
        plug CGraphWeb.Plugs.LevelGatePlug, feature: :marketplace
      end

      scope "/marketplace" do
        pipe_through [:level_gate_marketplace]
        get "/", MarketplaceController, :index
      end

  ### In Controller

      plug CGraphWeb.Plugs.LevelGatePlug, feature: :shop
        when action in [:index, :show, :purchase]

  ## Response (403 Forbidden)

      {
        "error": "level_required",
        "message": "Reach level 15 to unlock this feature",
        "required_level": 15,
        "current_level": 8,
        "feature": "marketplace"
      }
  """

  import Plug.Conn

  alias CGraph.Gamification.FeatureGates

  @doc "Initialize the plug with the feature to gate."
  @spec init(keyword()) :: keyword()
  def init(opts), do: opts

  @doc """
  Check user level against feature requirement.

  If the user is not authenticated (nil), the plug passes through
  and lets the auth plug handle the 401. If the feature is unknown,
  it defaults to unlocked (permissive).
  """
  @spec call(Plug.Conn.t(), keyword()) :: Plug.Conn.t()
  def call(conn, feature: feature) do
    # Allow bypass in test environment via application config
    if Application.get_env(:cgraph, :bypass_level_gates, false) do
      conn
    else
      do_gate(conn, feature)
    end
  end

  defp do_gate(conn, feature) do
    user = conn.assigns[:current_user]

    cond do
      is_nil(user) ->
        # Let the auth plug handle unauthenticated requests
        conn

      FeatureGates.unlocked?(user.level, feature) ->
        conn

      true ->
        required = FeatureGates.required_level(feature)

        conn
        |> put_resp_content_type("application/json")
        |> send_resp(
          403,
          Jason.encode!(%{
            error: "level_required",
            message: "Reach level #{required} to unlock this feature",
            required_level: required,
            current_level: user.level,
            feature: Atom.to_string(feature)
          })
        )
        |> halt()
    end
  end
end
