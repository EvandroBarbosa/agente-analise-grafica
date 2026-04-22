/**
 * indicators.js
 * Cálculo dos indicadores técnicos: MA, EMA, RSI, MACD
 */

/**
 * Média Móvel Simples (SMA)
 * @param {number[]} data - Array de preços de fechamento
 * @param {number} period - Período (ex: 9)
 * @returns {(number|null)[]}
 */
function calcMA(data, period) {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return +(slice.reduce((a, b) => a + b, 0) / period).toFixed(6);
  });
}

/**
 * Média Móvel Exponencial (EMA)
 * @param {number[]} data
 * @param {number} period
 * @returns {number[]}
 */
function calcEMA(data, period) {
  const k = 2 / (period + 1);
  return data.reduce((acc, v, i) => {
    acc.push(i === 0 ? v : +(v * k + acc[i - 1] * (1 - k)).toFixed(6));
    return acc;
  }, []);
}

/**
 * RSI — Índice de Força Relativa
 * @param {number[]} data
 * @param {number} period - Padrão: 14
 * @returns {(number|null)[]}
 */
function calcRSI(data, period = 14) {
  return data.map((_, i) => {
    if (i < period) return null;
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j] - data[j - 1];
      diff > 0 ? (gains += diff) : (losses -= diff);
    }
    const rs = gains / (losses || 1e-9);
    return +(100 - 100 / (1 + rs)).toFixed(2);
  });
}

/**
 * MACD — Moving Average Convergence Divergence
 * @param {number[]} data
 * @returns {{ macdLine: number[], signal: number[], histogram: number[] }}
 */
function calcMACD(data) {
  const ema12 = calcEMA(data, 12);
  const ema26 = calcEMA(data, 26);
  const macdLine = ema12.map((v, i) => +(v - ema26[i]).toFixed(6));
  const signal   = calcEMA(macdLine, 9);
  const histogram = macdLine.map((v, i) => +(v - signal[i]).toFixed(6));
  return { macdLine, signal, histogram };
}

/**
 * Retorna classificação do RSI como string
 * @param {number} rsi
 * @returns {'sobrecomprado'|'sobrevendido'|'neutro'}
 */
function classifyRSI(rsi) {
  if (rsi > 70) return 'sobrecomprado';
  if (rsi < 30) return 'sobrevendido';
  return 'neutro';
}
