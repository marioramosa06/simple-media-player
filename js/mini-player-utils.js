(function (root) {
  function isPictureInPictureSupported(doc, videoEl) {
    if (!doc || !doc.pictureInPictureEnabled) {
      return false;
    }
    if (!videoEl || typeof videoEl.requestPictureInPicture !== "function") {
      return false;
    }
    if (videoEl.disablePictureInPicture) {
      return false;
    }
    return true;
  }

  function getMiniPlayerState({
    hasMedia = false,
    pipActive = false,
    inAppMiniActive = false,
  } = {}) {
    if (!hasMedia) {
      return {
        active: false,
        mode: "off",
        canEnter: false,
        buttonLabel: "Mini-Player",
      };
    }
    if (pipActive) {
      return {
        active: true,
        mode: "pip",
        canEnter: true,
        buttonLabel: "Exit Mini-Player",
      };
    }
    if (inAppMiniActive) {
      return {
        active: true,
        mode: "dock",
        canEnter: true,
        buttonLabel: "Exit Mini-Player",
      };
    }
    return {
      active: false,
      mode: "off",
      canEnter: true,
      buttonLabel: "Mini-Player",
    };
  }

  function computeMediaAspectFit(srcWidth, srcHeight, boxWidth, boxHeight) {
    if (
      !Number.isFinite(srcWidth) ||
      !Number.isFinite(srcHeight) ||
      !Number.isFinite(boxWidth) ||
      !Number.isFinite(boxHeight) ||
      srcWidth <= 0 ||
      srcHeight <= 0 ||
      boxWidth <= 0 ||
      boxHeight <= 0
    ) {
      return { x: 0, y: 0, width: Math.max(0, boxWidth || 0), height: Math.max(0, boxHeight || 0) };
    }
    const scale = Math.min(boxWidth / srcWidth, boxHeight / srcHeight);
    const width = srcWidth * scale;
    const height = srcHeight * scale;
    return {
      x: (boxWidth - width) / 2,
      y: (boxHeight - height) / 2,
      width,
      height,
    };
  }

  function formatMiniPlayerTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const total = Math.floor(seconds);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function formatMiniPlayerSubtitle(meta, currentTimeSec, durationSec) {
    const parts = [];
    if (meta && meta.artist) {
      parts.push(meta.artist);
    }
    if (Number.isFinite(durationSec) && durationSec > 0) {
      parts.push(`${formatMiniPlayerTime(currentTimeSec)} / ${formatMiniPlayerTime(durationSec)}`);
    } else if (meta && meta.year) {
      parts.push(meta.year);
    }
    return parts.join(" · ");
  }

  const api = {
    isPictureInPictureSupported,
    getMiniPlayerState,
    computeMediaAspectFit,
    formatMiniPlayerTime,
    formatMiniPlayerSubtitle,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.MiniPlayerUtils = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
