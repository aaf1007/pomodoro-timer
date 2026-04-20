import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MigrationPrompt from "@/components/MigrationPrompt";

describe("MigrationPrompt", () => {
  it("should_render_local_and_cloud_counts", () => {
    render(
      <MigrationPrompt
        state={{ localCount: 3, cloudCount: 5 }}
        onResolve={jest.fn()}
      />,
    );
    expect(screen.getByText(/3 local todos/i)).toBeInTheDocument();
    expect(screen.getByText(/5 cloud todos/i)).toBeInTheDocument();
  });

  it("should_call_onResolve_with_merge_when_merge_clicked", async () => {
    const user = userEvent.setup();
    const onResolve = jest.fn();
    render(
      <MigrationPrompt
        state={{ localCount: 1, cloudCount: 2 }}
        onResolve={onResolve}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^merge$/i }));
    expect(onResolve).toHaveBeenCalledWith("merge");
  });

  it("should_call_onResolve_with_keep_cloud_when_keep_cloud_clicked", async () => {
    const user = userEvent.setup();
    const onResolve = jest.fn();
    render(
      <MigrationPrompt
        state={{ localCount: 1, cloudCount: 2 }}
        onResolve={onResolve}
      />,
    );
    await user.click(screen.getByRole("button", { name: /keep cloud/i }));
    expect(onResolve).toHaveBeenCalledWith("keep-cloud");
  });

  it("should_call_onResolve_with_overwrite_cloud_when_overwrite_clicked", async () => {
    const user = userEvent.setup();
    const onResolve = jest.fn();
    render(
      <MigrationPrompt
        state={{ localCount: 1, cloudCount: 2 }}
        onResolve={onResolve}
      />,
    );
    await user.click(screen.getByRole("button", { name: /overwrite cloud/i }));
    expect(onResolve).toHaveBeenCalledWith("overwrite-cloud");
  });
});
