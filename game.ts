type Direction = "north" | "east" | "south" | "west";
type RoomId = "stair" | "lamp" | "kitchen" | "rocks";
interface Room {
  name: string;
  imageAlt: string;
  mood: string;
  description: string;
  exits: Partial<Record<Direction, RoomId>>;
  blocked: Partial<Record<Direction, string>>;
}

const rooms: Record<RoomId, Room> = {
  stair: {
    name: "Spiral Stair",
    mood: "Violet shadows · hushed and mysterious",
    imageAlt: "Salt-worn iron stairs spiral around a stone column beside a warmly lit doorway.",
    description: "An iron staircase curls around a stone column, its steps dusted with salt. Warm light spills through the eastern doorway, while the smell of cold tea drifts up from the kitchen to the south.",
    exits: { east: "lamp", south: "kitchen" },
    blocked: { north: "The staircase ends at a solid stone wall.", west: "The curved lighthouse wall blocks your way." },
  },
  lamp: {
    name: "Lamp Room",
    mood: "Golden light · warm and watchful",
    imageAlt: "A glowing glass lighthouse lens overlooks the dark sea at dusk.",
    description: "A great glass lens turns slowly, casting a golden beam across the dark sea. The Spiral Stair waits to the west, and an iron ladder leads south down to the rocks.",
    exits: { south: "rocks", west: "stair" },
    blocked: { north: "Thick glass separates you from the open sea.", east: "Beyond the railing is a sheer drop to the waves." },
  },
  kitchen: {
    name: "Keeper's Kitchen",
    mood: "Ember red · quiet and nostalgic",
    imageAlt: "A chipped mug and open logbook rest on a wooden table beside an old iron stove.",
    description: "A chipped mug and an open logbook sit on a wooden table beside a cold stove. The Spiral Stair rises to the north, and the eastern door opens onto the wet rocks.",
    exits: { north: "stair", east: "rocks" },
    blocked: { south: "The old stove and a stone wall block your path.", west: "A narrow window is too small to climb through." },
  },
  rocks: {
    name: "Rocks",
    mood: "Ocean blue · wild and windswept",
    imageAlt: "Waves break over wet black rocks below the lighthouse's iron ladder and weathered door.",
    description: "Black rocks glisten beneath your feet as white waves break against the lighthouse. A narrow iron ladder climbs north to the Lamp Room, and a weathered kitchen door stands to the west.",
    exits: { north: "lamp", west: "kitchen" },
    blocked: { south: "The rising tide has swallowed the southern path.", east: "There is only churning sea to the east." },
  },
};

const directionLabels: Record<Direction, string> = {
  north: "North ↑", east: "East →", south: "South ↓", west: "West ←",
};
const keyDirections: Record<string, Direction> = {
  ArrowUp: "north", ArrowRight: "east", ArrowDown: "south", ArrowLeft: "west",
};
let currentRoom: RoomId = "rocks";
let moving = false;
const scene = document.querySelector<HTMLElement>("#scene")!;
const mood = document.querySelector<HTMLElement>("#mood")!;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const roomName = document.querySelector<HTMLElement>("#room-name")!;
const roomImage = document.querySelector<HTMLImageElement>("#room-image")!;
const description = document.querySelector<HTMLElement>("#description")!;
const exits = document.querySelector<HTMLElement>("#exits")!;
const message = document.querySelector<HTMLElement>("#message")!;

function render(): void {
  const room = rooms[currentRoom];
  document.body.dataset.theme = currentRoom;
  mood.textContent = room.mood;
  roomName.textContent = room.name;
  roomImage.src = `assets/rooms/${currentRoom}.jpg`;
  roomImage.alt = room.imageAlt;
  description.textContent = room.description;
  exits.textContent = "You can go: " + (Object.keys(room.exits) as Direction[])
    .map(direction => directionLabels[direction]).join(" · ");
  document.querySelectorAll<HTMLElement>("[data-room]").forEach(cell => {
    if (cell.dataset.room === currentRoom) cell.setAttribute("aria-current", "location");
    else cell.removeAttribute("aria-current");
  });
}

async function fade(from: number, to: number): Promise<void> {
  if (reducedMotion.matches) return;
  const animation = scene.animate([{ opacity: from }, { opacity: to }], {
    duration: 180, easing: "ease-in-out", fill: "forwards",
  });
  try {
    await animation.finished;
    scene.style.opacity = String(to);
  } finally {
    animation.cancel();
  }
}

async function move(direction: Direction): Promise<void> {
  if (moving) return;
  const room = rooms[currentRoom];
  const destination = room.exits[direction];
  if (!destination) {
    message.textContent = room.blocked[direction] ?? "You cannot go that way.";
    return;
  }
  moving = true;
  try {
    await fade(1, 0);
    currentRoom = destination;
    message.textContent = "";
    render();
    await fade(0, 1);
  } finally {
    scene.style.opacity = "1";
    moving = false;
  }
}

document.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const direction = keyDirections[event.key];
  if (!direction) return;
  event.preventDefault();
  move(direction);
});
document.querySelectorAll<HTMLButtonElement>("[data-direction]").forEach(button => {
  button.addEventListener("click", () => move(button.dataset.direction as Direction));
});
render();
// Warm the browser cache so room changes don't reveal an unloaded photograph.
Object.keys(rooms).forEach(id => {
  const image = new Image();
  image.src = `assets/rooms/${id}.jpg`;
});
