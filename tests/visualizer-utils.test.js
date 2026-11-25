const test = require("node:test");
const assert = require("node:assert/strict");
const {
  computeAudioLevel,
  computeBarHeights,
  mirrorBarHeights,
} = require("../js/visualizer-utils.js");

test("computeAudioLevel returns zero for empty or silent frequency data", () => {
  assert.deepEqual(computeAudioLevel(new Uint8Array([])), {
    average: 0,
    peak: 0,
  });
  assert.deepEqual(computeAudioLevel(new Uint8Array([0, 0, 0, 0])), {
    average: 0,
    peak: 0,
  });
});

test("computeAudioLevel computes RMS average and peak accurately", () => {
  const full = new Uint8Array([255, 255, 255, 255]);
  const resFull = computeAudioLevel(full);
  assert.equal(resFull.average, 1);
  assert.equal(resFull.peak, 1);

  const mixed = new Uint8Array([0, 255]);
  const resMixed = computeAudioLevel(mixed);
  assert.ok(Math.abs(resMixed.average - Math.SQRT1_2) < 1e-6);
  assert.equal(resMixed.peak, 1);
});

test("computeBarHeights maps frequency bins and applies decay smoothing", () => {
  const bins = new Uint8Array([255, 0, 0, 0]);
  const heights = computeBarHeights(bins, 2, 100, [0, 0], 0.8);
  assert.equal(heights.length, 2);
  assert.ok(heights[0] > 50);
  assert.equal(heights[1], 0);

  const decayed = computeBarHeights(
    new Uint8Array([0, 0, 0, 0]),
    2,
    100,
    heights,
    0.5
  );
  assert.ok(decayed[0] < heights[0]);
  assert.ok(decayed[0] > 0);
});

test("computeBarHeights snaps tiny values to zero", () => {
  const decayed = computeBarHeights(null, 2, 100, [0.3, 0.1], 0.5);
  assert.deepEqual(decayed, [0, 0]);
});

test("mirrorBarHeights creates a symmetric center-out array", () => {
  assert.deepEqual(mirrorBarHeights([10, 20, 30]), [30, 20, 10, 10, 20, 30]);
  assert.deepEqual(mirrorBarHeights([]), []);
});
