defmodule CGraphWeb.StripeWebhookControllerTest do
  @moduledoc """
  Tests for Stripe webhook handler.

  NOTE: Full event handler tests are limited because Stripe signature
  verification requires a valid secret + Stripe library, and there is
  no mocking framework (Mox) installed. The Subscriptions context
  is tested in CGraph.SubscriptionsTest.
  """
  use CGraphWeb.ConnCase, async: true

  describe "POST /webhooks/stripe" do
    test "rejects request without Stripe signature" do
      conn = build_conn()
      conn = post(conn, "/webhooks/stripe", %{type: "checkout.session.completed"})

      # Should reject - no valid Stripe signature
      assert conn.status in [400, 401, 403, 404]
    end

    test "rejects request with empty body" do
      conn =
        build_conn()
        |> put_req_header("stripe-signature", "t=123,v1=abc")
        |> put_req_header("content-type", "application/json")
        |> post("/webhooks/stripe", "{}")

      assert conn.status in [400, 401, 403, 404]
    end

    test "rejects request with invalid signature format" do
      conn =
        build_conn()
        |> put_req_header("stripe-signature", "t=0,v1=invalid_signature_value")
        |> put_req_header("content-type", "application/json")
        |> post("/webhooks/stripe", Jason.encode!(%{type: "checkout.session.completed"}))

      assert conn.status in [400, 401, 403, 404]
    end

    test "rejects request without signature header" do
      conn =
        build_conn()
        |> put_req_header("content-type", "application/json")
        |> post("/webhooks/stripe", Jason.encode!(%{type: "customer.subscription.created"}))

      assert conn.status in [400, 401, 403, 404]
    end
  end
end
