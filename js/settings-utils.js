(function (root) {
  const SETTINGS_STORAGE_KEY = "marioPlayer.settings";

  const VALID_THEMES = ["system", "light", "dark"];
  const VALID_REPEAT_MODES = ["off", "all", "one"];
  const VALID_SEEK_STEPS = [5, 10, 15, 30];
  const VALID_PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];
  const VALID_VISUALIZER_STYLES = ["bars", "waveform"];

  const DEFAULT_SETTINGS = Object.freeze({
    theme: "system",
    repeatMode: "off",
    seekStep: 10,
    playbackRate: 1,
    autoHideControls: true,
    visualizerEnabled: true,
    visualizerStyle: "bars",
  });

  function normalizeSettings(raw) {
    const input = raw && typeof raw === "object" ? raw : {};

    const theme = VALID_THEMES.includes(input.theme)
      ? input.theme
      : DEFAULT_SETTINGS.theme;

    const repeatMode = VALID_REPEAT_MODES.includes(input.repeatMode)
      ? input.repeatMode
      : DEFAULT_SETTINGS.repeatMode;

    const seekNum = Number(input.seekStep);
    const seekStep = VALID_SEEK_STEPS.includes(seekNum)
      ? seekNum
      : DEFAULT_SETTINGS.seekStep;

    const rateNum = Number(input.playbackRate);
    const playbackRate = VALID_PLAYBACK_RATES.includes(rateNum)
      ? rateNum
      : DEFAULT_SETTINGS.playbackRate;

    const autoHideControls =
      typeof input.autoHideControls === "boolean"
        ? input.autoHideControls
        : DEFAULT_SETTINGS.autoHideControls;

    const visualizerEnabled =
      typeof input.visualizerEnabled === "boolean"
        ? input.visualizerEnabled
        : DEFAULT_SETTINGS.visualizerEnabled;

    const visualizerStyle = VALID_VISUALIZER_STYLES.includes(
      input.visualizerStyle
    )
      ? input.visualizerStyle
      : DEFAULT_SETTINGS.visualizerStyle;

    return {
      theme,
      repeatMode,
      seekStep,
      playbackRate,
      autoHideControls,
      visualizerEnabled,
      visualizerStyle,
    };
  }

  function parseSettingsJson(jsonText) {
    if (!jsonText || typeof jsonText !== "string") {
      return { ...DEFAULT_SETTINGS };
    }
    try {
      return normalizeSettings(JSON.parse(jsonText));
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  const api = {
    SETTINGS_STORAGE_KEY,
    DEFAULT_SETTINGS,
    VALID_THEMES,
    VALID_REPEAT_MODES,
    VALID_SEEK_STEPS,
    VALID_PLAYBACK_RATES,
    VALID_VISUALIZER_STYLES,
    normalizeSettings,
    parseSettingsJson,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.SettingsUtils = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
