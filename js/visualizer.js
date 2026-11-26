(function () {
  const canvas = document.querySelector("#visualizer");
  const videoEl = document.querySelector("#video");
  const controlsEl = document.querySelector(".controls");
  const trackMetaEl = document.querySelector("#track-metadata");
  if (!canvas || !videoEl || !window.VisualizerUtils) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const { computeAudioLevel, computeBarHeights, mirrorBarHeights } =
    window.VisualizerUtils;

  let audioCtx = null;
  let analyser = null;
  let sourceNode = null;
  let frequencyData = null;
  let timeDomainData = null;
  let animationId = null;
  let prevBands = [];
  let smoothedLevel = 0;

  let config = {
    enabled: true,
    style: "bars",
  };

  const HALF_BARS = 22;
  const TOTAL_BARS = HALF_BARS * 2;

  function parseHexOrFallback(color, fallbackRgb) {
    const hex = color.trim();
    const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
    if (!match) {
      return fallbackRgb;
    }
    let raw = match[1];
    if (raw.length === 3) {
      raw = raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2];
    }
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }

  function rgbaStr(rgb, alpha) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function getThemeColors() {
    const styles = getComputedStyle(document.documentElement);
    const primary = styles.getPropertyValue("--primary").trim() || "#ffc59f";
    const secondary = styles.getPropertyValue("--secondary").trim() || "#ff8496";
    return {
      primary,
      secondary,
      primaryRgb: parseHexOrFallback(primary, { r: 255, g: 197, b: 159 }),
      secondaryRgb: parseHexOrFallback(secondary, { r: 255, g: 132, b: 150 }),
    };
  }

  function syncCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    const width = (parent && parent.clientWidth) || canvas.clientWidth || window.innerWidth;
    const height = (parent && parent.clientHeight) || canvas.clientHeight || window.innerHeight;
    const targetW = Math.max(1, Math.floor(width * dpr));
    const targetH = Math.max(1, Math.floor(height * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
  }

  function ensureAudioGraph() {
    if (audioCtx) {
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      return true;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return false;
    }

    try {
      audioCtx = new AudioCtx();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.78;
      sourceNode = audioCtx.createMediaElementSource(videoEl);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      frequencyData = new Uint8Array(analyser.frequencyBinCount);
      timeDomainData = new Uint8Array(analyser.fftSize);

      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      return true;
    } catch (err) {
      console.warn("Web Audio API visualizer unavailable:", err);
      return false;
    }
  }

  function drawRoundedRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    if (radius <= 0) {
      ctx.fillRect(x, y, w, h);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawWaveform(width, centerY, maxAmp, primary, secondary, isAudioOnly) {
    if (!timeDomainData || !analyser) return;
    analyser.getByteTimeDomainData(timeDomainData);

    const totalWidth = Math.min(620, width * 0.88);
    const startX = (width - totalWidth) / 2;
    const sliceWidth = totalWidth / timeDomainData.length;

    const grad = ctx.createLinearGradient(startX, 0, startX + totalWidth, 0);
    grad.addColorStop(0, primary);
    grad.addColorStop(0.5, secondary);
    grad.addColorStop(1, primary);

    ctx.save();
    ctx.globalAlpha = isAudioOnly ? 0.92 : 0.82;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = grad;
    ctx.beginPath();

    for (let i = 0; i < timeDomainData.length; i++) {
      const v = (timeDomainData[i] - 128) / 128;
      const x = startX + i * sliceWidth;
      const y = centerY + v * maxAmp;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function renderFrame() {
    const { width, height } = syncCanvasSize();
    ctx.clearRect(0, 0, width, height);

    if (!config.enabled) {
      canvas.dataset.visualizerActive = "false";
      canvas.dataset.audioLevel = "0.00";
      animationId = null;
      return;
    }

    const isPlaying = !videoEl.paused && !videoEl.ended && Boolean(videoEl.src);
    let level = { average: 0, peak: 0 };

    if (isPlaying && analyser && frequencyData) {
      analyser.getByteFrequencyData(frequencyData);
      level = computeAudioLevel(frequencyData);
    }

    smoothedLevel =
      level.average >= smoothedLevel
        ? smoothedLevel + (level.average - smoothedLevel) * 0.45
        : smoothedLevel * 0.85;
    if (smoothedLevel < 0.005) {
      smoothedLevel = 0;
    }

    const isAudioOnly = videoEl.videoWidth === 0;
    const controlsHidden = controlsEl && controlsEl.classList.contains("hide");
    const controlsTop =
      controlsEl && !controlsHidden && controlsEl.offsetTop > 0
        ? controlsEl.offsetTop
        : height - 134;
    const metaBottom =
      isAudioOnly &&
      trackMetaEl &&
      !trackMetaEl.hidden &&
      trackMetaEl.classList.contains("is-audio")
        ? trackMetaEl.offsetTop + trackMetaEl.offsetHeight + 16
        : 0;
    const audioBandHeight = Math.max(100, controlsTop - 16 - metaBottom);

    const maxBarHeight = isAudioOnly
      ? Math.min(200, Math.max(64, audioBandHeight * 0.56))
      : Math.min(115, Math.max(52, height * 0.16));

    const activeData = isPlaying ? frequencyData : null;
    prevBands = computeBarHeights(
      activeData,
      HALF_BARS,
      maxBarHeight,
      prevBands,
      0.8
    );

    const hasMotion =
      isPlaying || smoothedLevel > 0 || prevBands.some((h) => h > 0);

    canvas.dataset.visualizerActive = isPlaying ? "true" : "false";
    canvas.dataset.audioLevel = smoothedLevel.toFixed(2);
    canvas.dataset.visualizerStyle = config.style;

    if (!hasMotion) {
      animationId = null;
      return;
    }

    const { primary, secondary, primaryRgb, secondaryRgb } = getThemeColors();
    const centerY = isAudioOnly
      ? metaBottom + audioBandHeight * 0.5
      : Math.max(maxBarHeight + 48, height - (controlsHidden ? 36 : 134));

    if (isAudioOnly) {
      const pulseRadius =
        Math.min(width, height) * (0.14 + smoothedLevel * 0.08);
      const glow = ctx.createRadialGradient(
        width / 2,
        centerY,
        pulseRadius * 0.15,
        width / 2,
        centerY,
        pulseRadius * 1.9
      );
      glow.addColorStop(0, rgbaStr(secondaryRgb, 0.22));
      glow.addColorStop(0.55, rgbaStr(primaryRgb, 0.1));
      glow.addColorStop(1, rgbaStr(primaryRgb, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(width / 2, centerY, pulseRadius * 1.9, 0, Math.PI * 2);
      ctx.fill();
    }

    if (config.style === "waveform" && isPlaying) {
      drawWaveform(
        width,
        isAudioOnly ? centerY : centerY - maxBarHeight * 0.45,
        maxBarHeight * 0.55,
        primary,
        secondary,
        isAudioOnly
      );
    } else {
      const bars = mirrorBarHeights(prevBands);
      const totalWidth = Math.min(540, width * 0.86);
      const startX = (width - totalWidth) / 2;
      const step = totalWidth / TOTAL_BARS;
      const barWidth = Math.max(3, step * 0.62);

      const gradTop = isAudioOnly ? centerY - maxBarHeight / 2 : centerY - maxBarHeight;
      const gradBottom = isAudioOnly ? centerY + maxBarHeight / 2 : centerY;
      const gradient = ctx.createLinearGradient(0, gradTop, 0, gradBottom);
      gradient.addColorStop(0, secondary);
      gradient.addColorStop(0.5, primary);
      gradient.addColorStop(1, isAudioOnly ? secondary : primary);

      ctx.save();
      ctx.globalAlpha = isAudioOnly ? 0.92 : 0.78;
      ctx.fillStyle = gradient;

      for (let i = 0; i < TOTAL_BARS; i++) {
        const barHeight = Math.max(4, bars[i]);
        const x = startX + i * step + (step - barWidth) / 2;

        if (isAudioOnly) {
          drawRoundedRect(
            x,
            centerY - barHeight / 2,
            barWidth,
            barHeight,
            barWidth / 2
          );
        } else {
          drawRoundedRect(
            x,
            centerY - barHeight,
            barWidth,
            barHeight,
            barWidth / 2
          );
        }
      }

      ctx.restore();
    }

    animationId = window.requestAnimationFrame(renderFrame);
  }

  function startVisualizer() {
    if (!config.enabled) {
      const { width, height } = syncCanvasSize();
      ctx.clearRect(0, 0, width, height);
      return;
    }
    ensureAudioGraph();
    if (!animationId) {
      animationId = window.requestAnimationFrame(renderFrame);
    }
  }

  window.VisualizerController = {
    setConfig(next) {
      if (next && typeof next.enabled === "boolean") {
        config.enabled = next.enabled;
      }
      if (next && (next.style === "bars" || next.style === "waveform")) {
        config.style = next.style;
      }
      canvas.style.display = config.enabled ? "block" : "none";
      if (!config.enabled) {
        const { width, height } = syncCanvasSize();
        ctx.clearRect(0, 0, width, height);
        canvas.dataset.visualizerActive = "false";
      } else if (!videoEl.paused && !videoEl.ended && videoEl.src) {
        startVisualizer();
      }
      canvas.dataset.visualizerStyle = config.style;
    },
  };

  videoEl.addEventListener("play", startVisualizer);
  videoEl.addEventListener("loadeddata", syncCanvasSize);
  window.addEventListener("resize", syncCanvasSize);

  const unlockAudio = () => {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
  };
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });

  syncCanvasSize();
  canvas.dataset.visualizerActive = "false";
  canvas.dataset.audioLevel = "0.00";
  canvas.dataset.visualizerStyle = config.style;
})();
