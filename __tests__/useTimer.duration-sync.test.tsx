import { renderHook, act } from "@testing-library/react";
import { useTimer } from "@/lib/timer/useTimer";

describe("useTimer duration sync", () => {
  it("syncs remaining to new durations[mode] when idle", () => {
    const { result, rerender } = renderHook(
      ({ durations }) => useTimer(durations),
      { initialProps: { durations: { pom: 25, short: 5, long: 15 } } },
    );

    expect(result.current.remaining).toBe(25 * 60 * 1000);

    rerender({ durations: { pom: 1, short: 5, long: 15 } });
    expect(result.current.remaining).toBe(1 * 60 * 1000);
  });

  it("does not clobber remaining while running", () => {
    const { result, rerender } = renderHook(
      ({ durations }) => useTimer(durations),
      { initialProps: { durations: { pom: 25, short: 5, long: 15 } } },
    );

    act(() => result.current.start());
    const before = result.current.remaining;

    rerender({ durations: { pom: 1, short: 5, long: 15 } });
    expect(result.current.remaining).toBe(before);
  });

  it("does not re-init remaining across a start/pause toggle", () => {
    const { result } = renderHook(() =>
      useTimer({ pom: 25, short: 5, long: 15 }),
    );
    expect(result.current.remaining).toBe(25 * 60 * 1000);
    act(() => result.current.start());
    act(() => result.current.pause());
    expect(result.current.remaining).toBe(25 * 60 * 1000);
    expect(result.current.running).toBe(false);
  });

  it("preserves paused progress when duration is edited mid-pause", () => {
    const { result, rerender } = renderHook(
      ({ durations }) => useTimer(durations),
      { initialProps: { durations: { pom: 25, short: 5, long: 15 } } },
    );

    act(() => result.current.start());
    act(() => result.current.pause());
    const pausedRemaining = result.current.remaining;

    rerender({ durations: { pom: 30, short: 5, long: 15 } });
    expect(result.current.remaining).toBe(pausedRemaining);
  });

  it("re-syncs remaining after reset following a pause", () => {
    const { result, rerender } = renderHook(
      ({ durations }) => useTimer(durations),
      { initialProps: { durations: { pom: 25, short: 5, long: 15 } } },
    );

    act(() => result.current.start());
    act(() => result.current.pause());
    act(() => result.current.reset());

    rerender({ durations: { pom: 10, short: 5, long: 15 } });
    expect(result.current.remaining).toBe(10 * 60 * 1000);
  });

  it("leaves other-mode durations alone when current mode unchanged", () => {
    const { result, rerender } = renderHook(
      ({ durations }) => useTimer(durations),
      { initialProps: { durations: { pom: 25, short: 5, long: 15 } } },
    );

    rerender({ durations: { pom: 25, short: 10, long: 15 } });
    expect(result.current.remaining).toBe(25 * 60 * 1000);
  });
});
