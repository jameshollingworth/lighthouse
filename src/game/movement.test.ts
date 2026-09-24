import assert from "node:assert/strict";
import test from "node:test";
import { initialGameState, move } from "./movement.ts";

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
