# How the Backend Works

Deep dive into the Elixir/Phoenix backend. Everything you need to understand what's happening under the hood.

---

## Architecture Overview

```
apps/backend/
├── lib/
│   ├── cgraph/              # Business logic layer
│   │   ├── accounts/        # User-related stuff
│   │   ├── messaging/       # Messages, conversations
│   │   ├── groups/          # Server-style communities
│   │   ├── forums/          # Discussion communities
│   │   ├── notifications/   # Push, in-app notifications
│   │   ├── workers/         # Background jobs
│   │   └── *.ex             # Core modules
│   │
│   └── cgraph_web/          # HTTP/WebSocket layer
│       ├── controllers/     # REST endpoints
│       ├── channels/        # WebSocket handlers
│       ├── plugs/           # Middleware
│       └── router.ex        # Route definitions
│
├── priv/
│   └── repo/migrations/     # Database migrations
│
├── config/
│   ├── config.exs           # Base config
│   ├── dev.exs              # Development config
│   ├── test.exs             # Test config
│   └── runtime.exs          # Runtime (production) config
│
└── test/                    # Tests
```

---

## The Context Pattern

Phoenix uses "contexts" to organize business logic. Each context is a module that exposes functions for a specific domain.

### Example: Messaging Context

```elixir
# lib/cgraph/messaging.ex
defmodule Cgraph.Messaging do
  # Public API for messaging features
  
  def list_conversations(user_id) do
    # Returns all conversations for a user
  end
  
  def get_conversation(id) do
    # Returns a single conversation
  end
  
  def create_message(attrs) do
    # Creates a new message
  end
  
  def mark_as_read(conversation_id, user_id) do
    # Marks messages as read
  end
end
```

Controllers call context functions. Contexts handle the logic and talk to the database.

### Our Contexts

| Context | Purpose |
|---------|---------|
| `Accounts` | Users, authentication, profiles |
| `Messaging` | Conversations, messages, typing |
| `Groups` | Groups, channels, roles, permissions |
| `Forums` | Forums, posts, comments, voting |
| `Notifications` | Push and in-app notifications |
| `Search` | Full-text search across entities |

---

## Database Layer (Ecto)

### Schemas

Schemas define the shape of database tables:

```elixir
# lib/cgraph/accounts/user.ex
defmodule Cgraph.Accounts.User do
  use Ecto.Schema
  
  @primary_key {:id, :binary_id, autogenerate: true}
  
  schema "users" do
    field :email, :string
    field :username, :string
    field :user_id, :integer
    field :password_hash, :string
    field :display_name, :string
    field :avatar_url, :string
    field :status, :string, default: "offline"
    
    has_many :messages, Cgraph.Messaging.Message
    has_many :conversations, through: [:participants, :conversation]
    
    timestamps(type: :utc_datetime)
  end
end
```

### Changesets

Changesets validate and transform data before database operations:

```elixir
def registration_changeset(user, attrs) do
  user
  |> cast(attrs, [:email, :password, :username])
  |> validate_required([:email, :password])
  |> validate_format(:email, ~r/@/)
  |> validate_length(:password, min: 8)
  |> unique_constraint(:email)
  |> unique_constraint(:username)
  |> put_password_hash()
end

defp put_password_hash(changeset) do
  case get_change(changeset, :password) do
    nil -> changeset
    password ->
      put_change(changeset, :password_hash, Argon2.hash_pwd_salt(password))
  end
end
```

### Queries

Ecto queries are composable and safe from SQL injection:

```elixir
# Simple query
Repo.all(User)

# With conditions
from(u in User, where: u.status == "online")
|> Repo.all()

# Complex query
from(m in Message,
  join: c in Conversation, on: m.conversation_id == c.id,
  where: c.id == ^conversation_id,
  order_by: [desc: m.inserted_at],
  limit: 50,
  preload: [:sender]
)
|> Repo.all()
```

### Transactions

For operations that need to succeed or fail together:

```elixir
Repo.transaction(fn ->
  {:ok, message} = create_message(attrs)
  {:ok, _} = update_conversation_timestamp(conversation_id)
  {:ok, _} = notify_participants(conversation_id, message)
  message
end)
```

---

## HTTP Layer (Controllers)

### Controller Structure

