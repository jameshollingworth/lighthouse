export type Direction = "north" | "east" | "south" | "west";
export type RoomId = string;

export interface RoomPosition {
  id: RoomId;
  gridX: number;
  gridY: number;
}

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

export const defaultRoomPositions: RoomPosition[] = [
  { id: "stair", gridX: 0, gridY: 0 },
  { id: "lamp", gridX: 1, gridY: 0 },
  { id: "kitchen", gridX: 0, gridY: 1 },
  { id: "rocks", gridX: 1, gridY: 1 },
];

const directionNames: Direction[] = ["north", "east", "south", "west"];
const directionOffsets: Record<Direction, { x: number; y: number }> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};

const blocked: Record<string, Partial<Record<Direction, string>>> = {
  stair: { north: "The staircase ends at a solid stone wall.", west: "The curved lighthouse wall blocks your way." },
  lamp: { north: "Thick glass separates you from the open sea.", east: "Beyond the railing is a sheer drop to the waves." },
  kitchen: { south: "The old stove and a stone wall block your path.", west: "A narrow window is too small to climb through." },
  rocks: { south: "The rising tide has swallowed the southern path.", east: "There is only churning sea to the east." },
};

export function deriveRoomExits(rooms: readonly RoomPosition[]): Record<RoomId, Partial<Record<Direction, RoomId>>> {
  const roomAtPosition = new Map(rooms.map((room) => [`${room.gridX},${room.gridY}`, room.id]));
  const exits: Record<RoomId, Partial<Record<Direction, RoomId>>> = {};

  for (const room of rooms) {
    exits[room.id] = {};
    for (const direction of directionNames) {
      const offset = directionOffsets[direction];
      const neighbor = roomAtPosition.get(`${room.gridX + offset.x},${room.gridY + offset.y}`);
      if (neighbor) exits[room.id][direction] = neighbor;
    }
  }

  return exits;
}

export function availableDirections(state: GameState, rooms: readonly RoomPosition[] = defaultRoomPositions): Direction[] {
  const exits = deriveRoomExits(rooms)[state.room] ?? {};
  return (Object.keys(exits) as Direction[]).filter(
    (direction) => state.visitedKitchen || state.room !== "rocks" || exits[direction] !== "lamp",
  );
}

export function move(state: GameState, direction: number, rooms?: readonly RoomPosition[]): MovementResult;
export function move(state: GameState, direction: Direction, rooms?: readonly RoomPosition[]): MovementResult;
export function move(
  state: GameState,
  direction: number | Direction,
  rooms: readonly RoomPosition[] = defaultRoomPositions,
): MovementResult {
  const directionName = typeof direction === "number" ? directionNames[direction] : direction;
  if (!directionName) return { state, message: "You cannot go that way." };

  const destination = deriveRoomExits(rooms)[state.room]?.[directionName];
  if (state.room === "rocks" && destination === "lamp" && !state.visitedKitchen) {
    return { state, message: "The lamp room door is locked." };
  }

  if (!destination) {
    return { state, message: blocked[state.room]?.[directionName] ?? "You cannot go that way." };
  }

  return {
    state: {
      room: destination,
      visitedKitchen: state.visitedKitchen || destination === "kitchen",
    },
    message: "",
  };
}
