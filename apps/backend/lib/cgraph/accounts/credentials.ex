defmodule CGraph.Accounts.Credentials do
  @moduledoc """
  Registration, authentication, and session creation for the Accounts context.

  Handles user sign-up (with optional password breach checking),
  email/password and email-or-username/password authentication,
  and initial session creation.
  """

  import Ecto.Query, warn: false

  alias CGraph.Accounts.{Session, User}
  alias CGraph.Repo
  alias CGraph.Security.PasswordBreachCheck

  # ---------------------------------------------------------------------------
  # Registration
  # ---------------------------------------------------------------------------

  @doc """
  Register a new user with email/password credentials.

  Optionally checks password against HaveIBeenPwned database.
  """
  @spec register_user(map(), keyword()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def register_user(attrs, opts \\ []) do
    check_breach = Keyword.get(opts, :check_breach, true)

    changeset =
      %User{}
      |> User.registration_changeset(attrs)
      |> maybe_apply_breach_check(check_breach)

    case Repo.insert(changeset) do
      {:ok, user} = result ->
        maybe_async_breach_check(attrs, check_breach, user.id)
        result

      error ->
        error
    end
  end

  @doc """
  Create a new user (alias for register_user).
  """
  @spec create_user(map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def create_user(attrs), do: register_user(attrs)

  # ---------------------------------------------------------------------------
  # Authentication
  # ---------------------------------------------------------------------------

  @doc """
  Authenticate a user by email and password.
  """
  @spec authenticate_user(String.t(), String.t()) ::
          {:ok, struct()} | {:error, :invalid_credentials}
  def authenticate_user(email, password) do
    user = Repo.get_by(User, email: String.downcase(email))

    cond do
      is_nil(user) ->
        # Perform dummy check to prevent timing attacks
        Argon2.no_user_verify()
        {:error, :invalid_credentials}

      Argon2.verify_pass(password, user.password_hash) ->
        {:ok, user}

      true ->
        {:error, :invalid_credentials}
    end
  end

  @doc """
  Authenticate a user by email OR username and password.
  Automatically detects if identifier is email (contains @) or username.
  Both email and username lookups are case-insensitive for better UX.
  """
  @spec authenticate_by_identifier(String.t(), String.t()) ::
          {:ok, struct()} | {:error, :invalid_credentials | :no_password_set}
  def authenticate_by_identifier(identifier, password) do
    user =
      if String.contains?(identifier, "@") do
        Repo.get_by(User, email: String.downcase(identifier))
      else
        # Case-insensitive username lookup using Ecto query
        from(u in User,
          where: fragment("lower(?)", u.username) == ^String.downcase(identifier)
        )
        |> Repo.one()
      end

    cond do
      is_nil(user) ->
        Argon2.no_user_verify()
        {:error, :invalid_credentials}

      is_nil(user.password_hash) ->
        # User registered via OAuth/wallet only
        {:error, :no_password_set}

      Argon2.verify_pass(password, user.password_hash) ->
        {:ok, user}

      true ->
        {:error, :invalid_credentials}
    end
  end

  # ---------------------------------------------------------------------------
  # Session Creation
  # ---------------------------------------------------------------------------

  @doc """
  Create a session for user.

  Accepts either a Plug.Conn or a map with session metadata.
  """
  @spec create_session(struct(), Plug.Conn.t() | map()) ::
          {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def create_session(user, conn_or_attrs) do
    {user_agent, ip_address} = extract_session_metadata(conn_or_attrs)
    token_hash = :crypto.strong_rand_bytes(32) |> Base.encode64()
    expires_at = DateTime.utc_now() |> DateTime.add(30 * 24 * 60 * 60, :second)

    %Session{}
    |> Session.changeset(%{
      user_id: user.id,
      token_hash: token_hash,
      user_agent: user_agent,
      ip_address: ip_address,
      expires_at: expires_at
    })
    |> Repo.insert()
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  # Extract session metadata from Plug.Conn
  defp extract_session_metadata(%Plug.Conn{} = conn) do
    user_agent = get_user_agent(conn)
    ip_address = get_ip_address(conn)
    {user_agent, ip_address}
  end

  # Extract session metadata from plain map
  defp extract_session_metadata(attrs) when is_map(attrs) do
    user_agent = Map.get(attrs, :user_agent) || Map.get(attrs, "user_agent")
    ip_address = Map.get(attrs, :ip_address) || Map.get(attrs, "ip_address") || "127.0.0.1"
    {user_agent, ip_address}
  end

  defp get_user_agent(conn) do
    case Plug.Conn.get_req_header(conn, "user-agent") do
      [ua | _] -> ua
      _ -> nil
    end
  end

  defp get_ip_address(conn) do
    case Plug.Conn.get_req_header(conn, "x-forwarded-for") do
      [ip | _] -> ip |> String.split(",") |> List.first() |> String.trim()
      _ -> conn.remote_ip |> :inet.ntoa() |> to_string()
    end
  end

  defp maybe_apply_breach_check(changeset, true), do: apply_breach_check(changeset)
  defp maybe_apply_breach_check(changeset, false), do: changeset

  defp maybe_async_breach_check(_attrs, true, _user_id), do: :ok

  defp maybe_async_breach_check(attrs, false, user_id) do
    password = Map.get(attrs, "password") || Map.get(attrs, :password)
    if password, do: PasswordBreachCheck.check_async(password, user_id: user_id)
  end

  defp apply_breach_check(changeset) do
    password = Ecto.Changeset.get_change(changeset, :password)

    if password do
      PasswordBreachCheck.validate_changeset(changeset, :password)
    else
      changeset
    end
  end
end
