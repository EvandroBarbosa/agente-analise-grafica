/**
 * dataFetch.js
 * Busca de dados de mercado: Binance (cripto) e Yahoo Finance (B3)
 * Inclui fallback para dados simulados quando APIs estão indisponíveis.
 */

const BINANCE_INTERVALS = {
  '1d':  '15m',
  '5d':  '15m',
  '1mo': '1d',
  '3mo': '1d',
};

const BINANCE_LIMITS = {
  '1d':  96,
  '5d':  120,
  '1mo': 90,
  '3mo': 90,
};

const YAHOO_INTERVALS = {
  '1d':  '5m',
  '5d':  '60m',
  '1mo': '1d',
  '3mo': '1d',
};

/**
 * Busca candles da Binance API (criptomoedas)
 * @param {string} symbol - Ex: 'BTCUSDT'
 * @param {string} period - '1d' | '5d' | '1mo' | '3mo'
 * @returns {Promise<{t: Date, o: number, h: number, l: number, c: number}[]>}
 */
async function fetchBinance(symbol, period) {
  const interval = BINANCE_INTERVALS[period];
  const limit    = BINANCE_LIMITS[period];
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Binance HTTP ${response.status}`);
  const raw = await response.json();
  return raw.map(c => ({
    t: new Date(c[0]),
    o: +c[1],
    h: +c[2],
    l: +c[3],
    c: +c[4],
  }));
}

/**
 * Busca candles do Yahoo Finance (ações B3)
 * @param {string} symbol - Ex: 'PETR4.SA'
 * @param {string} period - '1d' | '5d' | '1mo' | '3mo'
 * @returns {Promise<{t: Date, o: number, h: number, l: number, c: number}[]>}
 */
async function fetchYahoo(symbol, period) {
  const interval = YAHOO_INTERVALS[period];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${period}&interval=${interval}&includePrePost=false`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Yahoo Finance HTTP ${response.status}`);
  const json = await response.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error('Yahoo Finance: sem dados no retorno');
  const timestamps = result.timestamp;
  const quote = result.indicators.quote[0];
  return timestamps
    .map((t, i) => ({
      t: new Date(t * 1000),
      o: quote.open[i],
      h: quote.high[i],
      l: quote.low[i],
      c: quote.close[i],
    }))
    .filter(c => c.c != null);
}

/**
 * Gera dados simulados para fallback (B3)
 * @param {string} symbol
 * @param {string} period
 * @returns {{t: Date, o: number, h: number, l: number, c: number}[]}
 */
function generateFallback(symbol, period) {
  const baseMap = {
    'PETR4': 36.5, 'VALE3': 58.2, 'ITUB4': 34.8,
    'BBDC4': 13.9, 'ABEV3': 11.5,
  };
  const key    = symbol.replace('.SA', '');
  const base   = baseMap[key] ?? 30;
  const counts = { '1d': 80, '5d': 120, '1mo': 90, '3mo': 90 };
  const n      = counts[period] ?? 90;
  let p = base * 0.93;
  const candles = [];
  for (let i = 0; i < n; i++) {
    const change = (Math.random() - 0.49) * base * 0.015;
    const open   = p;
    p = Math.max(base * 0.8, Math.min(base * 1.2, p + change));
    candles.push({
      t: new Date(Date.now() - (n - i) * 3_600_000),
      o: open,
      h: Math.max(open, p) * (1 + Math.random() * 0.005),
      l: Math.min(open, p) * (1 - Math.random() * 0.005),
      c: p,
    });
  }
  return candles;
}

/**
 * Função principal de busca de dados com fallback automático
 * @param {'cripto'|'b3'} market
 * @param {string} symbol
 * @param {string} yfSymbol
 * @param {string} period
 * @returns {Promise<{ candles: Candle[], source: 'binance'|'yahoo'|'simulado' }>}
 */
async function fetchMarketData(market, symbol, yfSymbol, period) {
  if (market === 'cripto') {
    const candles = await fetchBinance(symbol, period);
    return { candles, source: 'binance' };
  }
  try {
    const candles = await fetchYahoo(yfSymbol, period);
    return { candles, source: 'yahoo' };
  } catch {
    const candles = generateFallback(yfSymbol, period);
    return { candles, source: 'simulado' };
  }
}
