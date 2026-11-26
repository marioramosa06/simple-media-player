updateSliderFill = (inputEl) => {
  if (!inputEl) return;
  const min = Number(inputEl.min) || 0;
  const max = Number(inputEl.max) || 0;
  const val = Number(inputEl.value) || 0;
  const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
  inputEl.style.setProperty("--slider-fill", `${Math.min(100, Math.max(0, pct))}%`);
};

pickFiles = (fileinput) => {
  const files = fileinput && fileinput.files ? fileinput.files : fileinput;
  if (files && files.length > 0) {
    filelist = Array.from(files);
    fileIndex = 0;
    createPlaylist(filelist);
    loadFile();
  }
};

addFilesToPlaylist = (incomingFiles) => {
  const merged = window.PlayerUtils
    ? window.PlayerUtils.mergeMediaFiles(filelist, incomingFiles)
    : {
        nextFiles: [...filelist, ...Array.from(incomingFiles || [])],
        addedCount: incomingFiles ? incomingFiles.length : 0,
        shouldAutoLoad: filelist.length === 0 && incomingFiles && incomingFiles.length > 0,
      };

  if (merged.addedCount === 0) {
    return 0;
  }

  filelist = merged.nextFiles;
  createPlaylist(filelist);

  if (merged.shouldAutoLoad) {
    fileIndex = 0;
    if (settingsPageEl && !settingsPageEl.hidden) {
      closeSettings();
    }
    loadFile();
  } else {
    const items = document.querySelectorAll(".playlist-item");
    Array.from(items).forEach((e) => {
      e.classList.toggle("playlist-item-playing", Number(e.id) === fileIndex);
    });
  }

  return merged.addedCount;
};

clearTrackMetadata = () => {
  if (currentCoverUrl) {
    window.URL.revokeObjectURL(currentCoverUrl);
    currentCoverUrl = null;
  }
  currentTrackMeta = null;
  if (trackCoverEl) {
    trackCoverEl.removeAttribute("src");
    trackCoverEl.hidden = true;
  }
  if (trackMetaTitleEl) {
    trackMetaTitleEl.textContent = "";
  }
  if (trackMetaDetailsEl) {
    trackMetaDetailsEl.textContent = "";
  }
  if (trackMetadataEl) {
    trackMetadataEl.hidden = true;
    trackMetadataEl.classList.remove("is-audio", "is-video", "no-cover", "is-controls-hidden");
  }
};

formatPlaylistMetaText = (meta) => {
  if (!meta) return "";
  const parts = [];
  if (meta.artist) parts.push(meta.artist);
  if (meta.year) parts.push(meta.year);
  return parts.join(" · ");
};

renderTrackMetadata = (meta, isVideo) => {
  if (!trackMetadataEl || !meta || !meta.hasTags) {
    if (trackMetadataEl) {
      trackMetadataEl.hidden = true;
    }
    return;
  }

  if (trackMetaTitleEl) {
    trackMetaTitleEl.textContent = meta.displayTitle;
  }

  const detailsText = window.MetadataUtils
    ? window.MetadataUtils.formatMetadataDetails(meta)
    : [meta.artist, meta.album, meta.year].filter(Boolean).join(" · ");

  if (trackMetaDetailsEl) {
    trackMetaDetailsEl.textContent = detailsText;
  }

  if (trackCoverEl) {
    if (meta.picture && meta.picture.data && meta.picture.data.length > 0) {
      if (!currentCoverUrl) {
        const coverBlob = new Blob([meta.picture.data], {
          type: meta.picture.mime || "image/jpeg",
        });
        currentCoverUrl = window.URL.createObjectURL(coverBlob);
        trackCoverEl.onerror = () => {
          trackCoverEl.hidden = true;
          trackCoverEl.removeAttribute("src");
          trackMetadataEl.classList.add("no-cover");
        };
        trackCoverEl.src = currentCoverUrl;
      }
      trackCoverEl.alt = meta.album
        ? `${meta.album} album art`
        : `${meta.displayTitle} album art`;
      trackCoverEl.hidden = false;
      trackMetadataEl.classList.remove("no-cover");
    } else {
      if (currentCoverUrl) {
        window.URL.revokeObjectURL(currentCoverUrl);
        currentCoverUrl = null;
      }
      trackCoverEl.removeAttribute("src");
      trackCoverEl.hidden = true;
      trackMetadataEl.classList.add("no-cover");
    }
  }

  trackMetadataEl.classList.toggle("is-video", Boolean(isVideo));
  trackMetadataEl.classList.toggle("is-audio", !isVideo);
  if (!isVideo) {
    trackMetadataEl.classList.remove("is-controls-hidden");
  }
  trackMetadataEl.hidden = false;
};

