/**
 * app.js
 * Controlador principal da aplicação.
 * Gerencia estado da UI, seleção de ativos e orquestra o pipeline completo.
 */

const ASSETS = {
  cripto: [
    { label: 'Bitcoin (BTC)',  sym: 'BTCUSDT', yf: 'BTC-USD'  },
    { label: 'Ethereum (ETH)', sym: 'ETHUSDT', yf: 'ETH-USD'  },
    { label: 'Solana (SOL)',   sym: 'SOLUSDT', yf: 'SOL-USD'  },
    { label: 'BNB',            sym: 'BNBUSDT', yf: 'BNB-USD'  },
    { label: 'XRP',            sym: 'XRPUSDT', yf: 'XRP-USD'  },
  ],
  b3: [
    { label: 'Petrobras (PETR4)', sym: 'PETR4',    yf: 'PETR4.SA' },
    { label: 'Vale (VALE3)',      sym: 'VALE3',    yf: 'VALE3.SA' },
    { label: 'Itaú (ITUB4)',     sym: 'ITUB4',    yf: 'ITUB4.SA' },
    { label: 'Bradesco (BBDC4)', sym: 'BBDC4',    yf: 'BBDC4.SA' },
    { label: 'Ambev (ABEV3)',    sym: 'ABEV3',    yf: 'ABEV3.SA' },
  ],
};

// ── Helpers de UI ──────────────────────────────────────────────────────────

function setStatus(msg) {
  document.getElementById('statusBar').textContent = msg;
}

function setError(msg) {
  const el = document.getElementById('errBox');
  el.style.display = msg ? '' : 'none';
  el.textContent   = msg;
}

function setBadge(source) {
  const el = document.getElementById('sourceBadge');
  const map = {
    binance:  { cls: 'badge-live', label: 'binance live'    },
    yahoo:    { cls: 'badge-live', label: 'yahoo finance'   },
    simulado: { cls: 'badge-sim',  label: 'dados simulados' },
  };
  const { cls, label } = map[source] ?? map.simulado;
  el.className = 'badge ' + cls;
  el.textContent = label;
}

function updateMetricCards(candles, market) {
  const last  = candles[candles.length - 1];
  const first = candles[0];
  const hi    = Math.max(...candles.map(c => c.h));
  const lo    = Math.min(...candles.map(c => c.l));
  const pct   = ((last.c - first.c) / first.c) * 100;
  const fmt   = v => formatPrice(v, market);

  document.getElementById('mPrice').textContent = fmt(last.c);

  const chgEl = document.getElementById('mChg');
  chgEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
  chgEl.className   = 'val ' + (pct >= 0 ? 'up' : 'dn');

  document.getElementById('mHi').textContent = fmt(hi);
  document.getElementById('mLo').textContent = fmt(lo);
}

// ── Troca de mercado ───────────────────────────────────────────────────────

function onMarketChange() {
  const market = document.getElementById('market').value;
  const sel    = document.getElementById('asset');
  sel.innerHTML = ASSETS[market]
    .map((a, i) => `<option value="${i}">${a.label}</option>`)
    .join('');
  setBadge(market === 'cripto' ? 'binance' : 'yahoo');
}

// ── Pipeline principal ─────────────────────────────────────────────────────

async function runAnalysis() {
  const btn    = document.getElementById('mainBtn');
  btn.disabled = true;
  btn.textContent = 'Buscando dados...';
  setError('');

  const market    = document.getElementById('market').value;
  const idx       = +document.getElementById('asset').value;
  const period    = document.getElementById('period').value;
  const assetObj  = ASSETS[market][idx];

  try {
    // 1. Busca dados de mercado
    setStatus('Conectando à API de mercado...');
    const { candles, source } = await fetchMarketData(
      market, assetObj.sym, assetObj.yf, period
    );
    setBadge(source);
    if (source === 'simulado') {
      setStatus(`Yahoo Finance indisponível — usando dados simulados (${candles.length} candles)`);
    } else {
      setStatus(`${candles.length} candles carregados — calculando indicadores...`);
    }

    // 2. Atualiza cards de métricas
    updateMetricCards(candles, market);

    // 3. Renderiza gráficos e obtém indicadores calculados
    const { ma9, ema21, rsi, macdLine, signal } = renderAllCharts(candles);

    // 4. Extrai últimos valores dos indicadores
    const closes   = candles.map(c => c.c);
    const lastPrice = closes[closes.length - 1];
    const lastMA9   = ma9.filter(v => v != null).pop() ?? lastPrice;
    const lastEMA21 = ema21[ema21.length - 1];
    const lastRSI   = rsi.filter(v => v != null).pop() ?? 50;
    const lastMACD  = macdLine[macdLine.length - 1];
    const lastSig   = signal[signal.length - 1];
    const bullish   = lastMACD > lastSig;

    // 5. Calcula e exibe pontos operacionais
    const points = calcOperationalPoints(lastPrice, lastRSI, bullish);
    document.getElementById('aiBox').style.display = '';
    renderSignalCards(points, market, bullish);
    document.getElementById('aiText').textContent = 'Consultando agente IA...';

    // 6. Chama Claude para análise textual
    setStatus('Consultando agente IA...');
    const analysis = await callClaude({
      assetName: assetObj.label,
      market,
      period,
      price:    lastPrice,
      ma9:      lastMA9,
      ema21:    lastEMA21,
      rsi:      lastRSI,
      macdLine: lastMACD,
      signal:   lastSig,
    });

    document.getElementById('aiText').textContent = analysis;
    setStatus('Análise concluída.');
  } catch (err) {
    setError('Erro: ' + err.message);
    setStatus('');
  }

  btn.disabled    = false;
  btn.textContent = 'Analisar ativo';
}

// ── Init ───────────────────────────────────────────────────────────────────
onMarketChange();
