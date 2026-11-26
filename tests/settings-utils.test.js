const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_SETTINGS,
  normalizeSettings,
  parseSettingsJson,
} = require("../js/settings-utils.js");

test("normalizeSettings returns defaults for null or invalid input", () => {
  assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(normalizeSettings("bad"), DEFAULT_SETTINGS);
  assert.deepEqual(
    normalizeSettings({
      theme: "neon",
      repeatMode: "forever",
      seekStep: 99,
      playbackRate: 5,
      autoHideControls: "yes",
      visualizerEnabled: 1,
      visualizerStyle: "spiral",
    }),
    DEFAULT_SETTINGS
  );
});

test("normalizeSettings preserves valid values", () => {
  const custom = {
    theme: "dark",
    repeatMode: "one",
    seekStep: 15,
    playbackRate: 1.5,
    autoHideControls: false,
    autoMiniPlayer: false,
    visualizerEnabled: false,
    visualizerStyle: "waveform",
  };
  assert.deepEqual(normalizeSettings(custom), custom);
});

test("parseSettingsJson handles valid, corrupted, and empty JSON", () => {
  assert.deepEqual(parseSettingsJson(""), DEFAULT_SETTINGS);
  assert.deepEqual(parseSettingsJson("{bad json"), DEFAULT_SETTINGS);
  assert.deepEqual(
    parseSettingsJson('{"theme":"light","seekStep":30,"visualizerStyle":"waveform"}'),
    {
      ...DEFAULT_SETTINGS,
      theme: "light",
      seekStep: 30,
      visualizerStyle: "waveform",
    }
  );
});
