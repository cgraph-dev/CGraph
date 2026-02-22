defmodule CGraph.Accounts.WalletAuth.AccountManager do
  @moduledoc """
  Handles wallet user registration, authentication, PIN updates,
  and wallet/email account linking.

  This module provides:

  - Wallet user creation with recovery setup
  - Authentication via wallet address or crypto alias + PIN
  - PIN updates for authenticated users
  - Linking/unlinking wallet credentials to email-authenticated accounts
  """

  alias CGraph.Accounts.{RecoveryCode, User}
  alias CGraph.Accounts.WalletAuth.{Credentials, Recovery}
  alias CGraph.Repo

  # =============================================================================
  # Wallet Registration
  # =============================================================================

  @doc """
  Creates a new wallet-authenticated user.

  ## Parameters
  - `wallet_address`: The generated wallet address
  - `crypto_alias`: The generated crypto alias
  - `pin`: The user's chosen PIN (4-6 digits)
  - `recovery_method`: `:backup_codes` or `:file`

  ## Returns
  - `{:ok, %{user: user, recovery_data: data}}` on success
  - `{:error, changeset}` on failure
  """
  @spec create_wallet_user(String.t(), String.t(), String.t(), :backup_codes | :file) ::
          {:ok, map()} | {:error, any()}
  def create_wallet_user(wallet_address, crypto_alias, pin, recovery_method \\ :backup_codes) do
    Repo.transaction(fn ->
      with :ok <- validate_wallet_inputs(wallet_address, pin),
           {:ok, user} <- insert_wallet_user(wallet_address, crypto_alias, pin),
           {:ok, recovery_data} <- setup_recovery(user, wallet_address, crypto_alias, pin, recovery_method) do
        %{user: user, recovery_data: recovery_data}
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  defp validate_wallet_inputs(wallet_address, pin) do
    with :ok <- validate_wallet_address(wallet_address),
         {:ok, _} <- Credentials.validate_pin_strength(pin) do
      :ok
    end
  end

  defp validate_wallet_address(wallet_address) do
    if Credentials.valid_wallet_address?(wallet_address), do: :ok, else: {:error, :invalid_wallet_address}
  end

  defp insert_wallet_user(wallet_address, crypto_alias, pin) do
    pin_hash = Credentials.hash_pin(pin)

    user_attrs = %{
      wallet_address: wallet_address,
      crypto_alias: crypto_alias,
      pin_hash: pin_hash,
      auth_type: :wallet,
      display_name: crypto_alias,
      username: String.replace(crypto_alias, "-", "_")
    }

    %User{}
    |> User.wallet_pin_registration_changeset(user_attrs)
    |> Repo.insert()
  end

  defp setup_recovery(user, _wallet_address, _crypto_alias, _pin, :backup_codes) do
    {:ok, codes} = Recovery.generate_recovery_codes(8)
    hashed_codes = Recovery.hash_recovery_codes(codes)

    Enum.each(hashed_codes, fn hash ->
      %RecoveryCode{}
      |> RecoveryCode.changeset(%{user_id: user.id, code_hash: hash, used: false})
      |> Repo.insert!()
    end)

    {:ok, %{type: :backup_codes, codes: codes}}
  end

  defp setup_recovery(_user, wallet_address, crypto_alias, pin, :file) do
    {:ok, file_content} = Recovery.generate_recovery_file(wallet_address, crypto_alias, pin)
    filename = "cgraph-wallet-#{crypto_alias}.cgraph"
    {:ok, %{type: :file, content: file_content, filename: filename}}
  end

  # =============================================================================
  # Wallet Authentication
  # =============================================================================

  @doc """
  Authenticates a user with wallet address and PIN.
  """
  @spec authenticate_wallet(String.t(), String.t()) ::
          {:ok, User.t()} | {:error, :invalid_credentials | :no_pin_set}
  def authenticate_wallet(wallet_address, pin) do
    user = Repo.get_by(User, wallet_address: wallet_address)

    cond do
      is_nil(user) ->
        # Prevent timing attacks
        Argon2.no_user_verify()
        {:error, :invalid_credentials}

      is_nil(user.pin_hash) ->
        {:error, :no_pin_set}

      Credentials.verify_pin(pin, user.pin_hash) ->
        {:ok, user}

      true ->
        {:error, :invalid_credentials}
    end
  end

  @doc """
  Authenticates a user with crypto alias and PIN.
  """
  @spec authenticate_alias(String.t(), String.t()) ::
          {:ok, User.t()} | {:error, :invalid_credentials | :no_pin_set}
  def authenticate_alias(crypto_alias, pin) do
    user = Repo.get_by(User, crypto_alias: crypto_alias)

    cond do
      is_nil(user) ->
        Argon2.no_user_verify()
        {:error, :invalid_credentials}

      is_nil(user.pin_hash) ->
        {:error, :no_pin_set}

      Credentials.verify_pin(pin, user.pin_hash) ->
        {:ok, user}

      true ->
        {:error, :invalid_credentials}
    end
  end

  @doc """
  Updates a user's PIN.

  ## Parameters
  - `user`: The authenticated user
  - `current_pin`: The user's current PIN
  - `new_pin`: The new PIN to set

  ## Returns
  - `{:ok, user}` on success
  - `{:error, :invalid_pin}` if current PIN is wrong
  - `{:error, :weak_pin}` if new PIN is too weak
  """
  @spec update_pin(User.t(), String.t(), String.t()) ::
          {:ok, User.t()} | {:error, :no_pin_set | :invalid_pin | :weak_pin}
  def update_pin(user, current_pin, new_pin) do
    cond do
      is_nil(user.pin_hash) ->
        {:error, :no_pin_set}

      not Credentials.verify_pin(current_pin, user.pin_hash) ->
        {:error, :invalid_pin}

      true ->
        case Credentials.validate_pin_strength(new_pin) do
          {:ok, _} ->
            new_hash = Credentials.hash_pin(new_pin)

            user
            |> Ecto.Changeset.change(%{pin_hash: new_hash})
            |> Repo.update()

          {:error, _} ->
            {:error, :weak_pin}
        end
    end
  end

  # =============================================================================
  # Linking Methods
  # =============================================================================

  @doc """
  Links a wallet to an existing email-authenticated user.
  """
  @spec link_wallet_to_user(User.t(), String.t()) :: {:ok, User.t()} | {:error, any()}
  def link_wallet_to_user(user, pin) do
    case Credentials.validate_pin_strength(pin) do
      {:error, reason} ->
        {:error, reason}

      {:ok, _} ->
        {:ok, wallet_address} = Credentials.generate_wallet_address()
        {:ok, crypto_alias} = Credentials.generate_crypto_alias()
        pin_hash = Credentials.hash_pin(pin)

        user
        |> Ecto.Changeset.change(%{
          wallet_address: wallet_address,
          crypto_alias: crypto_alias,
          pin_hash: pin_hash
        })
        |> Repo.update()
    end
  end

  @doc """
  Links an email to an existing wallet-authenticated user.
  """
  @spec link_email_to_wallet_user(User.t(), String.t(), String.t()) ::
          {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def link_email_to_wallet_user(user, email, password) do
    password_hash = Argon2.hash_pwd_salt(password)

    user
    |> Ecto.Changeset.change(%{
      email: String.downcase(email),
      password_hash: password_hash
    })
    |> Ecto.Changeset.unique_constraint(:email)
    |> Ecto.Changeset.validate_format(:email, ~r/^[^\s]+@[^\s]+$/)
    |> Repo.update()
  end

  @doc """
  Unlinks wallet from user (must have email linked).
  """
  @spec unlink_wallet(User.t()) :: {:ok, User.t()} | {:error, :email_required}
  def unlink_wallet(user) do
    if is_nil(user.email) do
      {:error, :email_required}
    else
      user
      |> Ecto.Changeset.change(%{
        wallet_address: nil,
        crypto_alias: nil,
        pin_hash: nil
      })
      |> Repo.update()
    end
  end
end
