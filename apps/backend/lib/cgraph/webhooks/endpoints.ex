defmodule CGraph.Webhooks.Endpoints do
  @moduledoc """
  Webhook endpoint management operations.

  Handles CRUD operations for webhook endpoints including creation,
  updates, deletion, listing, and secret rotation.
  """

  require Logger
  import Ecto.Query

  alias CGraph.Repo
  alias CGraph.Webhooks.Endpoint

  @valid_events ~w(
    message.created message.updated message.deleted
    user.joined user.left user.updated
    channel.created channel.updated channel.deleted
    reaction.added reaction.removed
    file.uploaded file.deleted
    system.health system.maintenance
  )

  @doc """
  Create a new webhook endpoint.

  ## Options

  - `:url` - Webhook URL (required, must be HTTP(S))
  - `:events` - List of event types to subscribe to (default: `["*"]`)
  - `:secret` - Signing secret (auto-generated if not provided)
  - `:active` - Whether endpoint is active (default: true)
  - `:metadata` - Additional metadata map
  - `:description` - Human-readable description
  """
  @spec create_endpoint(map()) :: {:ok, map()} | {:error, term()}
  def create_endpoint(params) do
    case validate_endpoint_params(params) do
      :ok ->
        attrs = %{
          id: generate_endpoint_id(),
          url: params[:url] || params["url"],
          events: params[:events] || params["events"] || ["*"],
          secret: params[:secret] || params["secret"] || generate_secret(),
          active: get_param(params, :active, true),
          metadata: get_param(params, :metadata, %{}),
          description: params[:description] || params["description"],
          failure_count: 0
        }

        changeset = Endpoint.changeset(%Endpoint{}, attrs)

        case Repo.insert(changeset) do
          {:ok, endpoint} ->
            Logger.info("Webhook endpoint created", endpoint_id: endpoint.id, url: endpoint.url)
            {:ok, Endpoint.sanitize(endpoint)}

          {:error, changeset} ->
            {:error, changeset}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Update an existing endpoint.
  """
  @spec update_endpoint(String.t(), map()) :: {:ok, map()} | {:error, term()}
  def update_endpoint(endpoint_id, params) do
    case Repo.get(Endpoint, endpoint_id) do
      nil ->
        {:error, :not_found}

      endpoint ->
        update_attrs =
          %{}
          |> maybe_put(:url, params[:url] || params["url"])
          |> maybe_put(:events, params[:events] || params["events"])
          |> maybe_put(:active, params[:active])
          |> maybe_put(:metadata, params[:metadata] || params["metadata"])
          |> maybe_put(:description, params[:description] || params["description"])

        case Repo.update(Endpoint.changeset(endpoint, update_attrs)) do
          {:ok, updated} -> {:ok, Endpoint.sanitize(updated)}
          {:error, changeset} -> {:error, changeset}
        end
    end
  end

  @doc """
  Delete an endpoint and all its deliveries.
  """
  @spec delete_endpoint(String.t()) :: :ok | {:error, :not_found}
  def delete_endpoint(endpoint_id) do
    alias CGraph.Webhooks.Delivery

    case Repo.get(Endpoint, endpoint_id) do
      nil ->
        {:error, :not_found}

      endpoint ->
        from(d in Delivery, where: d.endpoint_id == ^endpoint_id)
        |> Repo.delete_all()

        Repo.delete(endpoint)
        Logger.info("Webhook endpoint deleted", endpoint_id: endpoint_id)
        :ok
    end
  end

  @doc """
  Get an endpoint by ID.
  """
  @spec get_endpoint(String.t()) :: {:ok, map()} | {:error, :not_found}
  def get_endpoint(endpoint_id) do
    case Repo.get(Endpoint, endpoint_id) do
      nil -> {:error, :not_found}
      endpoint -> {:ok, Endpoint.sanitize(endpoint)}
    end
  end

  @doc """
  List all endpoints, optionally filtered by `:active` or `:event`.
  """
  @spec list_endpoints(keyword()) :: {:ok, list()}
  def list_endpoints(opts \\ []) do
    query =
      from(e in Endpoint, order_by: [desc: e.inserted_at])
      |> maybe_where_active(opts[:active])

    endpoints =
      Repo.all(query)
      |> maybe_filter_event(opts[:event])
      |> Enum.map(&Endpoint.sanitize/1)

    {:ok, endpoints}
  end

  @doc """
  Rotate the signing secret for an endpoint.
  """
  @spec rotate_secret(String.t()) :: {:ok, map()} | {:error, term()}
  def rotate_secret(endpoint_id) do
    case Repo.get(Endpoint, endpoint_id) do
      nil ->
        {:error, :not_found}

      endpoint ->
        new_secret = generate_secret()

        case Repo.update(Ecto.Changeset.change(endpoint, %{secret: new_secret})) do
          {:ok, _updated} ->
            Logger.info("Webhook secret rotated", endpoint_id: endpoint_id)
            {:ok, %{secret: new_secret}}

          {:error, changeset} ->
            {:error, changeset}
        end
    end
  end

  @doc """
  Enable or disable an endpoint.
  """
  @spec set_active(String.t(), boolean()) :: {:ok, map()} | {:error, term()}
  def set_active(endpoint_id, active) when is_boolean(active) do
    update_endpoint(endpoint_id, %{active: active})
  end

  # -- Shared helpers (public for cross-module use) ---------------------------

  @doc false
  @spec event_matches?([String.t()], String.t()) :: boolean()
  def event_matches?(subscribed_events, event_type) do
    Enum.any?(subscribed_events, fn subscribed ->
      subscribed == "*" ||
        subscribed == event_type ||
        wildcard_match?(subscribed, event_type)
    end)
  end

  @doc false
  @spec valid_events() :: [String.t()]
  def valid_events, do: @valid_events

  # -- Private ----------------------------------------------------------------

  defp wildcard_match?(pattern, event) do
    if String.ends_with?(pattern, ".*") do
      prefix = String.trim_trailing(pattern, ".*")
      String.starts_with?(event, prefix <> ".")
    else
      false
    end
  end

  defp validate_endpoint_params(params) do
    url = params[:url] || params["url"]
    events = params[:events] || params["events"]

    cond do
      is_nil(url) ->
        {:error, :url_required}

      not valid_url?(url) ->
        {:error, :invalid_url}

      events != nil && not is_list(events) ->
        {:error, :events_must_be_list}

      events != nil && not Enum.all?(events, &valid_event?/1) ->
        {:error, {:invalid_events, Enum.reject(events, &valid_event?/1)}}

      true ->
        :ok
    end
  end

  defp valid_url?(url) when is_binary(url) do
    case URI.parse(url) do
      %URI{scheme: scheme, host: host} when scheme in ["http", "https"] and not is_nil(host) ->
        true

      _ ->
        false
    end
  end

  defp valid_url?(_), do: false

  defp valid_event?("*"), do: true
  defp valid_event?(event), do: event in @valid_events

  defp maybe_where_active(query, nil), do: query

  defp maybe_where_active(query, active) do
    from(e in query, where: e.active == ^active)
  end

  defp maybe_filter_event(endpoints, nil), do: endpoints

  defp maybe_filter_event(endpoints, event) do
    Enum.filter(endpoints, &event_matches?(&1.events, event))
  end

  defp get_param(params, key, default) do
    case {Map.get(params, key), Map.get(params, to_string(key))} do
      {nil, nil} -> default
      {nil, val} -> val
      {val, _} -> val
    end
  end

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)

  defp generate_endpoint_id, do: "whep_" <> random_id()

  defp generate_secret do
    "whsec_" <> (:crypto.strong_rand_bytes(32) |> Base.url_encode64(padding: false))
  end

  defp random_id do
    :crypto.strong_rand_bytes(16)
    |> Base.url_encode64(padding: false)
  end
end
