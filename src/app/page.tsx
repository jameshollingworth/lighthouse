"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { availableDirections, initialGameState, move as moveGame, type Direction, type RoomId, type RoomPosition } from "@/game/movement";
import { ROOM_AUDIO_AUTO_STARTS_ON_MOVEMENT, RoomAudioPlayer } from "@/game/audio";

interface Room extends RoomPosition {
  name: string;
  description: string;
  exits: Partial<Record<Direction, RoomId>>;
}

const roomAtmosphere: Partial<Record<RoomId, { mood: string; imageAlt: string }>> = {
  stair: {
    mood: "Violet shadows · hushed and mysterious",
    imageAlt: "Salt-worn iron stairs spiral around a stone column beside a warmly lit doorway.",
  },
  lamp: {
    mood: "Golden light · warm and watchful",
    imageAlt: "A glowing glass lighthouse lens overlooks the dark sea at dusk.",
  },
  kitchen: {
    mood: "Ember red · quiet and nostalgic",
    imageAlt: "A chipped mug and open logbook rest on a wooden table beside an old iron stove.",
  },
  rocks: {
    mood: "Ocean blue · wild and windswept",
    imageAlt: "Waves break over wet black rocks below the lighthouse's iron ladder and weathered door.",
  },
};

const knownImageRooms = new Set(["stair", "lamp", "kitchen", "rocks"]);
const directionLabels: Record<Direction, string> = {
  north: "North ↑",
  east: "East →",
  south: "South ↓",
  west: "West ←",
};
const keyDirections: Record<string, Direction> = {
  ArrowUp: "north",
  ArrowRight: "east",
  ArrowDown: "south",
  ArrowLeft: "west",
};