updateTopBarMetadata = (meta, index, fallbackName) => {
  const titleText = meta && meta.displayTitle ? meta.displayTitle : fallbackName;
  const topLabel =
    meta && meta.artist ? `${titleText} · ${meta.artist}` : titleText;
  document.title = `${topLabel} · Mario Player`;
  fileName.textContent = `${index + 1} - ${topLabel}`;
  fileName.classList.add("is-playing");
};

updatePlaylistItemMetadata = (index, meta) => {
  const item = document.querySelector(`.playlist-item[id="${index}"]`);
  if (!item || !meta) return;
  const nameEl = item.querySelector(".playlist-item-name");
  const metaEl = item.querySelector(".playlist-item-meta");
  if (nameEl && meta.title) {
    nameEl.textContent = meta.title;
  }
  if (metaEl) {
    metaEl.textContent = formatPlaylistMetaText(meta);
  }
};

updateMediaSession = (meta, coverUrl) => {
  if (!("mediaSession" in navigator) || typeof window.MediaMetadata !== "function" || !meta) {
    return;
  }
  try {
    const artwork = coverUrl
      ? [{ src: coverUrl, type: (meta.picture && meta.picture.mime) || "image/jpeg" }]
      : [];
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: meta.displayTitle || "",
      artist: meta.artist || "",
      album: meta.album || "",
      artwork,
    });
  } catch {
    // Ignore unsupported MediaMetadata environments
  }
};

createPlaylist = (files) => {
  const targetBody = playlistBody || playlistContainer;
  const playlistItems = document.createElement("ul");
  playlistItems.setAttribute("class", "playlist");

  Array.from(files).forEach((item, index) => {
    const li = document.createElement("li");
    li.setAttribute("id", String(index));
    li.setAttribute("class", "playlist-item");
    li.setAttribute("tabindex", "0");
    li.setAttribute("role", "button");

    const idxSpan = document.createElement("span");
    idxSpan.className = "playlist-item-index";
    idxSpan.textContent = String(index + 1).padStart(2, "0");

    const textWrap = document.createElement("span");
    textWrap.className = "playlist-item-text";

    const cachedMeta = fileMetadataMap.get(item);

    const nameSpan = document.createElement("span");
    nameSpan.className = "playlist-item-name";
    nameSpan.textContent = cachedMeta && cachedMeta.title ? cachedMeta.title : item.name;

    const metaSpan = document.createElement("span");
    metaSpan.className = "playlist-item-meta";
    metaSpan.textContent = formatPlaylistMetaText(cachedMeta);

    textWrap.append(nameSpan, metaSpan);
    li.append(idxSpan, textWrap);
    playlistItems.append(li);
  });

  targetBody.innerHTML = "";
  targetBody.append(playlistItems);

  if (playlistCount) {
    const count = files.length;
    playlistCount.textContent = `${count} ${count === 1 ? "track" : "tracks"}`;
  }

  listItem = document.querySelectorAll(".playlist-item");
  Array.from(listItem).forEach((el) => {
    const activate = () => {
      fileIndex = parseInt(el.id, 10);
      loadFile();
      if (window.innerWidth < 1024) {
        hidePlaylist();
      }
    };
    el.onclick = activate;
    el.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    };
  });
};

