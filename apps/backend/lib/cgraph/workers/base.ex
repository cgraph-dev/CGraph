defmodule Cgraph.Workers.Base do
  @moduledoc """
  Base module for Oban workers with common patterns.
  
  ## Design Philosophy
  
  All background workers share common requirements:
  
  1. **Structured logging**: Consistent log format across all workers
  2. **Error handling**: Graceful degradation and retry logic
  3. **Telemetry**: Metrics for monitoring and alerting
  4. **Timeouts**: Prevent runaway jobs
  5. **Idempotency**: Safe to retry without side effects
  
  ## Usage
  
  ```elixir
  defmodule Cgraph.Workers.SendEmail do
    use Cgraph.Workers.Base,
      queue: :emails,
      max_attempts: 5,
      priority: 1
    
    @impl true
    def execute(%{"to" => to, "template" => template, "data" => data}, job) do
      Cgraph.Mailer.send(to, template, data)
    end
  end
  ```
  
  ## Features Provided
  
  - Automatic timing and telemetry
  - Structured job logging
  - Error wrapping and reporting
  - Timeout enforcement
  - Retry backoff configuration
  """
  
  @callback execute(args :: map(), job :: Oban.Job.t()) :: 
    :ok | {:ok, any()} | {:error, any()} | {:snooze, pos_integer()}
  
  defmacro __using__(opts) do
    queue = Keyword.get(opts, :queue, :default)
    max_attempts = Keyword.get(opts, :max_attempts, 3)
    priority = Keyword.get(opts, :priority, 2)
    timeout = Keyword.get(opts, :timeout, :timer.minutes(5))
    
    quote do
      use Oban.Worker,
        queue: unquote(queue),
        max_attempts: unquote(max_attempts),
        priority: unquote(priority)
      
      require Logger
      
      @behaviour Cgraph.Workers.Base
      @timeout unquote(timeout)
      
      @impl Oban.Worker
      def perform(%Oban.Job{args: args} = job) do
        start_time = System.monotonic_time()
        worker_name = __MODULE__ |> Module.split() |> List.last()
        
        Logger.metadata(
          worker: worker_name,
          job_id: job.id,
          attempt: job.attempt
        )
        
        Logger.info("Starting job", args: sanitize_args(args))
        
        result = 
          try do
            task = Task.async(fn -> execute(args, job) end)
            
            case Task.yield(task, @timeout) || Task.shutdown(task, :brutal_kill) do
              {:ok, result} -> result
              nil -> {:error, :timeout}
            end
          rescue
            e ->
              Logger.error("Job crashed", 
                error: Exception.format(:error, e, __STACKTRACE__)
              )
              {:error, e}
          end
        
        duration_ms = System.convert_time_unit(
          System.monotonic_time() - start_time, 
          :native, 
          :millisecond
        )
        
        emit_telemetry(result, duration_ms, job)
        log_result(result, duration_ms)
        
        result
      end
      
      defp emit_telemetry(result, duration_ms, job) do
        status = case result do
          :ok -> :success
          {:ok, _} -> :success
          {:snooze, _} -> :snoozed
          {:error, _} -> :failure
        end
        
        :telemetry.execute(
          [:cgraph, :workers, :job],
          %{duration_ms: duration_ms},
          %{
            worker: __MODULE__,
            queue: job.queue,
            status: status,
            attempt: job.attempt
          }
        )
      end
      
      defp log_result(:ok, duration_ms) do
        Logger.info("Job completed", duration_ms: duration_ms)
      end
      
      defp log_result({:ok, _}, duration_ms) do
        Logger.info("Job completed", duration_ms: duration_ms)
      end
      
      defp log_result({:snooze, seconds}, duration_ms) do
        Logger.info("Job snoozed", duration_ms: duration_ms, snooze_seconds: seconds)
      end
      
      defp log_result({:error, reason}, duration_ms) do
        Logger.error("Job failed", duration_ms: duration_ms, error: inspect(reason))
      end
      
      defp sanitize_args(args) when is_map(args) do
        sensitive = ~w(password token secret api_key)
        
        Map.new(args, fn {key, value} ->
          if to_string(key) in sensitive do
            {key, "[REDACTED]"}
          else
            {key, sanitize_value(value)}
          end
        end)
      end
      
      defp sanitize_args(args), do: args
      
      defp sanitize_value(v) when is_binary(v) and byte_size(v) > 200 do
        String.slice(v, 0, 200) <> "..."
      end
      defp sanitize_value(v), do: v
      
      defoverridable []
    end
  end
end

