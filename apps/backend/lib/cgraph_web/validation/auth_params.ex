defmodule CGraphWeb.Validation.AuthParams do
  @moduledoc """
  Strong parameter validation for authentication endpoints.
  """

  use Ecto.Schema
  import Ecto.Changeset

  embedded_schema do
    field :email, :string
    field :username, :string
    field :password, :string
    field :password_confirmation, :string
    field :identifier, :string
    field :refresh_token, :string
    field :wallet_address, :string
    field :signature, :string
    field :token, :string
  end

  @doc "Validates registration parameters."
  @spec validate_register(map()) :: {:ok, map()} | {:error, Ecto.Changeset.t()}
  def validate_register(params) do
    %__MODULE__{}
    |> cast(params, [:email, :username, :password, :password_confirmation], empty_values: [""])
    |> validate_required([:email, :password, :password_confirmation])
    |> update_change(:email, &String.downcase/1)
    |> validate_format(:email, ~r/@/)
    |> validate_length(:password, min: 8)
    |> validate_confirmation(:password, required: true)
    |> result_from_changeset()
  end

  @doc "Validates login parameters."
  @spec validate_login(map()) :: {:ok, map()} | {:error, Ecto.Changeset.t()}
  def validate_login(params) do
    %__MODULE__{}
    |> cast(params, [:identifier, :password], empty_values: [""])
    |> validate_required([:identifier, :password])
    |> update_change(:identifier, &String.trim/1)
    |> result_from_changeset()
  end

  @doc "Validates token refresh parameters."
  @spec validate_refresh(map()) :: {:ok, map()} | {:error, Ecto.Changeset.t()}
  def validate_refresh(params) do
    %__MODULE__{}
    |> cast(params, [:refresh_token], empty_values: [""])
    |> result_from_changeset()
  end

  @doc "Validates wallet challenge parameters."
  @spec validate_wallet_challenge(map()) :: {:ok, map()} | {:error, Ecto.Changeset.t()}
  def validate_wallet_challenge(params) do
    %__MODULE__{}
    |> cast(params, [:wallet_address], empty_values: [""])
    |> validate_required([:wallet_address])
    |> result_from_changeset()
  end

  @doc "Validates wallet verification parameters."
  @spec validate_wallet_verify(map()) :: {:ok, map()} | {:error, Ecto.Changeset.t()}
  def validate_wallet_verify(params) do
    %__MODULE__{}
    |> cast(params, [:wallet_address, :signature], empty_values: [""])
    |> validate_required([:wallet_address, :signature])
    |> result_from_changeset()
  end

  @doc "Validates forgot password parameters."
  @spec validate_forgot_password(map()) :: {:ok, map()} | {:error, Ecto.Changeset.t()}
  def validate_forgot_password(params) do
    %__MODULE__{}
    |> cast(params, [:email], empty_values: [""])
    |> validate_required([:email])
    |> update_change(:email, &String.downcase/1)
    |> validate_format(:email, ~r/@/)
    |> result_from_changeset()
  end

  @doc "Validates password reset parameters."
  @spec validate_reset_password(map()) :: {:ok, map()} | {:error, Ecto.Changeset.t()}
  def validate_reset_password(params) do
    %__MODULE__{}
    |> cast(params, [:token, :password, :password_confirmation], empty_values: [""])
    |> validate_required([:token, :password, :password_confirmation])
    |> validate_length(:password, min: 8)
    |> validate_confirmation(:password, required: true)
    |> result_from_changeset()
  end

  defp result_from_changeset(%Ecto.Changeset{} = changeset) do
    case apply_action(changeset, :validate) do
      {:ok, struct} -> {:ok, to_map(struct)}
      {:error, cs} -> {:error, cs}
    end
  end

  defp to_map(%__MODULE__{} = struct) do
    struct
    |> Map.from_struct()
    |> Map.delete(:__meta__)
  end
end
