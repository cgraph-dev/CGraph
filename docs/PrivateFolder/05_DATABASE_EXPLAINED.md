# How the Database Works

Everything about PostgreSQL, Ecto, migrations, and data modeling.

---

## Database Overview

We use PostgreSQL 14+ with Ecto as the ORM layer.

**Key facts:**
- PostgreSQL 14 or newer required
- Ecto 3.11+ for the ORM
- Migrations in `priv/repo/migrations/`
- Seeds in `priv/repo/seeds.exs`

---

## Schema Design

### Users

```elixir
# User table
schema "users" do
  field :email, :string              # Unique, indexed
  field :password_hash, :string      # Argon2 hashed
  field :username, :string           # Unique, indexed
  field :display_name, :string       # Optional
  field :avatar_url, :string         # S3/R2 URL
  field :status, Ecto.Enum, values: [:online, :idle, :dnd, :offline]
  field :custom_status, :string      # "Working from home"
  field :wallet_address, :string     # For Web3 auth
  
  has_many :sent_messages, Message, foreign_key: :sender_id
  has_many :conversations, through: [:conversation_participants, :conversation]
  has_many :group_memberships, GroupMember
  
  timestamps()
end
```

### Conversations (DMs)

```elixir
schema "conversations" do
  field :is_group, :boolean, default: false
  field :name, :string           # For group DMs
  field :last_message_at, :utc_datetime
  
  has_many :participants, ConversationParticipant
  has_many :members, through: [:participants, :user]
  has_many :messages, Message
  
  timestamps()
end

schema "conversation_participants" do
  belongs_to :conversation, Conversation
  belongs_to :user, User
  
  field :joined_at, :utc_datetime
  field :last_read_at, :utc_datetime     # For unread counts
  field :muted, :boolean, default: false
  
  timestamps()
end

schema "messages" do
  field :content, :string
  field :type, Ecto.Enum, values: [:text, :image, :file, :system]
  field :edited_at, :utc_datetime
  
  belongs_to :conversation, Conversation
  belongs_to :sender, User
  belongs_to :reply_to, Message       # Thread support
  
  has_many :attachments, Attachment
  has_many :reactions, Reaction
  
  timestamps()
end
```

### Groups (Discord-like)

```elixir
schema "groups" do
  field :name, :string
  field :icon_url, :string
  field :description, :string
  field :is_public, :boolean, default: false
  field :invite_code, :string          # Unique, for invites
  
  belongs_to :owner, User
  has_many :channels, Channel
  has_many :roles, Role
  has_many :members, GroupMember
  
  timestamps()
end

schema "channels" do
  field :name, :string
  field :type, Ecto.Enum, values: [:text, :voice, :announcement]
  field :topic, :string
  field :position, :integer
  field :is_private, :boolean, default: false
  
  belongs_to :group, Group
  belongs_to :category, ChannelCategory
  
  has_many :messages, ChannelMessage
  
  timestamps()
end

schema "group_members" do
  belongs_to :group, Group
  belongs_to :user, User
  
  field :nickname, :string
  field :joined_at, :utc_datetime
  
  many_to_many :roles, Role, join_through: "group_member_roles"
  
  timestamps()
end

schema "roles" do
  field :name, :string
  field :color, :string            # Hex color
  field :position, :integer        # For hierarchy
  field :permissions, :integer     # Bitfield
  
  belongs_to :group, Group
  
  timestamps()
end
```

### Forums (Reddit-like)

```elixir
schema "forums" do
  field :name, :string
  field :slug, :string              # URL-friendly, unique
  field :description, :string
  field :icon_url, :string
  field :banner_url, :string
  field :is_public, :boolean, default: true
  
  belongs_to :owner, User
  
  has_many :posts, ForumPost
  has_many :moderators, ForumModerator
  has_many :flairs, ForumFlair
  
  timestamps()
end

schema "forum_posts" do
  field :title, :string
  field :content, :string           # Markdown
  field :type, Ecto.Enum, values: [:text, :link, :image, :poll]
  field :score, :integer, default: 0
  field :comment_count, :integer, default: 0
  field :is_pinned, :boolean, default: false
  field :is_locked, :boolean, default: false
  
  belongs_to :forum, Forum
  belongs_to :author, User
  belongs_to :flair, ForumFlair
  
  has_many :comments, ForumComment
  has_many :votes, ForumVote
  
  timestamps()
end

schema "forum_comments" do
  field :content, :string
  field :score, :integer, default: 0
  
  belongs_to :post, ForumPost
  belongs_to :author, User
  belongs_to :parent, ForumComment  # For nested comments
  
  has_many :replies, ForumComment, foreign_key: :parent_id
  has_many :votes, CommentVote
  
  timestamps()
end
```

### Friends System

```elixir
schema "friendships" do
  belongs_to :user, User
  belongs_to :friend, User
  
  field :status, Ecto.Enum, values: [:pending, :accepted, :blocked]
  field :requested_at, :utc_datetime
  field :accepted_at, :utc_datetime
  
  timestamps()
end
```

