import { playAlert, ALERT_SOUNDS } from "./audio";
import type { AlertSound } from "./audio";

const mockPlay = jest.fn().mockResolvedValue(undefined);

class MockAudio {
  src: string;
  volume: number = 1;
  error: unknown = null;
  constructor(src: string) {
    this.src = src;
  }
  play = mockPlay;
  addEventListener = jest.fn();
}

beforeAll(() => {
  global.Audio = MockAudio as unknown as typeof Audio;
});

describe("audio", () => {
  beforeEach(() => {
    mockPlay.mockClear();
  });

  it("should_define_four_alert_sounds", () => {
    expect(ALERT_SOUNDS).toEqual(["bell", "chime", "birds", "lofi"]);
  });

  it("should_play_correct_src_when_bell_selected", () => {
    playAlert("bell", 0.8);
    expect(mockPlay).toHaveBeenCalledTimes(1);
  });

  it("should_set_volume_before_playing", () => {
    let capturedVolume: number | undefined;
    class CapturingAudio extends MockAudio {
      play = jest.fn().mockImplementation(() => {
        capturedVolume = this.volume;
        return Promise.resolve();
      });
    }
    global.Audio = CapturingAudio as unknown as typeof Audio;

    playAlert("chime", 0.5);
    expect(capturedVolume).toBe(0.5);

    global.Audio = MockAudio as unknown as typeof Audio;
  });

  it("should_use_sounds_path_for_each_alert_sound", () => {
    const sounds: AlertSound[] = ["bell", "chime", "birds", "lofi"];
    for (const sound of sounds) {
      let capturedSrc = "";
      class SrcCapture {
        src: string;
        volume = 1;
        error: unknown = null;
        constructor(src: string) {
          this.src = src;
          capturedSrc = src;
        }
        play = jest.fn().mockResolvedValue(undefined);
        addEventListener = jest.fn();
      }
      global.Audio = SrcCapture as unknown as typeof Audio;
      playAlert(sound, 1);
      expect(capturedSrc).toBe(`/sounds/${sound}.mp3`);
    }
    global.Audio = MockAudio as unknown as typeof Audio;
  });

  it("should_clamp_volume_to_0_when_negative", () => {
    let capturedVolume: number | undefined;
    class VolumeCapture {
      src: string;
      volume = 1;
      error: unknown = null;
      constructor(src: string) { this.src = src; }
      play = jest.fn().mockImplementation(() => {
        capturedVolume = this.volume;
        return Promise.resolve();
      });
      addEventListener = jest.fn();
    }
    global.Audio = VolumeCapture as unknown as typeof Audio;
    playAlert("bell", -0.5);
    expect(capturedVolume).toBe(0);
    global.Audio = MockAudio as unknown as typeof Audio;
  });

  it("should_clamp_volume_to_1_when_above_max", () => {
    let capturedVolume: number | undefined;
    class VolumeCapture {
      src: string;
      volume = 1;
      error: unknown = null;
      constructor(src: string) { this.src = src; }
      play = jest.fn().mockImplementation(() => {
        capturedVolume = this.volume;
        return Promise.resolve();
      });
      addEventListener = jest.fn();
    }
    global.Audio = VolumeCapture as unknown as typeof Audio;
    playAlert("bell", 1.5);
    expect(capturedVolume).toBe(1);
    global.Audio = MockAudio as unknown as typeof Audio;
  });
});
