const appShell = document.querySelector("#app-shell");
const filePicker = document.querySelector("#file");
const media = document.querySelector("#video");
const playerStage = document.querySelector("#player-stage");
const emptyState = document.querySelector("#empty-state");
const controls = document.querySelector(".controls");
const playBtn = document.querySelector("#play-btn");
const playBtnIcon = document.querySelector("#play-btn-icon");
const prevBtn = document.querySelector("#prev-btn");
const nextBtn = document.querySelector("#next-btn");
const repeatBtn = document.querySelector("#repeat-btn");
const slider = document.querySelector("#progress-bar-slider");
const elapsedTime = document.querySelector("#time-elapsed");
const totalTime = document.querySelector("#time-total");
const fileName = document.querySelector(".file-name");
const loader = document.querySelector(".loader");
const playlistTrigger = document.querySelector(".playlist-trigger");
const topPlaylistBtn = document.querySelector("#top-playlist-btn");
const playlistContainer = document.querySelector(".playlist-container");
const playlistBody = document.querySelector("#playlist-body");
const playlistCount = document.querySelector("#playlist-count");
const playlistBackdrop = document.querySelector("#playlist-backdrop");
let playlistClose = document.querySelector(".close-playlist");
let volume = document.querySelector("#volume-slider");
let volumeIcon = document.querySelector(".volume-icon");
const muteBtn = document.querySelector("#mute-btn");
const shuffleBtn = document.querySelector("#shuffle-btn");
const themeBtn = document.querySelector("#theme-btn");
const fullscreenBtn = document.querySelector("#fullscreen-btn");
const settingsBtn = document.querySelector("#settings-btn");
const workspaceEl = document.querySelector(".workspace");
const settingsPageEl = document.querySelector("#settings-page");
const settingsBackBtn = document.querySelector("#settings-back-btn");
const settingsResetBtn = document.querySelector("#settings-reset-btn");
const settingsVolumeSlider = document.querySelector("#settings-volume-slider");
const settingsVolumeValue = document.querySelector("#settings-volume-value");
const settingAutohideSwitch = document.querySelector("#setting-autohide-switch");
const settingVisualizerSwitch = document.querySelector("#setting-visualizer-switch");
const trackMetadataEl = document.querySelector("#track-metadata");
const trackCoverEl = document.querySelector("#track-cover");
const trackMetaTitleEl = document.querySelector("#track-meta-title");
const trackMetaDetailsEl = document.querySelector("#track-meta-details");
const miniPlayerBtn = document.querySelector("#mini-player-btn");
const miniPlayerBtnIcon = document.querySelector("#mini-player-btn-icon");
const settingAutominiplayerSwitch = document.querySelector("#setting-autominiplayer-switch");
const pipActiveNotice = document.querySelector("#pip-active-notice");
const pipExitBtn = document.querySelector("#pip-exit-btn");
const miniPlayerDock = document.querySelector("#mini-player-dock");
const miniDockPreview = document.querySelector("#mini-dock-preview");
const miniDockTitle = document.querySelector("#mini-dock-title");
const miniDockSubtitle = document.querySelector("#mini-dock-subtitle");
const miniDockPlay = document.querySelector("#mini-dock-play");
const miniDockPlayIcon = document.querySelector("#mini-dock-play-icon");
const miniDockPrev = document.querySelector("#mini-dock-prev");
const miniDockNext = document.querySelector("#mini-dock-next");
const miniDockPip = document.querySelector("#mini-dock-pip");
const miniDockExpand = document.querySelector("#mini-dock-expand");
const miniDockClose = document.querySelector("#mini-dock-close");
const pipVideo = document.querySelector("#pip-video");
const pipCanvas = document.querySelector("#pip-canvas");

let filelist = [];
let fileIndex = 0;
let shuffle = false;
let repeat = false;
let repeatMode = "off";
let seekStepSeconds = 10;
let autoHideControlsEnabled = true;
let autoMiniPlayerEnabled = true;
let listItem = [];
let currentMediaUrl = null;
let currentCoverUrl = null;
let currentTrackMeta = null;
const fileMetadataMap = new WeakMap();
let appSettings = window.SettingsUtils
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
