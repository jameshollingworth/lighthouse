import { getCloudflareContext } from "@opennextjs/cloudflare";
import { deriveRoomExits, type RoomPosition } from "@/game/movement";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RoomRow extends RoomPosition {
  name: string;
  description: string;
  grid_x: number;
  grid_y: number;
}

export async function GET() {
  const { env } = getCloudflareContext();
  const query = await env.ROOMS_DB
    .prepare("SELECT id, name, description, grid_x, grid_y FROM rooms ORDER BY grid_y, grid_x")
    .all<Omit<RoomRow, "gridX" | "gridY">>();
  const results: Omit<RoomRow, "gridX" | "gridY">[] = query.results;

  const positions: RoomPosition[] = results.map((room) => ({
    id: room.id,
    gridX: room.grid_x,
    gridY: room.grid_y,
  }));
  const exits = deriveRoomExits(positions);
  const rooms = results.map(({ grid_x, grid_y, ...room }) => ({
    ...room,
    gridX: grid_x,
    gridY: grid_y,
    exits: exits[room.id] ?? {},
  }));

  return Response.json(rooms, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
