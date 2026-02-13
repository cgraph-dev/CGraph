defmodule CGraph.MailerTest do
  @moduledoc "Tests for email delivery infrastructure."
  use ExUnit.Case, async: true

  alias CGraph.Mailer

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(Mailer)
    end

    test "exports delivery functions" do
      assert function_exported?(Mailer, :deliver_welcome_email, 1)
      assert function_exported?(Mailer, :deliver_verification_email, 2)
      assert function_exported?(Mailer, :deliver_password_reset_email, 2)
      assert function_exported?(Mailer, :deliver_security_alert, 3)
    end
  end

  describe "deliver_welcome_email/1" do
    test "requires a valid user" do
      result = Mailer.deliver_welcome_email(nil)
      assert match?({:error, _}, result) or is_nil(result)
    end
  end
end
