const test = require("node:test");
const assert = require("node:assert/strict");
const {
  VOLUME_STORAGE_KEY,
  normalizeVolumePercent,
  parseSavedVolume,
  percentToMediaVolume,
} = require("../js/volume-utils.js");

test("VOLUME_STORAGE_KEY is a non-empty string", () => {
  assert.equal(typeof VOLUME_STORAGE_KEY, "string");
  assert.ok(VOLUME_STORAGE_KEY.length > 0);
});

test("normalizeVolumePercent clamps values between 0 and 100 and falls back on invalid inputs", () => {
  assert.equal(normalizeVolumePercent(0), 0);
  assert.equal(normalizeVolumePercent("45"), 45);
  assert.equal(normalizeVolumePercent(45.6), 46);
  assert.equal(normalizeVolumePercent(-10), 0);
  assert.equal(normalizeVolumePercent(150), 100);
  assert.equal(normalizeVolumePercent(null), 100);
  assert.equal(normalizeVolumePercent(undefined), 100);
  assert.equal(normalizeVolumePercent(""), 100);
  assert.equal(normalizeVolumePercent("abc"), 100);
  assert.equal(normalizeVolumePercent(NaN), 100);
});

test("parseSavedVolume handles empty and valid stored values", () => {
  assert.equal(parseSavedVolume(null), 100);
  assert.equal(parseSavedVolume("0"), 0);
  assert.equal(parseSavedVolume("35"), 35);
  assert.equal(parseSavedVolume("100"), 100);
  assert.equal(parseSavedVolume("invalid"), 100);
});

test("percentToMediaVolume converts percentage to 0..1 audio volume", () => {
  assert.equal(percentToMediaVolume(0), 0);
  assert.equal(percentToMediaVolume(50), 0.5);
  assert.equal(percentToMediaVolume(100), 1);
  assert.equal(percentToMediaVolume(120), 1);
});
