import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthButton from "@/components/AuthButton";

const signInWithPassword = jest.fn();
const signUp = jest.fn();
const signOut = jest.fn();
const getUser = jest.fn();
const onAuthStateChange = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => signInWithPassword(...args),
      signUp: (...args: unknown[]) => signUp(...args),
      signOut: (...args: unknown[]) => signOut(...args),
      getUser: (...args: unknown[]) => getUser(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChange(...args),
    },
  }),
}));

beforeEach(() => {
  signInWithPassword.mockReset();
  signUp.mockReset();
  signOut.mockReset();
  getUser.mockReset();
  onAuthStateChange.mockReset();
  getUser.mockResolvedValue({ data: { user: null }, error: null });
  onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
});

describe("AuthButton", () => {
  it("should_render_sign_in_button_when_signed_out", async () => {
    render(<AuthButton />);
    expect(
      await screen.findByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("should_open_form_with_email_and_password_when_sign_in_clicked", async () => {
    const user = userEvent.setup();
    render(<AuthButton />);
    await user.click(await screen.findByRole("button", { name: /sign in/i }));
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("should_call_signInWithPassword_with_form_values_on_submit", async () => {
    const user = userEvent.setup();
    signInWithPassword.mockResolvedValue({ data: {}, error: null });
    render(<AuthButton />);
    await user.click(await screen.findByRole("button", { name: /sign in/i }));
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText(/password/i), "hunter22");
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "hunter22",
      });
    });
  });

  it("should_show_error_message_when_sign_in_fails", async () => {
    const user = userEvent.setup();
    signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: "Invalid login credentials" },
    });
    render(<AuthButton />);
    await user.click(await screen.findByRole("button", { name: /sign in/i }));
    await user.type(screen.getByLabelText(/email/i), "a@b.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    expect(
      await screen.findByText(/invalid login credentials/i),
    ).toBeInTheDocument();
    // form still open
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("should_render_email_and_sign_out_when_signed_in", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "me@example.com" } },
      error: null,
    });
    render(<AuthButton />);
    expect(await screen.findByText(/me@example\.com/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  it("should_call_signOut_when_sign_out_clicked", async () => {
    const user = userEvent.setup();
    getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "me@example.com" } },
      error: null,
    });
    signOut.mockResolvedValue({ error: null });
    render(<AuthButton />);
    await user.click(await screen.findByRole("button", { name: /sign out/i }));
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  it("should_route_submit_through_signUp_in_sign_up_mode", async () => {
    const user = userEvent.setup();
    signUp.mockResolvedValue({ data: {}, error: null });
    render(<AuthButton />);
    await user.click(await screen.findByRole("button", { name: /sign in/i }));
    // toggle to sign up mode
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    await user.type(screen.getByLabelText(/email/i), "new@example.com");
    await user.type(screen.getByLabelText(/password/i), "hunter22");
    await user.click(screen.getByRole("button", { name: /^submit$/i }));
    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "hunter22",
      });
    });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});
