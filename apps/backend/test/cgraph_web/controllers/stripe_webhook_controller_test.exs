defmodule CGraphWeb.StripeWebhookControllerTest do
  @moduledoc """
  Tests for Stripe webhook handler.
  """
  use CGraphWeb.ConnCase, async: true

  describe "POST /webhooks/stripe" do
    test "rejects request without Stripe signature" do
      conn = build_conn()
      conn = post(conn, "/webhooks/stripe", %{type: "checkout.session.completed"})

      # Should reject - no valid Stripe signature
      assert conn.status in [400, 401, 403, 404]
    end
  end
end