loadFile = () => {
  clearPlayerInterval();
  if (!filelist || filelist.length === 0) {
    loader.classList.add("hide");
    clearTrackMetadata();
    if (window.MiniPlayerController) {
      window.MiniPlayerController.onPlaylistEmptied();
    }
    if (emptyState) emptyState.classList.remove("is-hidden");
    return;
  }
  const currentFile = filelist[fileIndex];
  if (!(currentFile instanceof Blob)) {
    loader.classList.add("hide");
    clearTrackMetadata();
    return;
  }

  if (emptyState) {
    emptyState.classList.add("is-hidden");
  }
  clearTrackMetadata();
  loader.classList.remove("hide");

  const fileReader = new FileReader();

  fileReader.readAsArrayBuffer(currentFile);
  fileReader.onload = (e) => {
    const buffer = e.target.result;
    const meta = window.MetadataUtils
      ? window.MetadataUtils.extractMediaMetadata(buffer, currentFile.name)
      : {
          title: "",
          artist: "",
          album: "",
          year: "",
          picture: null,
          hasTags: false,
          displayTitle: currentFile.name,
        };
    fileMetadataMap.set(currentFile, meta);
    currentTrackMeta = meta;
    renderTrackMetadata(meta, false);
    updateTopBarMetadata(meta, fileIndex, currentFile.name);
    updatePlaylistItemMetadata(fileIndex, meta);

    const mediaBlob = new Blob([new Uint8Array(buffer)], {
      type: currentFile.type || undefined,
    });
    if (currentMediaUrl) {
      window.URL.revokeObjectURL(currentMediaUrl);
    }
    currentMediaUrl = window.URL.createObjectURL(mediaBlob);
    media.src = currentMediaUrl;
    if (window.MiniPlayerController) {
      window.MiniPlayerController.onTrackChanged();
    }
  };

  media.onloadedmetadata = () => {
    totalTime.innerText = timeFormat(media.duration);
    slider.max = Math.floor(media.duration);
    slider.value = "0";
    elapsedTime.innerText = "00:00";
    updateSliderFill(slider);
    media.playbackRate = appSettings.playbackRate || 1;
    media.defaultPlaybackRate = appSettings.playbackRate || 1;
    if (currentTrackMeta) {
      renderTrackMetadata(currentTrackMeta, media.videoWidth > 0);
    }
  };

  media.oncanplay = () => {
    loader.classList.add("hide");
    updateTopBarMetadata(currentTrackMeta, fileIndex, currentFile.name);
    updateMediaSession(currentTrackMeta, currentCoverUrl);
    if (window.MiniPlayerController) {
      window.MiniPlayerController.onTrackChanged();
    }

    const items = document.querySelectorAll(".playlist-item");
    Array.from(items).forEach((e) => {
      if (e.id == fileIndex) {
        e.classList.add("playlist-item-playing");
      } else {
        e.classList.remove("playlist-item-playing");
      }
    });

    clearPlayerInterval();
    playerInterval = window.setInterval(function () {
      if (Number.isFinite(media.duration)) {
        slider.value = Math.floor(media.currentTime);
        updateSliderFill(slider);
        totalTime.innerText = timeFormat(Math.max(0, media.duration - media.currentTime));
        elapsedTime.innerText = timeFormat(media.currentTime);
      }
    }, 250);
  };
};

syncPlaylistButtons = (isOpen) => {
  const expanded = isOpen ? "true" : "false";
  if (playlistTrigger) {
    playlistTrigger.setAttribute("aria-expanded", expanded);
    playlistTrigger.classList.toggle("is-active", isOpen);
  }
  if (topPlaylistBtn) {
    topPlaylistBtn.setAttribute("aria-expanded", expanded);
    topPlaylistBtn.classList.toggle("is-active", isOpen);
  }
  if (playlistBackdrop) {
    playlistBackdrop.classList.toggle("is-open", isOpen);
  }
};

showPlaylist = () => {
  if (playlistContainer.style.display === "none" || playlistContainer.classList.contains("hide")) {
    playlistContainer.style.display = "flex";
    requestAnimationFrame(() => {
      playlistContainer.classList.add("show");
      playlistContainer.classList.remove("hide");
    });
    syncPlaylistButtons(true);
    window.dispatchEvent(new Event("resize"));
  }
};

hidePlaylist = () => {
  if (playlistContainer.style.display !== "none") {
    playlistContainer.classList.remove("show");
    playlistContainer.classList.add("hide");
    syncPlaylistButtons(false);
    window.setTimeout(() => {
      if (playlistContainer.classList.contains("hide")) {
        playlistContainer.style.display = "none";
        window.dispatchEvent(new Event("resize"));
      }
    }, 220);
  }
};

