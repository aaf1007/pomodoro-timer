import { describe, it, expect, vi, beforeEach } from "vitest";
import { playAlert, ALERT_SOUNDS } from "./audio";
import type { AlertSound } from "./audio";

const mockPlay = vi.fn().mockResolvedValue(undefined);

class MockAudio {
  src: string;
  volume: number = 1;
  constructor(src: string) {
    this.src = src;
  }
  play = mockPlay;
}

vi.stubGlobal("Audio", MockAudio);

describe("audio", () => {
  beforeEach(() => {
    mockPlay.mockClear();
  });

  it("should_define_four_alert_sounds", () => {
    expect(ALERT_SOUNDS).toEqual(["bell", "chime", "birds", "lofi"]);
  });

  it("should_play_correct_src_when_bell_selected", () => {
    playAlert("bell", 0.8);
    expect(mockPlay).toHaveBeenCalledOnce();
  });

  it("should_set_volume_before_playing", () => {
    let capturedVolume: number | undefined;
    const OrigMockAudio = MockAudio;
    // Override play to capture volume at call time
    class CapturingAudio extends OrigMockAudio {
      play = vi.fn().mockImplementation(() => {
        capturedVolume = this.volume;
        return Promise.resolve();
      });
    }
    vi.stubGlobal("Audio", CapturingAudio);

    playAlert("chime", 0.5);
    expect(capturedVolume).toBe(0.5);

    vi.stubGlobal("Audio", MockAudio);
  });

  it("should_use_sounds_path_for_each_alert_sound", () => {
    const sounds: AlertSound[] = ["bell", "chime", "birds", "lofi"];
    for (const sound of sounds) {
      let capturedSrc = "";
      class SrcCapture {
        src: string;
        volume = 1;
        constructor(src: string) {
          this.src = src;
          capturedSrc = src;
        }
        play = vi.fn().mockResolvedValue(undefined);
      }
      vi.stubGlobal("Audio", SrcCapture);
      playAlert(sound, 1);
      expect(capturedSrc).toBe(`/sounds/${sound}.mp3`);
    }
    vi.stubGlobal("Audio", MockAudio);
  });

  it("should_clamp_volume_to_0_when_negative", () => {
    let capturedVolume: number | undefined;
    class VolumeCapture {
      src: string;
      volume = 1;
      constructor(src: string) { this.src = src; }
      play = vi.fn().mockImplementation(() => {
        capturedVolume = this.volume;
        return Promise.resolve();
      });
    }
    vi.stubGlobal("Audio", VolumeCapture);
    playAlert("bell", -0.5);
    expect(capturedVolume).toBe(0);
    vi.stubGlobal("Audio", MockAudio);
  });

  it("should_clamp_volume_to_1_when_above_max", () => {
    let capturedVolume: number | undefined;
    class VolumeCapture {
      src: string;
      volume = 1;
      constructor(src: string) { this.src = src; }
      play = vi.fn().mockImplementation(() => {
        capturedVolume = this.volume;
        return Promise.resolve();
      });
    }
    vi.stubGlobal("Audio", VolumeCapture);
    playAlert("bell", 1.5);
    expect(capturedVolume).toBe(1);
    vi.stubGlobal("Audio", MockAudio);
  });
});
