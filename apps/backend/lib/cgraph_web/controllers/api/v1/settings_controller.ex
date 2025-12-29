defmodule CgraphWeb.API.V1.SettingsController do
  @moduledoc """
  Controller for user settings endpoints.
  """
  use CgraphWeb, :controller

  alias Cgraph.Accounts.Settings

  action_fallback CgraphWeb.FallbackController

  @doc """
  Get all settings for the current user.
  """
  def show(conn, _params) do
    user = conn.assigns.current_user
    
    with {:ok, settings} <- Settings.get_user_settings(user) do
      render(conn, :show, settings: settings)
    end
  end

  @doc """
  Update all settings at once.
  """
  def update(conn, params) do
    user = conn.assigns.current_user

    with {:ok, settings} <- Settings.update_all_settings(user, params) do
      render(conn, :show, settings: settings)
    end
  end

  @doc """
  Update notification settings only.
  """
  def update_notifications(conn, params) do
    user = conn.assigns.current_user

    with {:ok, settings} <- Settings.update_notification_settings(user, params) do
      render(conn, :show, settings: settings)
    end
  end

  @doc """
  Update privacy settings only.
  """
  def update_privacy(conn, params) do
    user = conn.assigns.current_user

    with {:ok, settings} <- Settings.update_privacy_settings(user, params) do
      render(conn, :show, settings: settings)
    end
  end

  @doc """
  Update appearance settings only.
  """
  def update_appearance(conn, params) do
    user = conn.assigns.current_user

    with {:ok, settings} <- Settings.update_appearance_settings(user, params) do
      render(conn, :show, settings: settings)
    end
  end

  @doc """
  Update locale settings only.
  """
  def update_locale(conn, params) do
    user = conn.assigns.current_user

    with {:ok, settings} <- Settings.update_locale_settings(user, params) do
      render(conn, :show, settings: settings)
    end
  end

  @doc """
  Reset all settings to defaults.
  """
  def reset(conn, _params) do
    user = conn.assigns.current_user

    with {:ok, settings} <- Settings.reset_to_defaults(user) do
      render(conn, :show, settings: settings)
    end
  end
end
