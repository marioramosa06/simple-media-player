(function (root) {
  function computeAudioLevel(frequencyData) {
    if (!frequencyData || frequencyData.length === 0) {
      return { average: 0, peak: 0 };
    }
    let sumSquares = 0;
    let maxVal = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const val = frequencyData[i] / 255;
      sumSquares += val * val;
      if (val > maxVal) {
        maxVal = val;
      }
    }
    const rms = Math.sqrt(sumSquares / frequencyData.length);
    return {
      average: Math.min(1, Math.max(0, rms)),
      peak: Math.min(1, Math.max(0, maxVal)),
    };
  }

  function computeBarHeights(
    frequencyData,
    barCount,
    maxHeight,
    prevHeights,
    smoothing = 0.72
  ) {
    if (barCount <= 0 || maxHeight <= 0) {
      return [];
    }
    const result = new Array(barCount);
    const hasData = frequencyData && frequencyData.length > 0;
    const binCount = hasData ? frequencyData.length : 0;
    const usableBins = hasData
      ? binCount > 16
        ? Math.max(16, Math.floor(binCount * 0.72))
        : binCount
      : 0;

    for (let i = 0; i < barCount; i++) {
      let target = 0;
      if (hasData) {
        const t0 = i / barCount;
        const t1 = (i + 1) / barCount;
        const startBin = Math.min(
          usableBins - 1,
          Math.floor(Math.pow(t0, 1.8) * usableBins)
        );
        const endBin = Math.min(
          usableBins,
          Math.max(startBin + 1, Math.floor(Math.pow(t1, 1.8) * usableBins))
        );
        let maxInBand = 0;
        let sum = 0;
        let count = 0;
        for (let b = startBin; b < endBin; b++) {
          const val = frequencyData[b];
          sum += val;
          if (val > maxInBand) {
            maxInBand = val;
          }
          count++;
        }
        const avgNorm = count > 0 ? sum / (count * 255) : 0;
        const peakNorm = maxInBand / 255;
        const blended = avgNorm * 0.45 + peakNorm * 0.55;
        target = Math.min(1, Math.max(0, blended)) * maxHeight;
      }
      const prev =
        prevHeights && typeof prevHeights[i] === "number" ? prevHeights[i] : 0;
      const clampedSmoothing = Math.min(0.95, Math.max(0, smoothing));
      const next =
        target >= prev
          ? prev + (target - prev) * (1 - clampedSmoothing * 0.5)
          : prev * clampedSmoothing;
      result[i] = next < 0.25 ? 0 : next;
    }
    return result;
  }

  function mirrorBarHeights(bandHeights) {
    if (!bandHeights || bandHeights.length === 0) {
      return [];
    }
    const n = bandHeights.length;
    const mirrored = new Array(n * 2);
    for (let i = 0; i < n; i++) {
      const h = bandHeights[i];
      mirrored[n - 1 - i] = h;
      mirrored[n + i] = h;
    }
    return mirrored;
  }

  const api = { computeAudioLevel, computeBarHeights, mirrorBarHeights };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.VisualizerUtils = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
