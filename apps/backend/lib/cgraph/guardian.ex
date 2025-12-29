defmodule Cgraph.Guardian do
  @moduledoc """
  Guardian implementation for JWT authentication.
  
  Handles token generation and verification for access and refresh tokens.
  """
  use Guardian, otp_app: :cgraph

  alias Cgraph.Accounts

  @doc """
  Subject for the token (user ID).
  """
  def subject_for_token(%Accounts.User{id: id}, _claims) do
    {:ok, id}
  end

  def subject_for_token(_, _) do
    {:error, :invalid_resource}
  end

  @doc """
  Resource from claims (load user).
  """
  def resource_from_claims(%{"sub" => id}) do
    # Accounts.get_user/1 already returns {:ok, user} or {:error, :not_found}
    Accounts.get_user(id)
  end

  def resource_from_claims(_claims) do
    {:error, :invalid_claims}
  end

  @doc """
  Generate access and refresh token pair.
  """
  def generate_tokens(user) do
    access_ttl = Application.get_env(:cgraph, :jwt_access_token_ttl, 7200)
    refresh_ttl = Application.get_env(:cgraph, :jwt_refresh_token_ttl, 2_592_000)

    with {:ok, access_token, _claims} <- encode_and_sign(user, %{}, ttl: {access_ttl, :second}, token_type: "access"),
         {:ok, refresh_token, _claims} <- encode_and_sign(user, %{}, ttl: {refresh_ttl, :second}, token_type: "refresh") do
      {:ok, %{
        access_token: access_token,
        refresh_token: refresh_token,
        expires_in: access_ttl
      }}
    end
  end

  @doc """
  Refresh an access token using a refresh token.
  """
  def refresh_tokens(refresh_token) do
    case decode_and_verify(refresh_token, %{"typ" => "refresh"}) do
      {:ok, claims} ->
        case resource_from_claims(claims) do
          {:ok, user} -> generate_tokens(user)
          error -> error
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Verify an access token.
  """
  def verify_access_token(token) do
    decode_and_verify(token, %{"typ" => "access"})
  end
end
