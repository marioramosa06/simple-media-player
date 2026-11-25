(function (root) {
  const REPEAT_MODES = ["off", "all", "one"];

  function cycleRepeatMode(current) {
    const idx = REPEAT_MODES.indexOf(current);
    return REPEAT_MODES[(idx + 1) % REPEAT_MODES.length];
  }

  function getNextFileIndex(currentIndex, totalFiles, repeatMode = "off", fromEnded = false) {
    if (!Number.isInteger(totalFiles) || totalFiles <= 0) {
      return -1;
    }
    if (fromEnded && repeatMode === "one") {
      return currentIndex >= 0 && currentIndex < totalFiles ? currentIndex : 0;
    }
    if (currentIndex < totalFiles - 1) {
      return currentIndex + 1;
    }
    if (repeatMode === "all" || !fromEnded) {
      return 0;
    }
    return -1;
  }

  function getPrevFileIndex(currentIndex, totalFiles) {
    if (!Number.isInteger(totalFiles) || totalFiles <= 0) {
      return -1;
    }
    if (currentIndex > 0) {
      return currentIndex - 1;
    }
    return totalFiles - 1;
  }

  const api = {
    REPEAT_MODES,
    cycleRepeatMode,
    getNextFileIndex,
    getPrevFileIndex,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.PlayerUtils = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
