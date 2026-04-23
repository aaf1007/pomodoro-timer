import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Controls from "@/components/Controls";

const noop = () => {};

describe("Controls", () => {
  it("renders start/reset without settings button when onOpenSettings is absent", () => {
    render(<Controls running={false} onStart={noop} onPause={noop} onReset={noop} />);
    expect(screen.getByText("start")).toBeInTheDocument();
    expect(screen.queryByLabelText(/open settings/i)).toBeNull();
  });

  it("renders settings button when onOpenSettings provided", async () => {
    const onOpenSettings = jest.fn();
    const user = userEvent.setup();
    render(
      <Controls
        running={false}
        onStart={noop}
        onPause={noop}
        onReset={noop}
        onOpenSettings={onOpenSettings}
      />,
    );
    const btn = screen.getByLabelText(/open settings/i);
    await user.click(btn);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
