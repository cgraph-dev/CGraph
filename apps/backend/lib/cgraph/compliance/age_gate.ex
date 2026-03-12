defmodule CGraph.Compliance.AgeGate do
  @moduledoc """
  Age verification and consent management for COPPA / GDPR compliance.

  - Minimum age 13 (COPPA baseline)
  - Minimum age 16 for EU purchases (GDPR)
  """

  require Logger

  @coppa_min_age 13
  @eu_purchase_min_age 16

  @eu_countries ~w(AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE)

  @doc """
  Verifies whether a user meets the minimum age requirement.

  Returns `{:ok, :verified}` if age requirement is met,
  `{:error, :underage}` otherwise.
  """
  @spec verify_age(Date.t(), String.t()) :: {:ok, :verified} | {:error, :underage}
  def verify_age(%Date{} = date_of_birth, country) when is_binary(country) do
    min_age = min_age_for_country(country)
    age = age_in_years(date_of_birth)

    if age >= min_age do
      {:ok, :verified}
    else
      {:error, :underage}
    end
  end

  @doc """
  Records a consent event for audit purposes.
  """
  @spec record_consent(String.t(), String.t(), DateTime.t()) :: :ok
  def record_consent(user_id, consent_type, timestamp) do
    Logger.info(
      "Consent recorded: user=#{user_id} type=#{consent_type} at=#{DateTime.to_iso8601(timestamp)}"
    )

    :ok
  end

  @doc """
  Returns the minimum age for the given country code.
  """
  @spec min_age_for_country(String.t()) :: non_neg_integer()
  def min_age_for_country(country) do
    if country in @eu_countries do
      @eu_purchase_min_age
    else
      @coppa_min_age
    end
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp age_in_years(%Date{} = dob) do
    today = Date.utc_today()
    years = today.year - dob.year

    if Date.compare(
         %Date{year: today.year, month: dob.month, day: dob.day},
         today
       ) == :gt do
      years - 1
    else
      years
    end
  end
end
