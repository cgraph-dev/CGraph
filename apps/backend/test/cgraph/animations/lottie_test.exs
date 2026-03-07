defmodule CGraph.Animations.LottieTest do
  @moduledoc "Tests for the Lottie animation asset schema and context functions."
  use CGraph.DataCase, async: true

  alias CGraph.Animations.Lottie

  @valid_attrs %{
    codepoint: "1f600",
    emoji: "😀",
    name: "grinning face",
    category: "Smileys & Emotion",
    subcategory: "face-smiling",
    keywords: ["grin", "happy", "smile"],
    lottie_url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/lottie.json",
    webp_url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.webp",
    gif_url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif",
    file_size: 37_328,
    duration_ms: 2000,
    asset_type: "emoji",
    source: "noto",
    is_active: true
  }

  # ──────────────────────────────────────────────────────────
  # Schema
  # ──────────────────────────────────────────────────────────

  describe "schema" do
    test "has all expected fields" do
      fields = Lottie.__schema__(:fields)
      expected = ~w(id codepoint emoji name category subcategory keywords
                    lottie_url webp_url gif_url file_size duration_ms
                    asset_type source is_active inserted_at updated_at)a

      for field <- expected do
        assert field in fields, "Missing field: #{field}"
      end
    end

    test "uses binary_id primary key" do
      assert {:id, :binary_id, true} ==
               {elem(Lottie.__schema__(:primary_key) |> hd() |> then(&{&1, Lottie.__schema__(:type, &1), true}), 0),
                elem(Lottie.__schema__(:primary_key) |> hd() |> then(&{&1, Lottie.__schema__(:type, &1), true}), 1),
                Lottie.__schema__(:autogenerate_id) != nil}
    end
  end

  # ──────────────────────────────────────────────────────────
  # Changeset
  # ──────────────────────────────────────────────────────────

  describe "changeset/2" do
    test "valid attributes produce valid changeset" do
      changeset = Lottie.changeset(%Lottie{}, @valid_attrs)
      assert changeset.valid?
    end

    test "rejects missing required fields" do
      changeset = Lottie.changeset(%Lottie{}, %{})
      refute changeset.valid?

      errors = errors_on(changeset)
      assert errors[:codepoint]
      assert errors[:name]
      assert errors[:asset_type]
      assert errors[:source]
    end

    test "rejects invalid asset_type" do
      attrs = Map.put(@valid_attrs, :asset_type, "invalid")
      changeset = Lottie.changeset(%Lottie{}, attrs)
      refute changeset.valid?
      assert errors_on(changeset)[:asset_type]
    end

    test "rejects invalid source" do
      attrs = Map.put(@valid_attrs, :source, "invalid")
      changeset = Lottie.changeset(%Lottie{}, attrs)
      refute changeset.valid?
      assert errors_on(changeset)[:source]
    end

    test "rejects negative file_size" do
      attrs = Map.put(@valid_attrs, :file_size, -1)
      changeset = Lottie.changeset(%Lottie{}, attrs)
      refute changeset.valid?
      assert errors_on(changeset)[:file_size]
    end

    test "rejects negative duration_ms" do
      attrs = Map.put(@valid_attrs, :duration_ms, -100)
      changeset = Lottie.changeset(%Lottie{}, attrs)
      refute changeset.valid?
      assert errors_on(changeset)[:duration_ms]
    end

    test "accepts all valid asset types" do
      for type <- ~w(emoji border effect sticker) do
        attrs = Map.put(@valid_attrs, :asset_type, type)
        changeset = Lottie.changeset(%Lottie{}, attrs)
        assert changeset.valid?, "asset_type #{type} should be valid"
      end
    end

    test "accepts all valid sources" do
      for source <- ~w(noto custom premium) do
        attrs = Map.put(@valid_attrs, :source, source)
        changeset = Lottie.changeset(%Lottie{}, attrs)
        assert changeset.valid?, "source #{source} should be valid"
      end
    end
  end

  describe "create_changeset/2" do
    test "works with default struct" do
      changeset = Lottie.create_changeset(@valid_attrs)
      assert changeset.valid?
    end
  end

  # ──────────────────────────────────────────────────────────
  # Query Helpers
  # ──────────────────────────────────────────────────────────

  describe "by_codepoint/1" do
    test "returns query filtering by codepoint" do
      query = Lottie.by_codepoint("1f600")
      assert %Ecto.Query{} = query
    end
  end

  describe "by_category/1" do
    test "returns query filtering by category" do
      query = Lottie.by_category("Smileys & Emotion")
      assert %Ecto.Query{} = query
    end
  end

  describe "active/0" do
    test "returns query filtering active assets" do
      query = Lottie.active()
      assert %Ecto.Query{} = query
    end
  end

  describe "search/1" do
    test "returns query for search term" do
      query = Lottie.search("smile")
      assert %Ecto.Query{} = query
    end
  end

  # ──────────────────────────────────────────────────────────
  # Context Functions (CRUD)
  # ──────────────────────────────────────────────────────────

  describe "create/1" do
    test "inserts a valid lottie asset" do
      assert {:ok, %Lottie{} = lottie} = Lottie.create(@valid_attrs)
      assert lottie.codepoint == "1f600"
      assert lottie.emoji == "😀"
      assert lottie.name == "grinning face"
      assert lottie.asset_type == "emoji"
      assert lottie.source == "noto"
      assert lottie.is_active == true
    end

    test "returns error for invalid data" do
      assert {:error, %Ecto.Changeset{}} = Lottie.create(%{})
    end

    test "enforces unique constraint on codepoint + asset_type" do
      assert {:ok, _} = Lottie.create(@valid_attrs)
      assert {:error, changeset} = Lottie.create(@valid_attrs)
      assert errors_on(changeset)[:codepoint]
    end
  end

  describe "get_animation/1" do
    test "returns animation by ID" do
      {:ok, created} = Lottie.create(@valid_attrs)
      assert {:ok, %Lottie{id: id}} = Lottie.get_animation(created.id)
      assert id == created.id
    end

    test "returns error for non-existent ID" do
      assert {:error, :not_found} = Lottie.get_animation(Ecto.UUID.generate())
    end
  end

  describe "get_by_codepoint/1" do
    test "returns animation by codepoint" do
      {:ok, _} = Lottie.create(@valid_attrs)
      assert {:ok, %Lottie{codepoint: "1f600"}} = Lottie.get_by_codepoint("1f600")
    end

    test "returns error for non-existent codepoint" do
      assert {:error, :not_found} = Lottie.get_by_codepoint("0000")
    end
  end

  describe "list_by_category/1" do
    test "returns animations in category" do
      {:ok, _} = Lottie.create(@valid_attrs)
      results = Lottie.list_by_category("Smileys & Emotion")
      assert length(results) == 1
      assert hd(results).category == "Smileys & Emotion"
    end

    test "returns empty list for unknown category" do
      assert [] == Lottie.list_by_category("Nonexistent")
    end

    test "respects limit option" do
      for i <- 1..5 do
        Lottie.create(%{@valid_attrs | codepoint: "1f60#{i}", name: "emoji #{i}"})
      end

      results = Lottie.list_by_category("Smileys & Emotion", limit: 3)
      assert length(results) == 3
    end
  end

  describe "update/2" do
    test "updates a lottie asset" do
      {:ok, lottie} = Lottie.create(@valid_attrs)
      assert {:ok, updated} = Lottie.update(lottie, %{name: "updated name"})
      assert updated.name == "updated name"
    end
  end
end
