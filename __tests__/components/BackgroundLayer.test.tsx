import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import BackgroundLayer from "@/components/BackgroundLayer";

describe("BackgroundLayer", () => {
  it("should render a video element", () => {
    render(<BackgroundLayer themeId="seoul" />);
    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
  });

  it("should set the video src to the theme's webm path", () => {
    render(<BackgroundLayer themeId="seoul" />);
    const video = document.querySelector("video");
    expect(video?.src).toContain("/bg/seoul.webm");
  });

  it("should set poster attribute to the theme's jpg path", () => {
    render(<BackgroundLayer themeId="seoul" />);
    const video = document.querySelector("video");
    expect(video?.getAttribute("poster")).toContain("/bg/seoul.jpg");
  });

  it("should have muted, loop, playsInline, autoPlay attributes", () => {
    render(<BackgroundLayer themeId="seoul" />);
    const video = document.querySelector("video") as HTMLVideoElement;
    // React sets muted as a DOM property, not an HTML attribute
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");
    // autoPlay becomes autoplay in the DOM
    expect(video?.hasAttribute("autoplay") || video?.hasAttribute("autoPlay")).toBe(true);
  });

  it("should update video src when themeId prop changes", () => {
    const { rerender } = render(<BackgroundLayer themeId="seoul" />);
    rerender(<BackgroundLayer themeId="tokyo" />);
    // After transition completes, the current video should be tokyo
    // (BackgroundLayer may show both during crossfade — at least one should be tokyo)
    const videos = document.querySelectorAll("video");
    const srcs = Array.from(videos).map((v) => v.src);
    expect(srcs.some((s) => s.includes("tokyo"))).toBe(true);
  });

  it("should apply a dark overlay div over the video", () => {
    const { container } = render(<BackgroundLayer themeId="seoul" />);
    const overlay = container.querySelector("[data-overlay]");
    expect(overlay).toBeInTheDocument();
  });
});
