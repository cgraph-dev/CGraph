defmodule CGraph.Jobs.Workflows do
  @moduledoc """
  Workflow orchestration for multi-step background jobs.

  Provides a public API for starting, monitoring, pausing, resuming, and
  cancelling workflows. Workflow state is managed by `CGraph.Jobs.Server`.
  """

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Start a new workflow.

  A workflow is a series of jobs that are executed in a specific order with
  dependency management and conditional execution.

  ## Examples

      workflow = %{
        name: "user_onboarding",
        steps: [
          %{id: :create_user, worker: CreateUserWorker, args: %{email: "test@example.com"}},
          %{id: :send_email, worker: SendEmailWorker, args: %{}, depends_on: [:create_user]},
          %{id: :setup_defaults, worker: SetupDefaultsWorker, args: %{}, depends_on: [:create_user]}
        ],
        context: %{source: "signup_page"}
      }

      {:ok, workflow_id} = CGraph.Jobs.Workflows.start_workflow(workflow)
  """
  @spec start_workflow(map()) :: {:ok, String.t()} | {:error, term()}
  def start_workflow(workflow) do
    GenServer.call(CGraph.Jobs.Server, {:start_workflow, workflow})
  end

  @doc """
  Get the current status of a workflow.
  """
  @spec get_workflow_status(String.t()) :: {:ok, map()} | {:error, :not_found}
  def get_workflow_status(workflow_id) do
    GenServer.call(CGraph.Jobs.Server, {:get_workflow_status, workflow_id})
  end

  @doc """
  Pause a running workflow.

  Currently executing jobs will complete, but no new jobs will be started.
  """
  @spec pause_workflow(String.t()) :: :ok | {:error, term()}
  def pause_workflow(workflow_id) do
    GenServer.call(CGraph.Jobs.Server, {:pause_workflow, workflow_id})
  end

  @doc """
  Resume a paused workflow.
  """
  @spec resume_workflow(String.t()) :: :ok | {:error, term()}
  def resume_workflow(workflow_id) do
    GenServer.call(CGraph.Jobs.Server, {:resume_workflow, workflow_id})
  end

  @doc """
  Cancel a workflow and all its pending jobs.
  """
  @spec cancel_workflow(String.t()) :: :ok | {:error, term()}
  def cancel_workflow(workflow_id) do
    GenServer.call(CGraph.Jobs.Server, {:cancel_workflow, workflow_id})
  end
end