### Notifications

```elixir
schema "notifications" do
  belongs_to :user, User
  
  field :type, :string              # "message", "friend_request", "mention"
  field :data, :map                 # JSON payload
  field :read_at, :utc_datetime
  
  timestamps()
end
```

### Sessions

```elixir
schema "sessions" do
  belongs_to :user, User
  
  field :token, :string             # Hashed
  field :user_agent, :string
  field :ip_address, :string
  field :expires_at, :utc_datetime
  field :last_active_at, :utc_datetime
  
  timestamps()
end
```

---

## Indexes

Key indexes for performance:

```elixir
# Migration example
defmodule Cgraph.Repo.Migrations.AddIndexes do
  use Ecto.Migration

  def change do
    # User lookups
    create unique_index(:users, [:email])
    create unique_index(:users, [:username])
    create index(:users, [:wallet_address])
    
    # Messages - by conversation, ordered by time
    create index(:messages, [:conversation_id, :inserted_at])
    create index(:messages, [:sender_id])
    
    # Forum posts - sorted queries
    create index(:forum_posts, [:forum_id, :inserted_at])
    create index(:forum_posts, [:forum_id, :score])
    create index(:forum_posts, [:author_id])
    
    # Friendships - bidirectional lookup
    create index(:friendships, [:user_id, :status])
    create index(:friendships, [:friend_id, :status])
    
    # Notifications - per user, unread first
    create index(:notifications, [:user_id, :read_at, :inserted_at])
    
    # Session tokens
    create unique_index(:sessions, [:token])
    create index(:sessions, [:user_id])
  end
end
```

---

## Ecto Basics

### Repo Module

```elixir
# lib/cgraph/repo.ex
defmodule Cgraph.Repo do
  use Ecto.Repo,
    otp_app: :cgraph,
    adapter: Ecto.Adapters.Postgres
end
```

### Common Queries

```elixir
# Find by ID
user = Repo.get(User, id)
user = Repo.get!(User, id)  # Raises if not found

# Find by field
user = Repo.get_by(User, email: email)
user = Repo.get_by!(User, username: username)

# Query building
import Ecto.Query

# Get all messages in a conversation, ordered
messages = 
  from(m in Message,
    where: m.conversation_id == ^conversation_id,
    order_by: [asc: m.inserted_at],
    preload: [:sender, :reactions]
  )
  |> Repo.all()

# With pagination
{messages, page_info} =
  from(m in Message,
    where: m.conversation_id == ^conversation_id,
    order_by: [desc: m.inserted_at]
  )
  |> Repo.paginate(page: page, page_size: 50)

# Aggregate queries
message_count = 
  from(m in Message,
    where: m.sender_id == ^user_id,
    select: count()
  )
  |> Repo.one()
```

### Changesets

```elixir
defmodule Cgraph.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :username, :display_name, :avatar_url])
    |> validate_required([:email, :username])
    |> validate_format(:email, ~r/@/)
    |> validate_length(:username, min: 3, max: 20)
    |> validate_format(:username, ~r/^[a-z0-9_]+$/)
    |> unique_constraint(:email)
    |> unique_constraint(:username)
  end
  
  def registration_changeset(user, attrs) do
    user
    |> changeset(attrs)
    |> cast(attrs, [:password])
    |> validate_required([:password])
    |> validate_length(:password, min: 8)
    |> hash_password()
  end
  
  defp hash_password(changeset) do
    case get_change(changeset, :password) do
      nil -> changeset
      password -> put_change(changeset, :password_hash, Argon2.hash_pwd_salt(password))
    end
  end
end
```

### Transactions

```elixir
# Simple transaction
Repo.transaction(fn ->
  user = Repo.insert!(user_changeset)
  profile = Repo.insert!(%Profile{user_id: user.id})
  {user, profile}
end)

# Multi for complex transactions
alias Ecto.Multi

Multi.new()
|> Multi.insert(:user, user_changeset)
|> Multi.insert(:profile, fn %{user: user} ->
  %Profile{user_id: user.id}
end)
|> Multi.run(:welcome_email, fn _repo, %{user: user} ->
  send_welcome_email(user)
  {:ok, :sent}
end)
|> Repo.transaction()
```

---

## Migrations

### Creating Migrations

```bash
cd apps/backend
mix ecto.gen.migration create_users
```

### Migration Example

```elixir
# priv/repo/migrations/20240101000000_create_users.exs
defmodule Cgraph.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :email, :citext, null: false
      add :password_hash, :string, null: false
      add :username, :string, null: false
      add :display_name, :string
      add :avatar_url, :string
      add :status, :string, default: "offline"
      
      timestamps()
    end
    
    create unique_index(:users, [:email])
    create unique_index(:users, [:username])
  end
end
```

### Running Migrations

