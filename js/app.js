loadSavedSettings();
loadSavedVolume();
updateSliderFill(slider);

if (window.location.hash === "#settings") {
  openSettings();
}

playlistClose.onclick = () => {
  hidePlaylist();
};

if (playlistBackdrop) {
  playlistBackdrop.onclick = () => {
    hidePlaylist();
  };
}

if (topPlaylistBtn) {
  topPlaylistBtn.onclick = () => {
    if (settingsPageEl && !settingsPageEl.hidden) {
      closeSettings();
    }
    togglePlaylist();
  };
}

if (settingsBtn) {
  settingsBtn.onclick = () => {
    toggleSettings();
  };
}

if (settingsBackBtn) {
  settingsBackBtn.onclick = () => {
    closeSettings();
  };
}

if (settingsResetBtn) {
  settingsResetBtn.onclick = () => {
    resetAllSettings();
  };
}

if (settingsVolumeSlider) {
  settingsVolumeSlider.oninput = () => {
    applyVolume(settingsVolumeSlider.value, true);
  };
}

if (settingAutohideSwitch) {
  settingAutohideSwitch.onclick = () => {
    applyAppSettings(
      { ...appSettings, autoHideControls: !appSettings.autoHideControls },
      true
    );
  };
}

if (settingVisualizerSwitch) {
  settingVisualizerSwitch.onclick = () => {
    applyAppSettings(
      { ...appSettings, visualizerEnabled: !appSettings.visualizerEnabled },
      true
    );
  };
}

document.querySelectorAll(".segmented-control[data-setting]").forEach((group) => {
  const key = group.dataset.setting;
  group.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.onclick = () => {
      const rawVal = btn.dataset.value;
      const parsedVal =
        key === "seekStep" || key === "playbackRate" ? Number(rawVal) : rawVal;
      applyAppSettings({ ...appSettings, [key]: parsedVal }, true);
    };
  });
});

if (themeBtn) {
  themeBtn.onclick = () => {
    toggleTheme();
  };
}

if (fullscreenBtn) {
  fullscreenBtn.onclick = () => {
    toggleFullscreen();
  };
}

volume.oninput = () => {
  applyVolume(volume.value, true);
};

if (muteBtn) {
  muteBtn.onclick = () => {
    muteVolume();
  };
}

media.ondblclick = () => {
  toggleFullscreen();
};

media.onclick = () => {
  if (filelist.length > 0) {
    if (controls.classList.contains("hide")) {
      showControls();
    } else if (media.videoWidth > 0) {
      changePlayState();
    }
  }
};

window.onkeydown = (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) {
    if (e.code !== "Space") return;
  }
  if (e.code == "Space") {
    e.preventDefault();
    changePlayState();
  }
  if (e.code == "ArrowLeft") {
    rewind(seekStepSeconds);
  }
  if (e.code == "ArrowRight") {
    forward(seekStepSeconds);
  }
  if (e.code == "ArrowUp") {
    e.preventDefault();
    volumeUp(5);
  }
  if (e.code == "ArrowDown") {
    e.preventDefault();
    volumeDown(5);
  }
  if (e.key == "P" || e.key == "p") {
    prevFile();
  }
  if (e.key == "N" || e.key == "n") {
    nextFile();
  }
  if (e.key == "M" || e.key == "m") {
    muteVolume();
  }
  if (e.key == "L" || e.key == "l") {
    togglePlaylist();
  }
  if (e.key == "Escape") {
    if (settingsPageEl && !settingsPageEl.hidden) {
      closeSettings();
    } else {
      hidePlaylist();
    }
  }
};

let timeOut = undefined;
const resetControlTimeout = () => {
  if (timeOut !== undefined) {
    window.clearTimeout(timeOut);
  }
  showControls();
  if (!media.paused && media.src && media.videoWidth > 0) {
    timeOut = window.setTimeout(() => {
      hideControls();
    }, 3200);
  }
};

if (playerStage) {
  playerStage.addEventListener("mousemove", resetControlTimeout, { passive: true });
  playerStage.addEventListener("touchstart", resetControlTimeout, { passive: true });

  playerStage.addEventListener("dragover", (e) => {
    e.preventDefault();
    playerStage.classList.add("is-dragover");
  });
  playerStage.addEventListener("dragleave", () => {
    playerStage.classList.remove("is-dragover");
  });
  playerStage.addEventListener("drop", (e) => {
    e.preventDefault();
    playerStage.classList.remove("is-dragover");
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      pickFiles(e.dataTransfer.files);
    }
  });
}

controls.onmouseenter = () => {
  if (timeOut !== undefined) {
    window.clearTimeout(timeOut);
  }
  showControls();
};

controls.onmouseleave = () => {
  if (!media.paused && media.src && media.videoWidth > 0) {
    timeOut = window.setTimeout(() => {
      hideControls();
    }, 3000);
  }
};

filePicker.onchange = () => {
  pickFiles(filePicker);
};

document.querySelectorAll('label[for="file"]').forEach((label) => {
  label.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      filePicker.click();
    }
  });
});

playlistTrigger.onclick = () => {
  togglePlaylist();
};

if (repeatBtn) {
  repeatBtn.onclick = () => {
    toggleRepeat();
  };
}

if (shuffleBtn) {
  shuffleBtn.onclick = () => {
    toggleShuffle();
  };
}

playBtn.onclick = () => {
  changePlayState();
};

prevBtn.onclick = () => {
  prevFile();
};

nextBtn.onclick = () => {
  nextFile();
};

slider.oninput = () => {
  if (!media.src) return;
  media.currentTime = slider.value;
  updateSliderFill(slider);
};

media.onplay = () => {
  playBtn.innerHTML = `<i class="ri-pause-fill" id="play-btn-icon" aria-hidden="true"></i>`;
  playBtn.setAttribute("aria-label", "Pause");
  resetControlTimeout();
};

media.onpause = () => {
  playBtn.innerHTML = `<i class="ri-play-fill" id="play-btn-icon" aria-hidden="true"></i>`;
  playBtn.setAttribute("aria-label", "Play");
  showControls();
};

media.addEventListener("error", function () {
  if (!filelist || filelist.length === 0 || !media.getAttribute("src")) {
    loader.classList.add("hide");
    return;
  }
  console.log("not supported, playing next file");
  const fileErrorIndex = fileIndex;
  listItem = document.querySelectorAll(".playlist-item");
  Array.from(listItem).forEach((e) => {
    if (e.id == fileErrorIndex) {
      e.classList.add("playlist-item-error");
    }
  });
  const hasPlayableCandidate = Array.from(listItem).some(
    (e) => !e.classList.contains("playlist-item-error")
  );
  if (hasPlayableCandidate) {
    nextFile();
  } else {
    loader.classList.add("hide");
  }
});

media.addEventListener("ended", function () {
  nextFile(true);
});

// service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { updateViaCache: "none" })
      .then((registration) => {
        registration.update().catch(() => {});
        console.log("Service Worker registered:", registration);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}