togglePlaylist = () => {
  if (playlistContainer.style.display === "none" || playlistContainer.classList.contains("hide")) {
    showPlaylist();
  } else {
    hidePlaylist();
  }
};

showControls = () => {
  controls.classList.remove("hide");
  controls.classList.add("show");
  if (trackMetadataEl) {
    trackMetadataEl.classList.remove("is-controls-hidden");
  }
};

hideControls = () => {
  if (!autoHideControlsEnabled || !media || media.paused || !media.src || media.videoWidth === 0) {
    return;
  }
  controls.classList.remove("show");
  controls.classList.add("hide");
  if (trackMetadataEl && trackMetadataEl.classList.contains("is-video")) {
    trackMetadataEl.classList.add("is-controls-hidden");
  }
};

changePlayState = () => {
  if (!filelist || filelist.length === 0 || !media.src) {
    return;
  }
  if (media.paused) {
    media.play().catch(() => {});
  } else {
    media.pause();
  }
};

prevFile = () => {
  if (!filelist || filelist.length === 0) {
    return;
  }
  clearPlayerInterval();
  fileIndex = window.PlayerUtils
    ? window.PlayerUtils.getPrevFileIndex(fileIndex, filelist.length)
    : fileIndex > 0
      ? fileIndex - 1
      : filelist.length - 1;
  loadFile();
};

nextFile = (fromEnded = false) => {
  if (!filelist || filelist.length === 0) {
    return;
  }
  clearPlayerInterval();
  const nextIdx = window.PlayerUtils
    ? window.PlayerUtils.getNextFileIndex(fileIndex, filelist.length, repeatMode, fromEnded)
    : fileIndex < filelist.length - 1
      ? fileIndex + 1
      : 0;
  if (nextIdx === -1) {
    showControls();
    return;
  }
  fileIndex = nextIdx;
  loadFile();
};

rewind = (n) => {
  if (!media.src) return;
  media.currentTime = Math.max(0, media.currentTime - n);
};

forward = (n) => {
  if (!media.src || !Number.isFinite(media.duration)) return;
  media.currentTime = Math.min(media.duration, media.currentTime + n);
};

shufflePlaylist = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

toggleShuffle = () => {
  shuffle = !shuffle;
  shuffleBtn.classList.toggle("is-active", shuffle);
  shuffleBtn.setAttribute("aria-pressed", shuffle ? "true" : "false");
  if (shuffle && filelist.length >= 2) {
    const current = filelist[fileIndex];
    filelist = shufflePlaylist(filelist);
    fileIndex = Math.max(0, filelist.indexOf(current));
    createPlaylist(filelist);
    const items = document.querySelectorAll(".playlist-item");
    Array.from(items).forEach((e) => {
      e.classList.toggle("playlist-item-playing", Number(e.id) === fileIndex);
    });
  }
};

syncRepeatButtonUI = () => {
  repeat = repeatMode !== "off";
  if (repeatBtn) {
    repeatBtn.classList.toggle("is-active", repeat);
    repeatBtn.setAttribute("aria-pressed", repeat ? "true" : "false");
    const label =
      repeatMode === "one"
        ? "Repeat: One"
        : repeatMode === "all"
          ? "Repeat: All"
          : "Repeat: Off";
    repeatBtn.setAttribute("title", label);
    repeatBtn.setAttribute("aria-label", label);
    repeatBtn.innerHTML =
      repeatMode === "one"
        ? '<i class="ri-repeat-one-line" id="reapeat-btn-icon" aria-hidden="true"></i>'
        : '<i class="ri-repeat-line" id="reapeat-btn-icon" aria-hidden="true"></i>';
  }
};

toggleRepeat = () => {
  repeatMode = window.PlayerUtils
    ? window.PlayerUtils.cycleRepeatMode(repeatMode)
    : repeatMode === "off"
      ? "all"
      : repeatMode === "all"
        ? "one"
        : "off";
  appSettings.repeatMode = repeatMode;
  saveAppSettings();
  syncRepeatButtonUI();
  syncSettingsUI();
};

