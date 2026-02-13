ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(CGraph.Repo, :manual)

# Import ExMachina factory helpers in all tests
{:ok, _} = Application.ensure_all_started(:ex_machina)