export default function Home() {
  const [game, setGame] = useState(initialGameState);
  const [message, setMessage] = useState("");
  const [moving, setMoving] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(35);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsError, setRoomsError] = useState("");
  const audioRef = useRef<RoomAudioPlayer | null>(null);
  const audioMutedRef = useRef(false);
  const currentRoom = game.room;
  const sceneRef = useRef<HTMLElement>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    document.body.dataset.theme = currentRoom;
  }, [currentRoom]);

  useEffect(() => {
    if (!audioMutedRef.current) audioRef.current?.playRoom(currentRoom);
  }, [currentRoom]);

  useEffect(() => () => audioRef.current?.dispose(), []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/rooms", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load the lighthouse rooms.");
        return response.json() as Promise<Room[]>;
      })
      .then(setRooms)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRoomsError("The rooms could not be loaded. Please try again.");
      });
    return () => controller.abort();
  }, []);

  const startAudio = useCallback((room: RoomId) => {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;
    const player = audioRef.current ?? new RoomAudioPlayer(new AudioContextConstructor());
    audioRef.current = player;
    player.setVolume(audioVolume / 100);
    void player.enable();
    player.playRoom(room);
    audioMutedRef.current = false;
    setAudioMuted(false);
    setAudioEnabled(true);
  }, [audioVolume]);

  const toggleAudio = useCallback(() => {
    if (audioEnabled) {
      audioRef.current?.disable();
      audioMutedRef.current = true;
      setAudioMuted(true);
      setAudioEnabled(false);
      return;
    }
    startAudio(currentRoom);
  }, [audioEnabled, currentRoom, startAudio]);

  const changeAudioVolume = useCallback((value: number) => {
    setAudioVolume(value);
    audioRef.current?.setVolume(value / 100);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      reducedMotionRef.current = preference.matches;
    };
    syncPreference();
    preference.addEventListener("change", syncPreference);

    for (const id of knownImageRooms) {
      const image = new window.Image();
      image.src = `/assets/rooms/${id}.jpg`;
    }

    return () => preference.removeEventListener("change", syncPreference);
  }, []);

  const fade = useCallback(async (from: number, to: number) => {
    const scene = sceneRef.current;
    if (!scene || reducedMotionRef.current) return;
    const animation = scene.animate([{ opacity: from }, { opacity: to }], {
      duration: 180,
      easing: "ease-in-out",
      fill: "forwards",
    });
    try {
      await animation.finished;
      scene.style.opacity = String(to);
    } finally {
      animation.cancel();
    }
  }, []);

  const moveDirection = useCallback(async (direction: Direction) => {
    if (moving || rooms.length === 0) return;
    const result = moveGame(game, direction, rooms);
    if (result.state === game) {
      setMessage(result.message);
      return;
    }

    if (ROOM_AUDIO_AUTO_STARTS_ON_MOVEMENT && !audioMutedRef.current && !audioRef.current) {
      startAudio(currentRoom);
    }

    setMoving(true);
    try {
      await fade(1, 0);
      setGame(result.state);
      setMessage(result.message);
      await fade(0, 1);
    } finally {
      if (sceneRef.current) sceneRef.current.style.opacity = "1";
      setMoving(false);
    }
  }, [currentRoom, fade, game, moving, rooms, startAudio]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const direction = keyDirections[event.key];
      if (!direction) return;
      event.preventDefault();
      void moveDirection(direction);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [moveDirection]);

  const room = rooms.find((item) => item.id === currentRoom);
  const atmosphere = roomAtmosphere[currentRoom];

  return (
    <main>
      <header>
        <p className="eyebrow">A four-room text adventure</p>
        <h1>The Last Light</h1>
        <p className="intro">A small lighthouse. An endless sea. Somewhere, a light still burns.</p>
      </header>
      <div className="label" id="map-label">The lighthouse · N ↑</div>
      <div className="map" role="group" aria-labelledby="map-label">
        {rooms.map((item) => (
          <div
            key={item.id}
            data-room={item.id}
            aria-current={currentRoom === item.id ? "location" : undefined}
            style={{ gridColumn: item.gridX + 1, gridRow: item.gridY + 1 }}
          >
            {item.name}
          </div>
        ))}
      </div>
      <p className="map-key">● You are here</p>
      {roomsError ? <p role="alert">{roomsError}</p> : room ? <section id="scene" ref={sceneRef} aria-live="polite" aria-atomic="true">
        <div className="label">You are here</div>
        <h2>{room.name}</h2>
        <p id="mood">{atmosphere?.mood ?? "Salt air · quiet and watchful"}</p>
        <Image
          id="room-image"
          src={`/assets/rooms/${knownImageRooms.has(currentRoom) ? currentRoom : "rocks"}.jpg`}
          alt={atmosphere?.imageAlt ?? `${room.name}, somewhere inside the lighthouse.`}
          width={1536}
          height={1024}
          unoptimized
          priority
        />
        <p id="description">{room.description}</p>
        <p id="exits">You can go: {availableDirections(game, rooms).map((direction) => directionLabels[direction]).join(" · ")}</p>
      </section> : <p role="status">Loading the lighthouse rooms…</p>}
      <p id="message" role="status" aria-live="polite">{message}</p>
      <div className="audio-controls" aria-label="Room audio controls">
        <button type="button" className="audio-toggle" onClick={toggleAudio} aria-pressed={!audioMuted}>
          {audioEnabled ? "Mute room audio" : audioMuted ? "Unmute room audio" : "Play room audio"}
        </button>
        <label htmlFor="audio-volume">Volume</label>
        <input
          id="audio-volume"
          type="range"
          min="0"
          max="100"
          value={audioVolume}
          onChange={(event) => changeAudioVolume(Number(event.target.value))}
        />
      </div>
      <nav className="controls" aria-label="Movement controls">
        {(["north", "west", "south", "east"] as Direction[]).map((direction) => (
          <button
            key={direction}
            type="button"
            data-direction={direction}
            aria-label={`Go ${direction}`}
            disabled={moving || rooms.length === 0}
            onClick={() => void moveDirection(direction)}
          >
            {{ north: "↑", east: "→", south: "↓", west: "←" }[direction]}
          </button>
        ))}
      </nav>
      <footer>Use the arrow keys or the buttons to explore.<br />Four rooms. Take your time.</footer>
    </main>
  );
}