```bash
# Run all pending migrations
mix ecto.migrate

# Rollback last migration
mix ecto.rollback

# Rollback specific number
mix ecto.rollback --step 3

# Reset database (drop, create, migrate)
mix ecto.reset
```

### Data Migrations

For data changes, use a separate migration:

```elixir
defmodule Cgraph.Repo.Migrations.BackfillUserStatus do
  use Ecto.Migration
  
  import Ecto.Query
  
  def up do
    # Update existing users
    from(u in "users", where: is_nil(u.status))
    |> repo().update_all(set: [status: "offline"])
  end
  
  def down do
    # Can't easily undo
    :ok
  end
end
```

---

## Seeds

```elixir
# priv/repo/seeds.exs
alias Cgraph.{Repo, Accounts.User, Forums.Forum}

# Create admin user
admin = Repo.insert!(%User{
  email: "admin@example.com",
  username: "admin",
  password_hash: Argon2.hash_pwd_salt("adminpassword"),
  display_name: "Administrator"
})

# Create default forums
forums = [
  %{name: "General", slug: "general", description: "General discussion"},
  %{name: "Announcements", slug: "announcements", description: "Official announcements"},
  %{name: "Help", slug: "help", description: "Get help here"},
]

for attrs <- forums do
  Repo.insert!(%Forum{
    name: attrs.name,
    slug: attrs.slug,
    description: attrs.description,
    owner_id: admin.id
  })
end

IO.puts("Seeds planted!")
```

Run with:
```bash
mix run priv/repo/seeds.exs
```

---

## Performance Tips

### Preloading

Always preload associations to avoid N+1:

```elixir
# Bad - N+1 query
posts = Repo.all(ForumPost)
Enum.each(posts, fn post ->
  IO.puts(post.author.username)  # Queries for each post!
end)

# Good - preload
posts = Repo.all(from p in ForumPost, preload: [:author])
Enum.each(posts, fn post ->
  IO.puts(post.author.username)  # Already loaded
end)

# Nested preloading
posts = Repo.all(from p in ForumPost, preload: [
  author: [:profile],
  comments: [author: [:profile]]
])
```

### Select Only What You Need

```elixir
# Instead of selecting all fields
users = from(u in User, select: {u.id, u.username}) |> Repo.all()

# Or use map
users = from(u in User, select: %{id: u.id, username: u.username}) |> Repo.all()
```

### Batch Updates

```elixir
# Instead of looping
from(u in User,
  where: u.status == :offline,
  where: u.last_active_at < ^one_hour_ago
)
|> Repo.update_all(set: [status: :idle])
```

### Explain Queries

```elixir
# In development
query = from(p in ForumPost, where: p.forum_id == ^forum_id)
{:ok, result} = Ecto.Adapters.SQL.explain(Repo, :all, query)
IO.puts(result)
```

---

## Database Configuration

### Development

```elixir
# config/dev.exs
config :cgraph, Cgraph.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "cgraph_dev",
  port: 5432,
  pool_size: 10
```

### Test

```elixir
# config/test.exs
config :cgraph, Cgraph.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "cgraph_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2
```

### Production

```elixir
# config/runtime.exs
if config_env() == :prod do
  database_url = System.get_env("DATABASE_URL") ||
    raise "DATABASE_URL not set"
  
  config :cgraph, Cgraph.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    ssl: true,
    ssl_opts: [verify: :verify_none]
end
```

---

## Backup and Recovery

### Manual Backup

```bash
# Dump database
pg_dump -Fc cgraph_prod > backup.dump

# Restore
pg_restore -d cgraph_prod backup.dump
```

### Automated Backups

We have an Oban worker for automated backups:

```elixir
# lib/cgraph/workers/database_backup.ex
# Runs daily at 3 AM, uploads to S3/R2
```

See `docs/DATABASE.md` for full backup strategy.

---

## Common Issues

### Connection Pool Exhausted

If you see "connection pool exhausted" errors:

1. Check for long-running queries
2. Increase pool_size
3. Look for connection leaks (unreturned connections)

```elixir
# Monitor pool
:telemetry.attach("repo-checkout",
  [:cgraph, :repo, :query],
  fn _event, measurements, metadata, _config ->
    if measurements.queue_time > 100_000_000 do  # 100ms
      Logger.warning("Slow checkout: #{inspect(metadata)}")
    end
  end,
  nil
)
```

### Migration Stuck

If a migration hangs:

```bash
# Check for locks
psql -c "SELECT * FROM pg_locks WHERE NOT granted;"

# Kill blocking query
psql -c "SELECT pg_cancel_backend(pid);"
```

### Slow Queries

Use `EXPLAIN ANALYZE`:

```sql
EXPLAIN ANALYZE SELECT * FROM forum_posts WHERE forum_id = 'xxx' ORDER BY score DESC LIMIT 50;
```

Look for:
- Sequential scans (need index)
- High row estimates
- Slow joins

---

*Last updated: December 31, 2025*