applyVolume = (percent, persist = true) => {
  const normalized = window.VolumeUtils
    ? window.VolumeUtils.normalizeVolumePercent(percent)
    : Math.min(100, Math.max(0, Math.round(Number(percent) || 0)));
  media.volume = window.VolumeUtils
    ? window.VolumeUtils.percentToMediaVolume(normalized)
    : normalized / 100;
  volume.value = String(normalized);
  updateSliderFill(volume);
  const sliderWrap = document.querySelector(".volume-slider");
  if (sliderWrap) {
    sliderWrap.setAttribute("title", `${normalized}%`);
  }
  if (settingsVolumeSlider) {
    settingsVolumeSlider.value = String(normalized);
    updateSliderFill(settingsVolumeSlider);
  }
  if (settingsVolumeValue) {
    settingsVolumeValue.textContent = `${normalized}%`;
  }
  if (persist) {
    try {
      const key = window.VolumeUtils
        ? window.VolumeUtils.VOLUME_STORAGE_KEY
        : "marioPlayer.volume";
      window.localStorage.setItem(key, String(normalized));
    } catch (err) {
      console.warn("Unable to save volume preference:", err);
    }
  }
  return normalized;
};

loadSavedVolume = () => {
  try {
    const key = window.VolumeUtils
      ? window.VolumeUtils.VOLUME_STORAGE_KEY
      : "marioPlayer.volume";
    const saved = window.localStorage.getItem(key);
    const parsed = window.VolumeUtils
      ? window.VolumeUtils.parseSavedVolume(saved)
      : 100;
    return applyVolume(parsed, false);
  } catch (err) {
    return applyVolume(100, false);
  }
};

volumeUp = (n) => {
  const current = Math.round(media.volume * 100);
  applyVolume(current + n, true);
};

volumeDown = (n) => {
  const current = Math.round(media.volume * 100);
  applyVolume(current - n, true);
};

muteVolume = () => {
  if (!media.muted) {
    media.muted = true;
    volumeIcon.classList.remove("ri-volume-up-fill");
    volumeIcon.classList.add("ri-volume-mute-fill");
    if (muteBtn) muteBtn.setAttribute("aria-label", "Unmute");
    volume.disabled = true;
  } else {
    media.muted = false;
    volumeIcon.classList.remove("ri-volume-mute-fill");
    volumeIcon.classList.add("ri-volume-up-fill");
    if (muteBtn) muteBtn.setAttribute("aria-label", "Mute");
    volume.disabled = false;
  }
};

applyThemePreference = (themeValue) => {
  const root = document.documentElement;
  if (themeValue === "light" || themeValue === "dark") {
    root.setAttribute("data-theme", themeValue);
  } else {
    root.removeAttribute("data-theme");
  }
};

toggleTheme = () => {
  const root = document.documentElement;
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const current = root.getAttribute("data-theme") || (prefersDark ? "dark" : "light");
  const next = current === "dark" ? "light" : "dark";
  appSettings.theme = next;
  applyThemePreference(next);
  saveAppSettings();
  syncSettingsUI();
};

saveAppSettings = () => {
  try {
    const key = window.SettingsUtils
      ? window.SettingsUtils.SETTINGS_STORAGE_KEY
      : "marioPlayer.settings";
    window.localStorage.setItem(key, JSON.stringify(appSettings));
  } catch (err) {
    console.warn("Unable to save settings:", err);
  }
};

applyAppSettings = (settingsObj, persist = false) => {
  appSettings = window.SettingsUtils
    ? window.SettingsUtils.normalizeSettings(settingsObj)
    : { ...appSettings, ...settingsObj };

  applyThemePreference(appSettings.theme);
  repeatMode = appSettings.repeatMode;
  syncRepeatButtonUI();

  seekStepSeconds = appSettings.seekStep;
  autoHideControlsEnabled = appSettings.autoHideControls;
  autoMiniPlayerEnabled = appSettings.autoMiniPlayer;
  if (!autoHideControlsEnabled) {
    showControls();
  }

  media.defaultPlaybackRate = appSettings.playbackRate;
  media.playbackRate = appSettings.playbackRate;

  if (window.MiniPlayerController) {
    window.MiniPlayerController.applyAutoMiniPlayerSetting(autoMiniPlayerEnabled);
  }

  if (window.VisualizerController) {
    window.VisualizerController.setConfig({
      enabled: appSettings.visualizerEnabled,
      style: appSettings.visualizerStyle,
    });
  }

  if (persist) {
    saveAppSettings();
  }
  syncSettingsUI();
};