```elixir
# lib/cgraph_web/controllers/api/v1/message_controller.ex
defmodule CgraphWeb.Api.V1.MessageController do
  use CgraphWeb, :controller
  
  alias Cgraph.Messaging
  
  # GET /api/v1/conversations/:conversation_id/messages
  def index(conn, %{"conversation_id" => conv_id}) do
    user = conn.assigns.current_user
    
    case Messaging.list_messages(conv_id, user.id) do
      {:ok, messages} ->
        render(conn, :index, messages: messages)
      
      {:error, :not_found} ->
        conn
        |> put_status(404)
        |> json(%{error: "Conversation not found"})
    end
  end
  
  # POST /api/v1/conversations/:conversation_id/messages
  def create(conn, %{"conversation_id" => conv_id, "content" => content}) do
    user = conn.assigns.current_user
    
    case Messaging.create_message(%{
      conversation_id: conv_id,
      sender_id: user.id,
      content: content
    }) do
      {:ok, message} ->
        # Broadcast to connected clients
        CgraphWeb.Endpoint.broadcast!(
          "conversation:#{conv_id}",
          "new_message",
          MessageJSON.show(message)
        )
        
        conn
        |> put_status(201)
        |> render(:show, message: message)
      
      {:error, changeset} ->
        conn
        |> put_status(422)
        |> json(%{error: format_errors(changeset)})
    end
  end
end
```

### JSON Views

Views format data for JSON responses:

```elixir
# lib/cgraph_web/controllers/api/v1/message_json.ex
defmodule CgraphWeb.Api.V1.MessageJSON do
  def index(%{messages: messages}) do
    %{data: Enum.map(messages, &data/1)}
  end
  
  def show(%{message: message}) do
    %{data: data(message)}
  end
  
  defp data(message) do
    %{
      id: message.id,
      content: message.content,
      sender_id: message.sender_id,
      conversation_id: message.conversation_id,
      inserted_at: message.inserted_at
    }
  end
end
```

---

## WebSocket Layer (Channels)

### UserSocket (Connection Handler)

```elixir
# lib/cgraph_web/channels/user_socket.ex
defmodule CgraphWeb.UserSocket do
  use Phoenix.Socket
  
  channel "conversation:*", CgraphWeb.ConversationChannel
  channel "group:*", CgraphWeb.GroupChannel
  
  def connect(%{"token" => token}, socket, _connect_info) do
    case verify_token(token) do
      {:ok, user_id} ->
        {:ok, assign(socket, :user_id, user_id)}
      
      {:error, _} ->
        :error
    end
  end
  
  def id(socket), do: "user_socket:#{socket.assigns.user_id}"
end
```

### Channel Handler

```elixir
# lib/cgraph_web/channels/conversation_channel.ex
defmodule CgraphWeb.ConversationChannel do
  use CgraphWeb, :channel
  
  alias Cgraph.Messaging
  
  # Called when client joins "conversation:123"
  def join("conversation:" <> conv_id, _params, socket) do
    user_id = socket.assigns.user_id
    
    # Check if user is allowed to join
    if Messaging.participant?(conv_id, user_id) do
      # Track presence
      Presence.track(socket, user_id, %{
        online_at: System.system_time(:second)
      })
      
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end
  
  # Handle incoming "new_message" event
  def handle_in("new_message", %{"content" => content}, socket) do
    conv_id = get_conversation_id(socket.topic)
    user_id = socket.assigns.user_id
    
    case Messaging.create_message(%{
      conversation_id: conv_id,
      sender_id: user_id,
      content: content
    }) do
      {:ok, message} ->
        # Broadcast to all clients in this topic
        broadcast!(socket, "new_message", %{
          id: message.id,
          content: message.content,
          sender_id: message.sender_id,
          inserted_at: message.inserted_at
        })
        
        {:reply, :ok, socket}
      
      {:error, _} ->
        {:reply, {:error, %{reason: "failed to send"}}, socket}
    end
  end
  
  # Handle "typing" event
  def handle_in("typing", _params, socket) do
    broadcast_from!(socket, "user_typing", %{
      user_id: socket.assigns.user_id
    })
    {:noreply, socket}
  end
  
  defp get_conversation_id("conversation:" <> id), do: id
end
```

### Presence

Presence tracks who's online in real-time:

```elixir
# When someone joins
Presence.track(socket, user_id, %{
  online_at: System.system_time(:second),
  status: "online"
})

# Get all presences in a topic
Presence.list(socket)
# => %{"user-123" => %{metas: [%{online_at: 123456, status: "online"}]}}

# Handle presence changes
def handle_info(%{event: "presence_diff", payload: diff}, socket) do
  # diff contains :joins and :leaves
  {:noreply, socket}
end
```

