(function (root) {
  const REPEAT_MODES = ["off", "all", "one"];
  const MEDIA_EXTENSION_RE =
    /\.(mp4|webm|ogg|ogv|mov|m4v|mkv|avi|mp3|wav|oga|aac|m4a|flac|opus|wma)$/i;

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

  function isSupportedMediaFile(file) {
    if (!file || typeof file !== "object") {
      return false;
    }
    if (typeof file.type === "string") {
      if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
        return true;
      }
    }
    if (typeof file.name === "string" && MEDIA_EXTENSION_RE.test(file.name)) {
      return true;
    }
    return false;
  }

  function mergeMediaFiles(existingFiles, incomingFiles) {
    const base = Array.isArray(existingFiles) ? [...existingFiles] : [];
    const incoming = incomingFiles ? Array.from(incomingFiles) : [];
    const validIncoming = incoming.filter(isSupportedMediaFile);
    const nextFiles = base.concat(validIncoming);
    return {
      nextFiles,
      addedCount: validIncoming.length,
      shouldAutoLoad: base.length === 0 && validIncoming.length > 0,
    };
  }

  const api = {
    REPEAT_MODES,
    cycleRepeatMode,
    getNextFileIndex,
    getPrevFileIndex,
    isSupportedMediaFile,
    mergeMediaFiles,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.PlayerUtils = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