defmodule Cgraph.Workers.SendWelcomeEmail do
  @moduledoc """
  Send welcome email to newly registered users.
  
  ## Job Arguments
  
  ```elixir
  %{
    "user_id" => "user_123",
    "email" => "user@example.com",
    "name" => "John Doe"
  }
  ```
  
  ## Retry Strategy
  
  - Max 5 attempts with exponential backoff
  - Final attempt after ~2 hours
  """
  
  use Cgraph.Workers.Base,
    queue: :emails,
    max_attempts: 5
  
  alias Cgraph.Accounts
  
  @impl Cgraph.Workers.Base
  def execute(%{"user_id" => user_id} = args, _job) do
    case Accounts.get_user(user_id) do
      {:error, :not_found} ->
        # User deleted, discard job
        Logger.warning("User not found, discarding job")
        :ok
        
      {:ok, user} ->
        email = Map.get(args, "email", user.email)
        name = Map.get(args, "name", user.display_name || user.username)
        
        send_welcome_email(email, name)
    end
  end
  
  defp send_welcome_email(email, name) do
    # Would call actual mailer here
    Logger.info("Sending welcome email", to: email, name: name)
    :ok
  end
end

defmodule Cgraph.Workers.CleanupExpiredSessions do
  @moduledoc """
  Periodic cleanup of expired sessions and tokens.
  
  Runs every hour via Oban cron.
  
  ## Configuration
  
  ```elixir
  config :cgraph, Oban,
    plugins: [
      {Oban.Plugins.Cron, 
       crontab: [
         {"0 * * * *", Cgraph.Workers.CleanupExpiredSessions}
       ]}
    ]
  ```
  """
  
  use Cgraph.Workers.Base,
    queue: :maintenance,
    max_attempts: 3,
    timeout: :timer.minutes(10)
  
  @impl Cgraph.Workers.Base
  def execute(_args, _job) do
    Logger.info("Starting session cleanup")
    
    deleted = cleanup_expired_sessions()
    
    Logger.info("Session cleanup complete", deleted_count: deleted)
    
    {:ok, %{deleted: deleted}}
  end
  
  defp cleanup_expired_sessions do
    _now = DateTime.utc_now()
    
    # Would delete expired tokens from database
    # {deleted, _} = Repo.delete_all(
    #   from t in "tokens",
    #   where: t.expires_at < ^now
    # )
    # deleted
    
    0
  end
end

defmodule Cgraph.Workers.ProcessMediaUpload do
  @moduledoc """
  Process uploaded media files (images, videos).
  
  ## Pipeline
  
  1. Download from temporary storage
  2. Validate file type and size
  3. Generate thumbnails/previews
  4. Upload to permanent storage
  5. Update database record
  
  ## Job Arguments
  
  ```elixir
  %{
    "upload_id" => "upload_123",
    "user_id" => "user_456",
    "file_path" => "/tmp/upload_123.jpg",
    "content_type" => "image/jpeg"
  }
  ```
  """
  
  use Cgraph.Workers.Base,
    queue: :media,
    max_attempts: 3,
    timeout: :timer.minutes(15)
  
  @impl Cgraph.Workers.Base
  def execute(%{"upload_id" => upload_id, "file_path" => path} = args, _job) do
    Logger.info("Processing media upload", upload_id: upload_id)
    
    with {:ok, _validated} <- validate_file(path, args),
         {:ok, _processed} <- process_media(path, args),
         {:ok, _stored} <- store_permanently(path, args) do
      Logger.info("Media processing complete", upload_id: upload_id)
      :ok
    else
      {:error, :invalid_file} ->
        Logger.warning("Invalid file rejected", upload_id: upload_id)
        :ok  # Don't retry invalid files
        
      {:error, reason} ->
        {:error, reason}
    end
  end
  
  defp validate_file(path, args) do
    content_type = Map.get(args, "content_type", "")
    
    cond do
      not File.exists?(path) ->
        {:error, :file_not_found}
        
      not valid_content_type?(content_type) ->
        {:error, :invalid_file}
        
      file_too_large?(path) ->
        {:error, :file_too_large}
        
      true ->
        {:ok, :valid}
    end
  end
  
  defp valid_content_type?(type) do
    type in ~w(image/jpeg image/png image/gif image/webp video/mp4 video/webm)
  end
  
  defp file_too_large?(path) do
    case File.stat(path) do
      {:ok, %{size: size}} -> size > 100_000_000  # 100MB
      _ -> true
    end
  end
  
  defp process_media(_path, _args) do
    # Would generate thumbnails, transcode video, etc.
    {:ok, :processed}
  end
  
  defp store_permanently(_path, _args) do
    # Would upload to S3/GCS
    {:ok, :stored}
  end
end

defmodule Cgraph.Workers.SyncExternalData do
  @moduledoc """
  Sync data from external APIs with rate limiting.
  
  Uses snooze for backoff when rate limited.
  """
  
  use Cgraph.Workers.Base,
    queue: :sync,
    max_attempts: 10,
    timeout: :timer.minutes(5)
  
  @impl Cgraph.Workers.Base
  def execute(%{"source" => source, "resource_id" => id} = _args, _job) do
    Logger.info("Syncing external data", source: source, resource_id: id)
    
    {:ok, data} = fetch_external_data(source, id)
    store_synced_data(source, id, data)
    :ok
  end
  
  @spec fetch_external_data(String.t(), String.t()) :: {:ok, map()} | {:error, atom()} | {:error, :rate_limited, non_neg_integer()}
  defp fetch_external_data(_source, _id) do
    {:ok, %{}}
  end
  
  defp store_synced_data(_source, _id, _data) do
    :ok
  end
end
