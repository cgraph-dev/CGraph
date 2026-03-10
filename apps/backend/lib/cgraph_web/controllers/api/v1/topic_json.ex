defmodule CGraphWeb.API.V1.TopicJSON do
  @moduledoc "JSON rendering for discovery topics and frequencies."

  @spec index(map()) :: map()
  def index(%{topics: topics}) do
    %{data: Enum.map(topics, &topic_data/1)}
  end

  @spec frequencies(map()) :: map()
  def frequencies(%{frequencies: frequencies}) do
    %{
      data:
        Enum.map(frequencies, fn f ->
          %{
            topic_id: f.topic_id,
            weight: f.weight,
            topic: topic_data(f.topic)
          }
        end)
    }
  end

  defp topic_data(%Ecto.Association.NotLoaded{}), do: nil
  defp topic_data(nil), do: nil

  defp topic_data(topic) do
    %{
      id: topic.id,
      name: topic.name,
      icon: topic.icon,
      slug: topic.slug
    }
  end
end