loadSavedSettings = () => {
  try {
    const key = window.SettingsUtils
      ? window.SettingsUtils.SETTINGS_STORAGE_KEY
      : "marioPlayer.settings";
    const raw = window.localStorage.getItem(key);
    const parsed = window.SettingsUtils
      ? window.SettingsUtils.parseSettingsJson(raw)
      : appSettings;
    applyAppSettings(parsed, false);
  } catch {
    applyAppSettings(appSettings, false);
  }
};

syncSettingsUI = () => {
  document.querySelectorAll(".segmented-control[data-setting]").forEach((group) => {
    const settingKey = group.dataset.setting;
    const currentVal = String(appSettings[settingKey]);
    group.querySelectorAll(".seg-btn").forEach((btn) => {
      const active = btn.dataset.value === currentVal;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  });

  if (settingAutohideSwitch) {
    settingAutohideSwitch.setAttribute(
      "aria-checked",
      appSettings.autoHideControls ? "true" : "false"
    );
  }
  if (settingAutominiplayerSwitch) {
    settingAutominiplayerSwitch.setAttribute(
      "aria-checked",
      appSettings.autoMiniPlayer ? "true" : "false"
    );
  }
  if (settingVisualizerSwitch) {
    settingVisualizerSwitch.setAttribute(
      "aria-checked",
      appSettings.visualizerEnabled ? "true" : "false"
    );
  }
};

openSettings = () => {
  if (!settingsPageEl || !workspaceEl) return;
  workspaceEl.hidden = true;
  settingsPageEl.hidden = false;
  settingsPageEl.scrollTop = 0;
  if (settingsBtn) {
    settingsBtn.classList.add("is-active");
    settingsBtn.setAttribute("aria-expanded", "true");
  }
  if (window.MiniPlayerController) {
    window.MiniPlayerController.onSettingsOpened();
  }
  if (window.location.hash !== "#settings") {
    history.replaceState(null, "", "#settings");
  }
};

closeSettings = () => {
  if (!settingsPageEl || !workspaceEl) return;
  settingsPageEl.hidden = true;
  workspaceEl.hidden = false;
  if (settingsBtn) {
    settingsBtn.classList.remove("is-active");
    settingsBtn.setAttribute("aria-expanded", "false");
  }
  if (window.MiniPlayerController) {
    window.MiniPlayerController.onSettingsClosed();
  }
  if (window.location.hash === "#settings") {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  window.dispatchEvent(new Event("resize"));
};

toggleSettings = () => {
  if (settingsPageEl && settingsPageEl.hidden) {
    openSettings();
  } else {
    closeSettings();
  }
};

resetAllSettings = () => {
  const defaults = window.SettingsUtils
    ? { ...window.SettingsUtils.DEFAULT_SETTINGS }
    : {
        theme: "system",
        repeatMode: "off",
        seekStep: 10,
        playbackRate: 1,
        autoHideControls: true,
        autoMiniPlayer: true,
        visualizerEnabled: true,
        visualizerStyle: "bars",
      };
  applyVolume(100, true);
  applyAppSettings(defaults, true);
};

toggleFullscreen = () => {
  const target = playerStage || document.body;
  if (!document.fullscreenElement) {
    if (target.requestFullscreen) {
      target.requestFullscreen().catch(() => {});
    } else if (target.webkitRequestFullScreen) {
      target.webkitRequestFullScreen();
    }
  } else if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
};

timeFormat = (timeInSecond) => {
  if (!Number.isFinite(timeInSecond) || timeInSecond < 0) {
    return "00:00";
  }
  const hour = Math.floor(timeInSecond / 3600);
  const min = Math.floor((timeInSecond - hour * 3600) / 60);
  const sec = Math.floor(timeInSecond - hour * 3600 - min * 60);
  if (hour < 1) {
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }
  return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

clearPlayerInterval = () => {
  if (typeof playerInterval !== "undefined") {
    window.clearInterval(playerInterval);
  }
};
