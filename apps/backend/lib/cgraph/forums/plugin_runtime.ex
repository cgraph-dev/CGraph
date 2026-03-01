defmodule CGraph.Forums.PluginRuntime do
  @moduledoc """
  Plugin execution runtime for forums.

  Dispatches hook events to active plugins and executes their handlers
  via Task.Supervisor.async_nolink for isolation. One plugin failure
  must not affect other plugins or the calling process.
  """

  alias CGraph.Forums.Plugins
  require Logger

  @supported_events ~w(
    thread_created thread_updated thread_deleted
    post_created post_updated post_deleted
    vote_cast poll_voted
    member_joined member_left member_banned
    report_filed moderation_action
    theme_changed settings_updated
  )a

  @doc """
  Dispatch a hook event to all active plugins listening for it.

  Fires hooks asynchronously via Task.Supervisor — callers are never blocked.
  Returns `:ok` immediately.

  ## Parameters
    - `forum_id` — The forum where the event occurred
    - `hook_event` — One of the supported event atoms
    - `payload` — Event-specific data map
  """
  @spec dispatch(String.t(), atom(), map()) :: :ok
  def dispatch(forum_id, hook_event, payload \\ %{})
      when is_binary(forum_id) and is_atom(hook_event) do
    unless hook_event in @supported_events do
      Logger.warning("[PluginRuntime] Unknown hook event: #{inspect(hook_event)}")
      :ok
    else
      Task.Supervisor.start_child(CGraph.TaskSupervisor, fn ->
        do_dispatch(forum_id, hook_event, payload)
      end)

      :ok
    end
  end

  @doc """
  Returns the list of supported hook events.
  """
  @spec supported_events() :: [atom()]
  def supported_events, do: @supported_events

  # ---------------------------------------------------------------------------
  # Internal
  # ---------------------------------------------------------------------------

  defp do_dispatch(forum_id, hook_event, payload) do
    hook_string = Atom.to_string(hook_event)
    plugins = Plugins.get_plugins_for_hook(forum_id, hook_string)

    if Enum.empty?(plugins) do
      :ok
    else
      Logger.info("[PluginRuntime] Dispatching :#{hook_event} to #{length(plugins)} plugin(s) in forum #{forum_id}")

      Enum.each(plugins, fn plugin ->
        execute_hook(plugin, hook_event, payload)
      end)
    end
  end

  @doc """
  Execute a single plugin hook handler in isolation.

  Wraps execution in try/rescue so one plugin failure cannot affect others.
  """
  @spec execute_hook(struct(), atom(), map()) :: :ok | {:error, term()}
  def execute_hook(plugin, hook_event, payload) do
    try do
      hook_handler = get_in(plugin.settings, ["hooks", Atom.to_string(hook_event)])

      case hook_handler do
        nil ->
          Logger.debug("[PluginRuntime] Plugin #{plugin.plugin_id} has no handler for :#{hook_event}")
          :ok

        handler when is_binary(handler) ->
          execute_handler_code(plugin, hook_event, handler, payload)

        handler when is_map(handler) ->
          action = Map.get(handler, "action", "log")
          execute_action(plugin, hook_event, action, payload)

        _ ->
          Logger.warning("[PluginRuntime] Invalid handler for #{plugin.plugin_id}:#{hook_event}")
          :ok
      end
    rescue
      error ->
        Logger.error(
          "[PluginRuntime] Plugin #{plugin.plugin_id} failed on :#{hook_event}: #{Exception.message(error)}"
        )
        {:error, error}
    end
  end

  defp execute_handler_code(plugin, hook_event, _handler_code, payload) do
    # In production this would evaluate sandboxed plugin code.
    # For now we log and return the payload for testability.
    Logger.info(
      "[PluginRuntime] Executed handler for #{plugin.plugin_id}:#{hook_event} " <>
        "payload_keys=#{inspect(Map.keys(payload))}"
    )
    :ok
  end

  defp execute_action(plugin, hook_event, action, payload) do
    Logger.info(
      "[PluginRuntime] Action '#{action}' for #{plugin.plugin_id}:#{hook_event} " <>
        "payload_keys=#{inspect(Map.keys(payload))}"
    )

    case action do
      "log" -> :ok
      "notify" -> :ok
      "webhook" -> :ok
      _ ->
        Logger.warning("[PluginRuntime] Unknown action '#{action}' for #{plugin.plugin_id}")
        :ok
    end
  end
end
