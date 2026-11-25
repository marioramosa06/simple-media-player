const test = require("node:test");
const assert = require("node:assert/strict");
const {
  cycleRepeatMode,
  getNextFileIndex,
  getPrevFileIndex,
  isSupportedMediaFile,
  mergeMediaFiles,
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

test("isSupportedMediaFile accepts audio/video MIME types and extensions and rejects non-media", () => {
  assert.equal(isSupportedMediaFile({ name: "clip.mp4", type: "video/mp4" }), true);
  assert.equal(isSupportedMediaFile({ name: "song.wav", type: "audio/wav" }), true);
  assert.equal(isSupportedMediaFile({ name: "movie.mkv", type: "" }), true);
  assert.equal(isSupportedMediaFile({ name: "notes.txt", type: "text/plain" }), false);
  assert.equal(isSupportedMediaFile(null), false);
});

test("mergeMediaFiles appends valid files and signals auto-load only when starting empty", () => {
  const f1 = { name: "a.mp3", type: "audio/mpeg" };
  const f2 = { name: "b.mp4", type: "video/mp4" };
  const bad = { name: "readme.md", type: "text/markdown" };

  const firstDrop = mergeMediaFiles([], [f1, bad]);
  assert.equal(firstDrop.addedCount, 1);
  assert.equal(firstDrop.shouldAutoLoad, true);
  assert.deepEqual(firstDrop.nextFiles, [f1]);

  const secondDrop = mergeMediaFiles(firstDrop.nextFiles, [f2, bad]);
  assert.equal(secondDrop.addedCount, 1);
  assert.equal(secondDrop.shouldAutoLoad, false);
  assert.deepEqual(secondDrop.nextFiles, [f1, f2]);
});
