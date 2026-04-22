/**
 * charts.js
 * Renderização dos gráficos com Chart.js 4:
 * - Gráfico de preço com MA9 e EMA21
 * - RSI (14)
 * - MACD (12/26/9) com histograma
 */

let priceChart, rsiChart, macdChart;

/**
 * Formata labels do eixo X a partir dos candles
 * @param {Candle[]} candles
 * @returns {string[]}
 */
function buildLabels(candles) {
  const step = Math.max(1, Math.floor(candles.length / 30));
  return candles.map((c, i) =>
    i % step === 0
      ? c.t.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      : ''
  );
}

/**
 * Opções comuns dos eixos para todos os gráficos
 */
function axisDefaults(isDark) {
  const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const tickColor = '#888780';
  return { gridColor, tickColor };
}

/**
 * Renderiza gráfico de preço com MA9 e EMA21
 * @param {Candle[]} candles
 * @param {number[]} ma9
 * @param {number[]} ema21
 */
function renderPriceChart(candles, ma9, ema21) {
  if (priceChart) priceChart.destroy();
  const isDark  = matchMedia('(prefers-color-scheme: dark)').matches;
  const { gridColor, tickColor } = axisDefaults(isDark);
  const labels  = buildLabels(candles);
  const closes  = candles.map(c => c.c);

  priceChart = new Chart(document.getElementById('priceC'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Preço',
          data: closes,
          borderColor: '#378ADD',
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          backgroundColor: 'rgba(55,138,221,0.08)',
          tension: 0.3,
        },
        {
          label: 'MA9',
          data: ma9,
          borderColor: '#E24B4A',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0.3,
          borderDash: [4, 3],
        },
        {
          label: 'EMA21',
          data: ema21,
          borderColor: '#1D9E75',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: ctx => {
              const v = ctx.raw;
              return ctx.dataset.label + ': ' + (v != null ? v.toFixed(v > 100 ? 2 : 4) : '—');
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: tickColor, maxTicksLimit: 8, font: { size: 10 } },
          grid:  { color: gridColor },
        },
        y: {
          ticks: {
            color: tickColor,
            font: { size: 10 },
            callback: v => v > 1000
              ? v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
              : v.toFixed(2),
          },
          grid: { color: gridColor },
        },
      },
    },
  });
}

/**
 * Renderiza gráfico RSI
 * @param {(number|null)[]} rsiData
 * @param {string[]} labels
 */
function renderRSIChart(rsiData, labels) {
  if (rsiChart) rsiChart.destroy();
  const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
  const { gridColor, tickColor } = axisDefaults(isDark);
  const lastRSI  = rsiData.filter(v => v != null).pop() ?? 50;
  const rsiColor = lastRSI > 70 ? '#E24B4A' : lastRSI < 30 ? '#1D9E75' : '#BA7517';

  const rsiValEl = document.getElementById('rsiVal');
  rsiValEl.textContent = lastRSI.toFixed(1);
  rsiValEl.style.color = rsiColor;

  rsiChart = new Chart(document.getElementById('rsiC'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'RSI',
        data: rsiData,
        borderColor: rsiColor,
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: tickColor, maxTicksLimit: 5, font: { size: 9 } }, grid: { color: gridColor } },
        y: { min: 0, max: 100, ticks: { color: tickColor, font: { size: 9 }, stepSize: 25 }, grid: { color: gridColor } },
      },
    },
  });
}

/**
 * Renderiza gráfico MACD com histograma
 * @param {number[]} macdLine
 * @param {number[]} signal
 * @param {number[]} histogram
 * @param {string[]} labels
 */
function renderMACDChart(macdLine, signal, histogram, labels) {
  if (macdChart) macdChart.destroy();
  const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
  const { gridColor, tickColor } = axisDefaults(isDark);

  macdChart = new Chart(document.getElementById('macdC'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Histograma',
          data: histogram,
          backgroundColor: histogram.map(v => v >= 0
            ? 'rgba(29,158,117,0.6)'
            : 'rgba(216,90,48,0.6)'),
          type: 'bar',
        },
        {
          label: 'MACD',
          data: macdLine,
          borderColor: '#378ADD',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          type: 'line',
          tension: 0.3,
        },
        {
          label: 'Sinal',
          data: signal,
          borderColor: '#E24B4A',
          borderWidth: 1.2,
          pointRadius: 0,
          fill: false,
          type: 'line',
          tension: 0.3,
          borderDash: [4, 2],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: tickColor, maxTicksLimit: 5, font: { size: 9 } }, grid: { color: gridColor } },
        y: { ticks: { color: tickColor, font: { size: 9 } }, grid: { color: gridColor } },
      },
    },
  });
}

/**
 * Renderiza todos os gráficos de uma vez
 * @param {Candle[]} candles
 * @returns {{ ma9: number[], ema21: number[], rsi: number[], macdLine: number[], signal: number[], histogram: number[] }}
 */
function renderAllCharts(candles) {
  const closes    = candles.map(c => c.c);
  const ma9       = calcMA(closes, 9);
  const ema21     = calcEMA(closes, 21);
  const rsi       = calcRSI(closes);
  const { macdLine, signal, histogram } = calcMACD(closes);
  const labels    = buildLabels(candles);

  renderPriceChart(candles, ma9, ema21);
  renderRSIChart(rsi, labels);
  renderMACDChart(macdLine, signal, histogram, labels);

  return { ma9, ema21, rsi, macdLine, signal, histogram };
}
