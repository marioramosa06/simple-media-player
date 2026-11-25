const test = require("node:test");
const assert = require("node:assert/strict");
const {
  cycleRepeatMode,
  getNextFileIndex,
  getPrevFileIndex,
} = require("../js/player-utils.js");

test("cycleRepeatMode cycles off -> all -> one -> off", () => {
  assert.equal(cycleRepeatMode("off"), "all");
  assert.equal(cycleRepeatMode("all"), "one");
  assert.equal(cycleRepeatMode("one"), "off");
  assert.equal(cycleRepeatMode("unknown"), "off");
});

test("getNextFileIndex handles empty, normal, repeat-one, and repeat-all", () => {
  assert.equal(getNextFileIndex(0, 0, "off", false), -1);
  assert.equal(getNextFileIndex(0, 3, "off", false), 1);
  assert.equal(getNextFileIndex(2, 3, "off", false), 0);
  assert.equal(getNextFileIndex(2, 3, "off", true), -1);
  assert.equal(getNextFileIndex(2, 3, "all", true), 0);
  assert.equal(getNextFileIndex(1, 3, "one", true), 1);
  assert.equal(getNextFileIndex(1, 3, "one", false), 2);
});

test("getPrevFileIndex wraps cleanly", () => {
  assert.equal(getPrevFileIndex(0, 0), -1);
  assert.equal(getPrevFileIndex(2, 3), 1);
  assert.equal(getPrevFileIndex(0, 3), 2);
});
