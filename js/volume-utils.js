(function (root) {
  const VOLUME_STORAGE_KEY = "marioPlayer.volume";

  function normalizeVolumePercent(value, fallback = 100) {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return fallback;
    }
    return Math.min(100, Math.max(0, Math.round(num)));
  }

  function parseSavedVolume(raw) {
    return normalizeVolumePercent(raw, 100);
  }

  function percentToMediaVolume(percent) {
    return normalizeVolumePercent(percent, 100) / 100;
  }

  const api = {
    VOLUME_STORAGE_KEY,
    normalizeVolumePercent,
    parseSavedVolume,
    percentToMediaVolume,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.VolumeUtils = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
