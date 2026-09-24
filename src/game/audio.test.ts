import assert from "node:assert/strict";
import test from "node:test";
import { roomAudio } from "./audio.ts";

test("each room has the requested ambience and a distinct musical mood", () => {
  assert.deepEqual(roomAudio.stair.ambience, ["wind"]);
  assert.deepEqual(roomAudio.kitchen.ambience, ["creaking-door"]);
  assert.deepEqual(roomAudio.rocks.ambience, ["waves", "birds"]);
  assert.deepEqual(roomAudio.lamp.ambience, ["rain"]);

  const musicMoods = new Set(Object.values(roomAudio).map((room) => room.musicMood));
  assert.equal(musicMoods.size, 4);
});
