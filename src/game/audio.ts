import type { RoomId } from "./movement";

export type Ambience = "wind" | "creaking-door" | "waves" | "birds" | "rain";
export type MusicMood = "mysterious" | "nostalgic" | "open-sea" | "warm-watchful";
export const ROOM_AUDIO_AUTO_STARTS_ON_MOVEMENT = true;

export const roomAudio: Record<RoomId, { ambience: Ambience[]; musicMood: MusicMood; root: number }> = {
  stair: { ambience: ["wind"], musicMood: "mysterious", root: 110 },
  kitchen: { ambience: ["creaking-door"], musicMood: "nostalgic", root: 146.83 },
  rocks: { ambience: ["waves", "birds"], musicMood: "open-sea", root: 98 },
  lamp: { ambience: ["rain"], musicMood: "warm-watchful", root: 164.81 },
};

type RoomLayer = { gain: GainNode; sources: AudioScheduledSourceNode[]; timers: number[] };

function noiseBuffer(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
  return buffer;
}

export class RoomAudioPlayer {
  private readonly master: GainNode;
  private readonly context: AudioContext;
  private current?: RoomLayer;
  private volume = 0.35;

  constructor(context: AudioContext) {
    this.context = context;
    this.master = context.createGain();
    this.master.gain.value = 0;
    this.master.connect(context.destination);
  }

  async enable() {
    await this.context.resume();
    this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.2);
  }

  disable() {
    this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.12);
  }

  setVolume(volume: number) {
    this.volume = volume;
    if (this.context.state === "running" && this.master.gain.value > 0) {
      this.master.gain.setTargetAtTime(volume, this.context.currentTime, 0.08);
    }
  }

  playRoom(room: RoomId) {
    const config = roomAudio[room] ?? { ambience: ["wind"] as Ambience[], musicMood: "mysterious" as MusicMood, root: 110 };
    const layer: RoomLayer = { gain: this.context.createGain(), sources: [], timers: [] };
    layer.gain.gain.value = 0;
    layer.gain.connect(this.master);
    this.addAmbience(layer, config.ambience);
    this.addMusic(layer, config.root, config.musicMood);

    const now = this.context.currentTime;
    layer.gain.gain.setTargetAtTime(0.75, now, 0.7);
    if (this.current) {
      this.current.gain.gain.setTargetAtTime(0, now, 0.45);
      const oldLayer = this.current;
      window.setTimeout(() => this.stopLayer(oldLayer), 1800);
    }
    this.current = layer;
  }

  dispose() {
    if (this.current) this.stopLayer(this.current);
    void this.context.close();
  }

  private addNoise(layer: RoomLayer, type: "wind" | "waves" | "rain") {
    const source = this.context.createBufferSource();
    source.buffer = noiseBuffer(this.context);
    source.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = type === "rain" ? "highpass" : "lowpass";
    filter.frequency.value = type === "rain" ? 2400 : type === "waves" ? 520 : 700;
    const gain = this.context.createGain();
    gain.gain.value = type === "rain" ? 0.11 : type === "waves" ? 0.3 : 0.19;
    source.connect(filter).connect(gain).connect(layer.gain);
    source.start();
    layer.sources.push(source);
    if (type !== "rain") {
      const swell = this.context.createOscillator();
      const swellGain = this.context.createGain();
      swell.frequency.value = type === "waves" ? 0.12 : 0.07;
      swellGain.gain.value = type === "waves" ? 0.13 : 0.08;
      swell.connect(swellGain).connect(gain.gain);
      swell.start();
      layer.sources.push(swell);
    }
  }

  private addAmbience(layer: RoomLayer, sounds: Ambience[]) {
    for (const sound of sounds) {
      if (sound === "wind" || sound === "waves" || sound === "rain") this.addNoise(layer, sound);
      if (sound === "creaking-door") {
        const creak = () => {
          const oscillator = this.context.createOscillator();
          const gain = this.context.createGain();
          oscillator.type = "sawtooth";
          oscillator.frequency.setValueAtTime(190, this.context.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(72, this.context.currentTime + 1.1);
          gain.gain.setValueAtTime(0.0001, this.context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.035, this.context.currentTime + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 1.2);
          oscillator.connect(gain).connect(layer.gain);
          oscillator.start();
          oscillator.stop(this.context.currentTime + 1.25);
        };
        layer.timers.push(window.setInterval(creak, 12000));
        layer.timers.push(window.setTimeout(creak, 2400));
      }
      if (sound === "birds") {
        const chirp = () => {
          const oscillator = this.context.createOscillator();
          const gain = this.context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(1500 + Math.random() * 500, this.context.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(2200, this.context.currentTime + 0.13);
          oscillator.frequency.exponentialRampToValueAtTime(1100, this.context.currentTime + 0.28);
          gain.gain.setValueAtTime(0.0001, this.context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.035, this.context.currentTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.3);
          oscillator.connect(gain).connect(layer.gain);
          oscillator.start();
          oscillator.stop(this.context.currentTime + 0.32);
        };
        layer.timers.push(window.setInterval(chirp, 8500));
        layer.timers.push(window.setTimeout(chirp, 1300));
      }
    }
  }

  private addMusic(layer: RoomLayer, root: number, mood: MusicMood) {
    const intervals: Record<MusicMood, number[]> = {
      mysterious: [1, 1.19, 1.5],
      nostalgic: [1, 1.25, 1.5],
      "open-sea": [1, 1.33, 1.5],
      "warm-watchful": [1, 1.25, 1.5, 2],
    };
    const notes = intervals[mood];
    notes.forEach((interval, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.value = root * interval;
      gain.gain.value = index === 0 ? 0.038 : 0.018;
      oscillator.connect(gain).connect(layer.gain);
      oscillator.start();
      layer.sources.push(oscillator);
    });
    const pulse = this.context.createOscillator();
    const pulseGain = this.context.createGain();
    pulse.frequency.value = mood === "mysterious" ? 0.07 : 0.045;
    pulseGain.gain.value = 0.008;
    pulse.connect(pulseGain);
    for (const source of layer.sources) {
      if (source instanceof OscillatorNode && source !== pulse) pulseGain.connect(source.frequency);
    }
    pulse.start();
    layer.sources.push(pulse);
  }

  private stopLayer(layer: RoomLayer) {
    layer.timers.forEach((timer) => {
      window.clearTimeout(timer);
      window.clearInterval(timer);
    });
    layer.sources.forEach((source) => {
      try { source.stop(); } catch { /* already stopped */ }
      source.disconnect();
    });
    layer.gain.disconnect();
  }
}
