const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isPictureInPictureSupported,
  getMiniPlayerState,
  computeMediaAspectFit,
  formatMiniPlayerSubtitle,
} = require("../js/mini-player-utils.js");

test("isPictureInPictureSupported validates document and video element capabilities", () => {
  assert.equal(isPictureInPictureSupported(null, null), false);
  assert.equal(
    isPictureInPictureSupported(
      { pictureInPictureEnabled: false },
      { requestPictureInPicture: () => {} }
    ),
    false
  );
  assert.equal(
    isPictureInPictureSupported(
      { pictureInPictureEnabled: true },
      { requestPictureInPicture: () => {}, disablePictureInPicture: true }
    ),
    false
  );
  assert.equal(
    isPictureInPictureSupported(
      { pictureInPictureEnabled: true },
      { requestPictureInPicture: () => {}, disablePictureInPicture: false }
    ),
    true
  );
});

test("getMiniPlayerState resolves off, pip, and dock states cleanly", () => {
  assert.deepEqual(getMiniPlayerState({ hasMedia: false, pipActive: false }), {
    active: false,
    mode: "off",
    canEnter: false,
    buttonLabel: "Mini-Player",
  });
  assert.deepEqual(getMiniPlayerState({ hasMedia: true, pipActive: true }), {
    active: true,
    mode: "pip",
    canEnter: true,
    buttonLabel: "Exit Mini-Player",
  });
  assert.deepEqual(
    getMiniPlayerState({ hasMedia: true, pipActive: false, inAppMiniActive: true }),
    {
      active: true,
      mode: "dock",
      canEnter: true,
      buttonLabel: "Exit Mini-Player",
    }
  );
});

test("computeMediaAspectFit letterboxes source cleanly within target bounds", () => {
  const fitWide = computeMediaAspectFit(1920, 1080, 480, 360);
  assert.equal(fitWide.width, 480);
  assert.equal(fitWide.height, 270);
  assert.equal(fitWide.x, 0);
  assert.equal(fitWide.y, 45);

  const fitSquare = computeMediaAspectFit(100, 100, 300, 200);
  assert.equal(fitSquare.width, 200);
  assert.equal(fitSquare.height, 200);
  assert.equal(fitSquare.x, 50);
  assert.equal(fitSquare.y, 0);
});

test("formatMiniPlayerSubtitle formats artist and playback timestamps cleanly", () => {
  assert.equal(
    formatMiniPlayerSubtitle({ artist: "Tana Collective", year: "2024" }, 65, 190),
    "Tana Collective · 01:05 / 03:10"
  );
  assert.equal(
    formatMiniPlayerSubtitle({ artist: "Mario", year: "2022" }, 0, 0),
    "Mario · 2022"
  );
  assert.equal(formatMiniPlayerSubtitle(null, 12, 90), "00:12 / 01:30");
});