---

## Authentication (Guardian)

Guardian handles JWT tokens:

```elixir
# lib/cgraph/guardian.ex
defmodule Cgraph.Guardian do
  use Guardian, otp_app: :cgraph
  
  alias Cgraph.Accounts
  
  # Called when creating a token
  def subject_for_token(user, _claims) do
    {:ok, to_string(user.id)}
  end
  
  # Called when verifying a token
  def resource_from_claims(%{"sub" => user_id}) do
    case Accounts.get_user(user_id) do
      nil -> {:error, :resource_not_found}
      user -> {:ok, user}
    end
  end
end
```

### Auth Pipeline

```elixir
# lib/cgraph_web/router.ex
pipeline :api_auth do
  plug :accepts, ["json"]
  plug Cgraph.Auth.Pipeline  # Guardian pipeline
end

# lib/cgraph/auth/pipeline.ex
defmodule Cgraph.Auth.Pipeline do
  use Guardian.Plug.Pipeline,
    otp_app: :cgraph,
    module: Cgraph.Guardian,
    error_handler: Cgraph.Auth.ErrorHandler
  
  plug Guardian.Plug.VerifyHeader, scheme: "Bearer"
  plug Guardian.Plug.LoadResource, allow_blank: true
end
```

### Using Auth in Controllers

```elixir
# Get current user
user = Guardian.Plug.current_resource(conn)
# or
user = conn.assigns.current_user  # if using assign plug

# Generate token
{:ok, token, _claims} = Cgraph.Guardian.encode_and_sign(user)

# Verify token
{:ok, claims} = Cgraph.Guardian.decode_and_verify(token)
```

---

## Background Jobs (Oban)

### Worker Definition

```elixir
# lib/cgraph/workers/send_push_notification.ex
defmodule Cgraph.Workers.SendPushNotification do
  use Oban.Worker,
    queue: :notifications,
    max_attempts: 3
  
  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "message" => msg}}) do
    case Cgraph.Notifications.send_push(user_id, msg) do
      :ok -> :ok
      {:error, reason} -> {:error, reason}
    end
  end
end
```

### Enqueueing Jobs

```elixir
# Immediate execution
%{user_id: "123", message: "Hello"}
|> Cgraph.Workers.SendPushNotification.new()
|> Oban.insert()

# Delayed execution (5 minutes)
%{user_id: "123", message: "Hello"}
|> Cgraph.Workers.SendPushNotification.new(schedule_in: 300)
|> Oban.insert()

# Scheduled execution
%{user_id: "123", message: "Hello"}
|> Cgraph.Workers.SendPushNotification.new(scheduled_at: ~U[2024-12-31 10:00:00Z])
|> Oban.insert()

# Unique job (prevent duplicates)
%{user_id: "123"}
|> Cgraph.Workers.SomeWorker.new(unique: [period: 60])
|> Oban.insert()
```

### Scheduled Jobs (Cron)

```elixir
# config/config.exs
config :cgraph, Oban,
  plugins: [
    {Oban.Plugins.Cron,
     crontab: [
       # Daily at 2 AM
       {"0 2 * * *", Cgraph.Workers.DatabaseBackup},
       # Every hour
       {"0 * * * *", Cgraph.Workers.CleanupExpired},
       # Every 5 minutes
       {"*/5 * * * *", Cgraph.Workers.UpdatePresence}
     ]}
  ]
```

---

## Rate Limiting

```elixir
# lib/cgraph/rate_limiter.ex
case Cgraph.RateLimiter.check("user:#{user_id}", :api) do
  :ok ->
    # Proceed with request
    
  {:error, :rate_limited, info} ->
    # Return 429 with retry-after
end

# Different scopes with different limits
:api          # 1000/hour
:login        # 5/5min
:message      # 60/min
:upload       # 10/hour
```

### In Controller

```elixir
plug CgraphWeb.Plugs.RateLimitPlug, scope: :api when action in [:index, :show]
plug CgraphWeb.Plugs.RateLimitPlug, scope: :login when action in [:create]
```

---

## Error Handling

### Fallback Controller

```elixir
# lib/cgraph_web/controllers/fallback_controller.ex
defmodule CgraphWeb.FallbackController do
  use CgraphWeb, :controller
  
  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(404)
    |> json(%{error: %{message: "Not found"}})
  end
  
  def call(conn, {:error, :unauthorized}) do
    conn
    |> put_status(401)
    |> json(%{error: %{message: "Unauthorized"}})
  end
  
  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(422)
    |> json(%{error: format_changeset_errors(changeset)})
  end
end
```

