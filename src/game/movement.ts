export type Direction = "north" | "east" | "south" | "west";
export type RoomId = "stair" | "lamp" | "kitchen" | "rocks";

export interface GameState {
  room: RoomId;
  visitedKitchen: boolean;
}

export interface MovementResult {
  state: GameState;
  message: string;
}

export const initialGameState: GameState = {
  room: "rocks",
  visitedKitchen: false,
};

const exits: Record<RoomId, Partial<Record<Direction, RoomId>>> = {
  stair: { east: "lamp", south: "kitchen" },
  lamp: { south: "rocks", west: "stair" },
  kitchen: { north: "stair", east: "rocks" },
  rocks: { north: "lamp", west: "kitchen" },
};

const blocked: Record<RoomId, Partial<Record<Direction, string>>> = {
  stair: { north: "The staircase ends at a solid stone wall.", west: "The curved lighthouse wall blocks your way." },
  lamp: { north: "Thick glass separates you from the open sea.", east: "Beyond the railing is a sheer drop to the waves." },
  kitchen: { south: "The old stove and a stone wall block your path.", west: "A narrow window is too small to climb through." },
  rocks: { south: "The rising tide has swallowed the southern path.", east: "There is only churning sea to the east." },
};

export function availableDirections(state: GameState): Direction[] {
  return (Object.keys(exits[state.room]) as Direction[]).filter(
    (direction) => state.room !== "rocks" || state.visitedKitchen || direction !== "north",
  );
}

export function move(state: GameState, direction: Direction): MovementResult {
  const destination = exits[state.room][direction];

  if (state.room === "rocks" && direction === "north" && !state.visitedKitchen) {
    return { state, message: "The lamp room door is locked." };
  }

  if (!destination) {
    return {
      state,
      message: blocked[state.room][direction] ?? "You cannot go that way.",
    };
  }

  return {
    state: {
      room: destination,
      visitedKitchen: state.visitedKitchen || destination === "kitchen",
    },
    message: "",
  };
}
