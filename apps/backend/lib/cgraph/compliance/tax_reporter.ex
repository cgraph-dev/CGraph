defmodule CGraph.Compliance.TaxReporter do
  @moduledoc """
  Tax reporting compliance module.

  Aggregates creator earnings and checks against the US $600
  reporting threshold (IRS 1099-K / 1099-NEC).
  """

  @threshold_cents 60_000

  defmodule Report do
    @moduledoc "Tax report struct."
    @derive Jason.Encoder
    defstruct [
      :creator_id,
      :total_earnings,
      :threshold,
      :above_threshold,
      :tax_year,
      :generated_at
    ]

    @type t :: %__MODULE__{
            creator_id: String.t(),
            total_earnings: integer(),
            threshold: integer(),
            above_threshold: boolean(),
            tax_year: integer(),
            generated_at: DateTime.t()
          }
  end

  @doc """
  Generates a tax report for a creator for the given year.

  Aggregates all earnings and checks against the $600 threshold.
  Returns a `Report` struct.
  """
  @spec generate_report(String.t(), integer()) :: {:ok, Report.t()}
  def generate_report(creator_id, year) do
    total_earnings = aggregate_earnings(creator_id, year)

    report = %Report{
      creator_id: creator_id,
      total_earnings: total_earnings,
      threshold: @threshold_cents,
      above_threshold: total_earnings >= @threshold_cents,
      tax_year: year,
      generated_at: DateTime.utc_now() |> DateTime.truncate(:second)
    }

    {:ok, report}
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp aggregate_earnings(creator_id, year) do
    if function_exported?(CGraph.Creators.Earnings, :total_for_year, 2) do
      case CGraph.Creators.Earnings.total_for_year(creator_id, year) do
        {:ok, total} -> total
        _ -> 0
      end
    else
      0
    end
  end
end