### Using in Controller

```elixir
defmodule CgraphWeb.Api.V1.UserController do
  use CgraphWeb, :controller
  
  action_fallback CgraphWeb.FallbackController
  
  def show(conn, %{"id" => id}) do
    with {:ok, user} <- Accounts.get_user(id) do
      render(conn, :show, user: user)
    end
    # If {:error, ...} is returned, fallback handles it
  end
end
```

---

## Testing

### Test Setup

```elixir
# test/test_helper.exs
ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(Cgraph.Repo, :manual)
```

### Context Test Example

```elixir
# test/cgraph/messaging_test.exs
defmodule Cgraph.MessagingTest do
  use Cgraph.DataCase
  
  alias Cgraph.Messaging
  
  describe "create_message/1" do
    test "creates message with valid data" do
      user = insert(:user)
      conversation = insert(:conversation)
      insert(:participant, user: user, conversation: conversation)
      
      {:ok, message} = Messaging.create_message(%{
        conversation_id: conversation.id,
        sender_id: user.id,
        content: "Hello world"
      })
      
      assert message.content == "Hello world"
      assert message.sender_id == user.id
    end
    
    test "fails with empty content" do
      user = insert(:user)
      conversation = insert(:conversation)
      
      {:error, changeset} = Messaging.create_message(%{
        conversation_id: conversation.id,
        sender_id: user.id,
        content: ""
      })
      
      assert "can't be blank" in errors_on(changeset).content
    end
  end
end
```

### Controller Test Example

```elixir
# test/cgraph_web/controllers/api/v1/message_controller_test.exs
defmodule CgraphWeb.Api.V1.MessageControllerTest do
  use CgraphWeb.ConnCase
  
  setup %{conn: conn} do
    user = insert(:user)
    {:ok, token, _} = Cgraph.Guardian.encode_and_sign(user)
    
    conn = 
      conn
      |> put_req_header("authorization", "Bearer #{token}")
      |> put_req_header("content-type", "application/json")
    
    {:ok, conn: conn, user: user}
  end
  
  describe "POST /conversations/:id/messages" do
    test "creates message", %{conn: conn, user: user} do
      conversation = insert(:conversation)
      insert(:participant, user: user, conversation: conversation)
      
      conn = post(conn, "/api/v1/conversations/#{conversation.id}/messages", %{
        content: "Hello"
      })
      
      assert %{"data" => %{"content" => "Hello"}} = json_response(conn, 201)
    end
  end
end
```

---

## Debugging Tips

### IEx (Interactive Shell)

```elixir
# Start with app loaded
iex -S mix

# In IEx:
alias Cgraph.Accounts
alias Cgraph.Repo

# Query data
Repo.all(Accounts.User)

# Test a function
Accounts.get_user("some-uuid")

# Reload code after changes
recompile()
```

### Logger

```elixir
require Logger

Logger.debug("Debug message")
Logger.info("Info message")
Logger.warning("Warning message")
Logger.error("Error message")

# With metadata
Logger.info("User logged in", user_id: user.id)
```

### Observer (GUI)

```elixir
# In IEx
:observer.start()
```

Shows processes, memory, ETS tables, etc.

---

## Configuration

### Environment-Specific

```elixir
# config/dev.exs - Development settings
config :cgraph, Cgraph.Repo,
  database: "cgraph_dev",
  pool_size: 10

# config/prod.exs - Production settings
config :cgraph, Cgraph.Repo,
  pool_size: 20

# config/runtime.exs - Runtime settings (reads env vars)
config :cgraph, Cgraph.Repo,
  url: System.get_env("DATABASE_URL")
```

### Accessing Config

```elixir
Application.get_env(:cgraph, :some_key)
Application.get_env(:cgraph, Cgraph.Repo)[:pool_size]
```

---

## Deployment Notes

### Release Build

```bash
MIX_ENV=prod mix release
```

This creates `_build/prod/rel/cgraph/`.

### Running Migrations in Production

```elixir
# In release console or via eval
Cgraph.Release.migrate()
```

### Environment Variables for Production

Required:
- `DATABASE_URL`
- `SECRET_KEY_BASE`
- `JWT_SECRET`
- `PHX_HOST`

Optional:
- `POOL_SIZE` (default: 10)
- `PORT` (default: 4000)

---

*Last updated: December 31, 2025*
