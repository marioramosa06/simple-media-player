(function () {
  if (!media) {
    return;
  }

  let pipStream = null;
  let pipLoopId = null;
  let dockLoopId = null;
  let syncingPipPlayback = false;
  let dockAutoOpenedForSettings = false;

  function hasLoadedMedia() {
    return Boolean(filelist && filelist.length > 0 && media.src);
  }

  function isNativePipActive() {
    return Boolean(
      document.pictureInPictureElement &&
        (document.pictureInPictureElement === media ||
          document.pictureInPictureElement === pipVideo)
    );
  }

  function isDockOpen() {
    return Boolean(miniPlayerDock && !miniPlayerDock.hidden);
  }

  function getThemePalette() {
    const styles = getComputedStyle(document.documentElement);
    return {
      bgCanvas: styles.getPropertyValue("--bg-canvas").trim() || "#121316",
      bgSurface: styles.getPropertyValue("--bg-surface-solid").trim() || "#1b1d22",
      bgSubtle: styles.getPropertyValue("--bg-subtle").trim() || "#262930",
      primary: styles.getPropertyValue("--primary").trim() || "#e87a48",
      secondary: styles.getPropertyValue("--secondary").trim() || "#d9536c",
      text: styles.getPropertyValue("--text").trim() || "#f4f4f5",
      textMuted: styles.getPropertyValue("--text-muted").trim() || "#a1a1aa",
    };
  }

  function getCurrentTrackTitle() {
    if (currentTrackMeta && currentTrackMeta.displayTitle) {
      return currentTrackMeta.displayTitle;
    }
    const currentFile = filelist && filelist[fileIndex];
    return currentFile ? currentFile.name : "No media loaded";
  }

  function getCurrentSubtitle() {
    if (window.MiniPlayerUtils) {
      return window.MiniPlayerUtils.formatMiniPlayerSubtitle(
        currentTrackMeta,
        media.currentTime,
        media.duration
      );
    }
    return "";
  }

  function drawRoundedClip(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawAudioCanvasFrame(targetCanvas, includeDetails) {
    if (!targetCanvas) return;
    const ctx = targetCanvas.getContext("2d");
    if (!ctx) return;

    const w = targetCanvas.width;
    const h = targetCanvas.height;
    const palette = getThemePalette();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = palette.bgCanvas;
    ctx.fillRect(0, 0, w, h);

    // Subtle ambient accent glow
    const glow = ctx.createRadialGradient(w * 0.25, h * 0.35, 8, w * 0.25, h * 0.35, w * 0.75);
    glow.addColorStop(0, palette.primary + "33");
    glow.addColorStop(1, palette.bgCanvas);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    if (media.videoWidth > 0 && media.readyState >= 2) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
      const fit = window.MiniPlayerUtils
        ? window.MiniPlayerUtils.computeMediaAspectFit(media.videoWidth, media.videoHeight, w, h)
        : { x: 0, y: 0, width: w, height: h };
      ctx.drawImage(media, fit.x, fit.y, fit.width, fit.height);
      return;
    }

    const hasCover =
      trackCoverEl &&
      !trackCoverEl.hidden &&
      trackCoverEl.complete &&
      trackCoverEl.naturalWidth > 0;

    if (!includeDetails) {
      if (hasCover) {
        ctx.drawImage(trackCoverEl, 0, 0, w, h);
      } else {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, palette.primary);
        grad.addColorStop(1, palette.secondary);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        const bars = [0.45, 0.85, 0.65, 0.95, 0.5];
        const bw = 6;
        const gap = 5;
        const startX = (w - (bars.length * bw + (bars.length - 1) * gap)) / 2;
        bars.forEach((amp, i) => {
          const bh = Math.round(h * 0.45 * amp);
          ctx.fillRect(startX + i * (bw + gap), (h - bh) / 2, bw, bh);
        });
      }
      return;
    }

    const pad = 28;
    const artSize = 148;
    const artY = (h - 24 - artSize) / 2;

    if (hasCover) {
      ctx.save();
      drawRoundedClip(ctx, pad, artY, artSize, artSize, 16);
      ctx.clip();
      ctx.drawImage(trackCoverEl, pad, artY, artSize, artSize);
      ctx.restore();
    } else {
      const grad = ctx.createLinearGradient(pad, artY, pad + artSize, artY + artSize);
      grad.addColorStop(0, palette.primary);
      grad.addColorStop(1, palette.secondary);
      ctx.save();
      drawRoundedClip(ctx, pad, artY, artSize, artSize, 16);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      const bars = [0.35, 0.72, 0.54, 0.88, 0.44];
      const bw = 10;
      const gap = 8;
      const startX = pad + (artSize - (bars.length * bw + (bars.length - 1) * gap)) / 2;
      bars.forEach((amp, i) => {
        const bh = Math.round(artSize * 0.44 * amp);
        drawRoundedClip(ctx, startX + i * (bw + gap), artY + (artSize - bh) / 2, bw, bh, 4);
        ctx.fill();
      });
      ctx.restore();
    }

    const textX = pad + artSize + 24;
    const maxTextW = w - textX - pad;

    ctx.fillStyle = palette.text;
    ctx.font = '700 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textBaseline = "top";
    let title = getCurrentTrackTitle();
    while (title.length > 3 && ctx.measureText(title).width > maxTextW) {
      title = title.slice(0, -2) + "…";
    }
    ctx.fillText(title, textX, artY + 26);

    const sub = getCurrentSubtitle();
    if (sub) {
      ctx.fillStyle = palette.textMuted;
      ctx.font = '500 15px "Plus Jakarta Sans", system-ui, sans-serif';
      let clippedSub = sub;
      while (clippedSub.length > 3 && ctx.measureText(clippedSub).width > maxTextW) {
        clippedSub = clippedSub.slice(0, -2) + "…";
      }
      ctx.fillText(clippedSub, textX, artY + 62);
    }

    const statusText = media.paused ? "Paused" : "Playing";
    ctx.fillStyle = palette.primary;
    ctx.font = '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(statusText, textX, artY + 96);

    // Bottom progress bar
    const barY = h - 24;
    const barW = w - pad * 2;
    const ratio =
      Number.isFinite(media.duration) && media.duration > 0
        ? Math.min(1, Math.max(0, media.currentTime / media.duration))
        : 0;
    ctx.fillStyle = palette.bgSubtle;
    drawRoundedClip(ctx, pad, barY, barW, 5, 2.5);
    ctx.fill();
    if (ratio > 0) {
      ctx.fillStyle = palette.primary;
      drawRoundedClip(ctx, pad, barY, Math.max(5, barW * ratio), 5, 2.5);
      ctx.fill();
    }
  }

  function ensureAudioPipStream() {
    if (!pipVideo || !pipCanvas || typeof pipCanvas.captureStream !== "function") {
      return false;
    }
    drawAudioCanvasFrame(pipCanvas, true);
    if (!pipStream) {
      pipStream = pipCanvas.captureStream(10);
      pipVideo.srcObject = pipStream;
    }
    if (pipVideo.paused) {
      syncingPipPlayback = true;
      pipVideo
        .play()
        .catch(() => {})
        .finally(() => {
          syncingPipPlayback = false;
        });
    }
    return true;
  }

  function startAudioPipLoop() {
    stopAudioPipLoop();
    drawAudioCanvasFrame(pipCanvas, true);
    pipLoopId = window.setInterval(() => {
      if (document.pictureInPictureElement === pipVideo) {
        drawAudioCanvasFrame(pipCanvas, true);
      } else {
        stopAudioPipLoop();
      }
    }, 200);
  }

  function stopAudioPipLoop() {
    if (pipLoopId !== null) {
      window.clearInterval(pipLoopId);
      pipLoopId = null;
    }
  }

  function startDockLoop() {
    stopDockLoop();
    updateDockContent();
    dockLoopId = window.setInterval(() => {
      if (isDockOpen()) {
        updateDockContent();
      } else {
        stopDockLoop();
      }
    }, 250);
  }

  function stopDockLoop() {
    if (dockLoopId !== null) {
      window.clearInterval(dockLoopId);
      dockLoopId = null;
    }
  }

  function updateDockContent() {
    if (!miniPlayerDock) return;
    if (miniDockTitle) {
      miniDockTitle.textContent = getCurrentTrackTitle();
    }
    if (miniDockSubtitle) {
      miniDockSubtitle.textContent = getCurrentSubtitle();
    }
    if (miniDockPlay && miniDockPlayIcon) {
      const paused = media.paused;
      miniDockPlayIcon.className = paused ? "ri-play-fill" : "ri-pause-fill";
      miniDockPlay.setAttribute("aria-label", paused ? "Play" : "Pause");
    }
    if (miniDockPip && window.MiniPlayerUtils) {
      const targetVideo = media.videoWidth > 0 ? media : pipVideo;
      const canPip = window.MiniPlayerUtils.isPictureInPictureSupported(document, targetVideo);
      miniDockPip.hidden = !canPip;
    }
    if (miniDockPreview) {
      drawAudioCanvasFrame(miniDockPreview, false);
    }
  }

  function openMiniDock(fromSettings = false) {
    if (!miniPlayerDock || !hasLoadedMedia()) return false;
    dockAutoOpenedForSettings = Boolean(fromSettings);
    miniPlayerDock.hidden = false;
    if (settingsPageEl) {
      settingsPageEl.classList.add("has-mini-dock");
    }
    startDockLoop();
    syncMiniPlayerUI();
    return true;
  }

  function closeMiniDock() {
    dockAutoOpenedForSettings = false;
    if (miniPlayerDock) {
      miniPlayerDock.hidden = true;
    }
    if (settingsPageEl) {
      settingsPageEl.classList.remove("has-mini-dock");
    }
    stopDockLoop();
    syncMiniPlayerUI();
  }

  function syncMiniPlayerUI() {
    const pipActive = isNativePipActive();
    const dockOpen = isDockOpen();
    const hasMedia = hasLoadedMedia();
    const state = window.MiniPlayerUtils
      ? window.MiniPlayerUtils.getMiniPlayerState({
          hasMedia,
          pipActive,
          inAppMiniActive: dockOpen,
        })
      : {
          active: pipActive || dockOpen,
          mode: pipActive ? "pip" : dockOpen ? "dock" : "off",
          canEnter: hasMedia,
          buttonLabel: pipActive || dockOpen ? "Exit Mini-Player" : "Mini-Player",
        };

    if (miniPlayerBtn) {
      miniPlayerBtn.disabled = !state.canEnter;
      miniPlayerBtn.classList.toggle("is-active", state.active);
      miniPlayerBtn.setAttribute("aria-pressed", state.active ? "true" : "false");
      miniPlayerBtn.setAttribute("aria-label", state.buttonLabel);
      miniPlayerBtn.setAttribute("title", `${state.buttonLabel} (I)`);
    }
    if (miniPlayerBtnIcon) {
      miniPlayerBtnIcon.className = state.active
        ? "ri-picture-in-picture-exit-line"
        : "ri-picture-in-picture-2-line";
    }
    if (pipActiveNotice) {
      pipActiveNotice.hidden = !pipActive;
    }
    if (trackMetadataEl) {
      if (pipActive) {
        trackMetadataEl.hidden = true;
      } else if (currentTrackMeta && currentTrackMeta.hasTags && hasMedia) {
        trackMetadataEl.hidden = false;
      }
    }
    if (dockOpen) {
      updateDockContent();
    }
  }

  async function enterMiniPlayer({ silentFallback = false } = {}) {
    if (!hasLoadedMedia()) {
      return false;
    }

    const isVideo = media.videoWidth > 0;
    const pipUtils = window.MiniPlayerUtils;

    if (isVideo) {
      const supported = pipUtils
        ? pipUtils.isPictureInPictureSupported(document, media)
        : Boolean(document.pictureInPictureEnabled && media.requestPictureInPicture);

      if (supported && media.readyState >= 1) {
        try {
          if (document.pictureInPictureElement && document.pictureInPictureElement !== media) {
            await document.exitPictureInPicture();
          }
          await media.requestPictureInPicture();
          closeMiniDock();
          syncMiniPlayerUI();
          return true;
        } catch {
          // Fall through to in-app floating corner dock if allowed
        }
      } else if (typeof media.webkitSetPresentationMode === "function") {
        try {
          media.webkitSetPresentationMode("picture-in-picture");
          closeMiniDock();
          syncMiniPlayerUI();
          return true;
        } catch {
          // Fall through
        }
      }
    } else {
      const supported = pipUtils
        ? pipUtils.isPictureInPictureSupported(document, pipVideo)
        : Boolean(document.pictureInPictureEnabled && pipVideo && pipVideo.requestPictureInPicture);

      if (supported && ensureAudioPipStream()) {
        try {
          if (pipVideo.readyState < 1) {
            await new Promise((resolve) => {
              const timer = window.setTimeout(resolve, 250);
              pipVideo.addEventListener(
                "loadedmetadata",
                () => {
                  window.clearTimeout(timer);
                  resolve();
                },
                { once: true }
              );
            });
          }
          if (document.pictureInPictureElement && document.pictureInPictureElement !== pipVideo) {
            await document.exitPictureInPicture();
          }
          await pipVideo.requestPictureInPicture();
          closeMiniDock();
          startAudioPipLoop();
          syncMiniPlayerUI();
          return true;
        } catch {
          // Fall through to in-app floating corner dock if allowed
        }
      }
    }

    if (!silentFallback) {
      return openMiniDock(false);
    }
    return false;
  }

  async function exitMiniPlayer() {
    if (isNativePipActive()) {
      try {
        await document.exitPictureInPicture();
      } catch {
        // Ignore if already exited
      }
    }
    stopAudioPipLoop();
    closeMiniDock();
    syncMiniPlayerUI();
  }

  async function toggleMiniPlayer() {
    if (!hasLoadedMedia()) {
      return false;
    }
    if (isNativePipActive() || isDockOpen()) {
      await exitMiniPlayer();
      return false;
    }
    return enterMiniPlayer({ silentFallback: false });
  }

  function registerMediaSessionPipHandler() {
    if (!("mediaSession" in navigator) || typeof navigator.mediaSession.setActionHandler !== "function") {
      return;
    }
    try {
      navigator.mediaSession.setActionHandler("play", () => {
        if (media.paused && media.src) media.play().catch(() => {});
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        if (!media.paused) media.pause();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        prevFile();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        nextFile();
      });
      navigator.mediaSession.setActionHandler(
        "enterpictureinpicture",
        autoMiniPlayerEnabled
          ? () => {
              if (hasLoadedMedia() && !isNativePipActive()) {
                enterMiniPlayer({ silentFallback: true });
              }
            }
          : null
      );
    } catch {
      // Some action handlers (like enterpictureinpicture) may not be supported in all browsers
    }
  }

  function applyAutoMiniPlayerSetting(enabled) {
    autoMiniPlayerEnabled = Boolean(enabled);
    if ("autoPictureInPicture" in media) {
      try {
        media.autoPictureInPicture = autoMiniPlayerEnabled;
      } catch {
        // Ignore readonly property on unsupported browsers
      }
    }
    registerMediaSessionPipHandler();
  }

  // Event wiring
  media.addEventListener("enterpictureinpicture", () => {
    closeMiniDock();
    syncMiniPlayerUI();
  });

  media.addEventListener("leavepictureinpicture", () => {
    syncMiniPlayerUI();
  });

  media.addEventListener("loadedmetadata", () => {
    if (media.videoWidth === 0) {
      ensureAudioPipStream();
    }
    syncMiniPlayerUI();
  });

  media.addEventListener("play", () => {
    if (pipVideo && pipStream && pipVideo.paused) {
      syncingPipPlayback = true;
      pipVideo
        .play()
        .catch(() => {})
        .finally(() => {
          syncingPipPlayback = false;
        });
    }
    syncMiniPlayerUI();
  });

  media.addEventListener("pause", () => {
    if (document.pictureInPictureElement === pipVideo) {
      drawAudioCanvasFrame(pipCanvas, true);
    }
    syncMiniPlayerUI();
  });

  media.addEventListener("emptied", () => {
    syncMiniPlayerUI();
  });

  if (pipVideo) {
    pipVideo.addEventListener("enterpictureinpicture", () => {
      closeMiniDock();
      startAudioPipLoop();
      syncMiniPlayerUI();
    });

    pipVideo.addEventListener("leavepictureinpicture", () => {
      stopAudioPipLoop();
      syncMiniPlayerUI();
    });

    pipVideo.addEventListener("play", () => {
      if (!syncingPipPlayback && document.pictureInPictureElement === pipVideo && media.paused && media.src) {
        media.play().catch(() => {});
      }
    });

    pipVideo.addEventListener("pause", () => {
      if (
        !syncingPipPlayback &&
        document.pictureInPictureElement === pipVideo &&
        !media.paused
      ) {
        media.pause();
      }
    });
  }

  if (miniPlayerBtn) {
    miniPlayerBtn.addEventListener("click", () => {
      toggleMiniPlayer();
    });
  }

  if (pipExitBtn) {
    pipExitBtn.addEventListener("click", () => {
      exitMiniPlayer();
    });
  }

  if (miniDockPlay) {
    miniDockPlay.addEventListener("click", () => {
      changePlayState();
    });
  }

  if (miniDockPrev) {
    miniDockPrev.addEventListener("click", () => {
      prevFile();
    });
  }

  if (miniDockNext) {
    miniDockNext.addEventListener("click", () => {
      nextFile();
    });
  }

  if (miniDockPip) {
    miniDockPip.addEventListener("click", () => {
      enterMiniPlayer({ silentFallback: false });
    });
  }

  if (miniDockExpand) {
    miniDockExpand.addEventListener("click", () => {
      if (settingsPageEl && !settingsPageEl.hidden) {
        closeSettings();
      }
      closeMiniDock();
    });
  }

  if (miniDockClose) {
    miniDockClose.addEventListener("click", () => {
      closeMiniDock();
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "hidden" &&
      autoMiniPlayerEnabled &&
      hasLoadedMedia() &&
      !media.paused &&
      !isNativePipActive()
    ) {
      enterMiniPlayer({ silentFallback: true });
    }
  });

  window.MiniPlayerController = {
    enterMiniPlayer,
    exitMiniPlayer,
    toggleMiniPlayer,
    openMiniDock,
    closeMiniDock,
    syncMiniPlayerUI,
    applyAutoMiniPlayerSetting,
    onSettingsOpened() {
      if (autoMiniPlayerEnabled && hasLoadedMedia() && !isNativePipActive()) {
        openMiniDock(true);
      }
    },
    onSettingsClosed() {
      if (dockAutoOpenedForSettings) {
        closeMiniDock();
      }
    },
    onTrackChanged() {
      if (document.pictureInPictureElement === pipVideo) {
        drawAudioCanvasFrame(pipCanvas, true);
      }
      syncMiniPlayerUI();
    },
    onPlaylistEmptied() {
      exitMiniPlayer();
    },
  };

  syncMiniPlayerUI();
})();
