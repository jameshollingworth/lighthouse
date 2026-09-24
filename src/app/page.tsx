"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { availableDirections, initialGameState, move as moveGame, type Direction, type RoomId } from "@/game/movement";
import { ROOM_AUDIO_AUTO_STARTS_ON_MOVEMENT, RoomAudioPlayer } from "@/game/audio";

interface Room {
  name: string;
  imageAlt: string;
  mood: string;
  description: string;
}

const rooms: Record<RoomId, Room> = {
  stair: {
    name: "Spiral Stair",
    mood: "Violet shadows · hushed and mysterious",
    imageAlt: "Salt-worn iron stairs spiral around a stone column beside a warmly lit doorway.",
    description: "An iron staircase curls around a stone column, its steps dusted with salt. Warm light spills through the eastern doorway, while the smell of cold tea drifts up from the kitchen to the south.",
  },
  lamp: {
    name: "Lamp Room",
    mood: "Golden light · warm and watchful",
    imageAlt: "A glowing glass lighthouse lens overlooks the dark sea at dusk.",
    description: "A great glass lens turns slowly, casting a golden beam across the dark sea. The Spiral Stair waits to the west, and an iron ladder leads south down to the rocks.",
  },
  kitchen: {
    name: "Keeper's Kitchen",
    mood: "Ember red · quiet and nostalgic",
    imageAlt: "A chipped mug and open logbook rest on a wooden table beside an old iron stove.",
    description: "A chipped mug and an open logbook sit on a wooden table beside a cold stove. The Spiral Stair rises to the north, and the eastern door opens onto the wet rocks.",
  },
  rocks: {
    name: "Rocks",
    mood: "Ocean blue · wild and windswept",
    imageAlt: "Waves break over wet black rocks below the lighthouse's iron ladder and weathered door.",
    description: "Black rocks glisten beneath your feet as white waves break against the lighthouse. A narrow iron ladder climbs north to the Lamp Room, and a weathered kitchen door stands to the west.",
  },
};

const roomOrder: RoomId[] = ["stair", "lamp", "kitchen", "rocks"];
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

    for (const id of roomOrder) {
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
    if (moving) return;
    const result = moveGame(game, direction);
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
      if (!audioMutedRef.current) audioRef.current?.playEntryLine(result.state.room);
      await fade(0, 1);
    } finally {
      if (sceneRef.current) sceneRef.current.style.opacity = "1";
      setMoving(false);
    }
  }, [currentRoom, fade, game, moving, startAudio]);

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

  const room = rooms[currentRoom];

  return (
    <main>
      <header>
        <p className="eyebrow">A four-room text adventure</p>
        <h1>The Last Light</h1>
        <p className="intro">A small lighthouse. An endless sea. Somewhere, a light still burns.</p>
      </header>
      <div className="label" id="map-label">The lighthouse · N ↑</div>
      <div className="map" role="group" aria-labelledby="map-label">
        {roomOrder.map((id) => (
          <div key={id} data-room={id} aria-current={currentRoom === id ? "location" : undefined}>
            {rooms[id].name === "Keeper's Kitchen" ? "Keeper's Kitchen" : rooms[id].name}
          </div>
        ))}
      </div>
      <p className="map-key">● You are here</p>
      <section id="scene" ref={sceneRef} aria-live="polite" aria-atomic="true">
        <div className="label">You are here</div>
        <h2>{room.name}</h2>
        <p id="mood">{room.mood}</p>
        <Image
          id="room-image"
          src={`/assets/rooms/${currentRoom}.jpg`}
          alt={room.imageAlt}
          width={1536}
          height={1024}
          unoptimized
          priority
        />
        <p id="description">{room.description}</p>
        <p id="exits">You can go: {availableDirections(game).map((direction) => directionLabels[direction]).join(" · ")}</p>
      </section>
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
            disabled={moving}
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
