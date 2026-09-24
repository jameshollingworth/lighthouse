import assert from "node:assert/strict";
import test from "node:test";
import { availableDirections, deriveRoomExits, initialGameState, move } from "./movement.ts";

test("the Lamp Room stays locked until the Keeper's Kitchen has been visited", () => {
  const firstAttempt = move(initialGameState, "north");

  assert.equal(firstAttempt.state.room, "rocks");
  assert.equal(firstAttempt.message, "The lamp room door is locked.");

  const kitchen = move(firstAttempt.state, "west");
  assert.equal(kitchen.state.room, "kitchen");

  const rocks = move(kitchen.state, "east");
  assert.equal(rocks.state.room, "rocks");

  const lampRoom = move(rocks.state, "north");
  assert.equal(lampRoom.state.room, "lamp");
});

test("room doors are derived from adjacent grid positions", () => {
  const rooms = [
    { id: "stair", gridX: 0, gridY: 0 },
    { id: "lamp", gridX: 1, gridY: 0 },
    { id: "kitchen", gridX: 0, gridY: 1 },
    { id: "rocks", gridX: 1, gridY: 1 },
    { id: "watch-post", gridX: 2, gridY: 1 },
  ];

  const exits = deriveRoomExits(rooms);
  assert.equal(exits.rocks.east, "watch-post");
  assert.equal(exits["watch-post"].west, "rocks");

  const result = move({ ...initialGameState, visitedKitchen: true }, "east", rooms);
  assert.equal(result.state.room, "watch-post");
});

test("the kitchen lock does not block a newly added room above the rocks", () => {
  const rooms = [
    { id: "new-room", gridX: 0, gridY: 0 },
    { id: "rocks", gridX: 0, gridY: 1 },
  ];
  const state = { room: "rocks", visitedKitchen: false };

  assert.deepEqual(availableDirections(state, rooms), ["north"]);
  assert.equal(move(state, "north", rooms).state.room, "new-room");
});
