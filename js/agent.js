/**
 * agent.js
 * Integração com a API do Claude (Anthropic) para análise técnica.
 * O prompt é construído dinamicamente com os valores reais dos indicadores.
 *
 * IMPORTANTE: Em produção, mova a chave de API para um back-end.
 * Nunca exponha sua ANTHROPIC_API_KEY no front-end em ambiente público.
 */

const CLAUDE_MODEL  = 'claude-sonnet-4-20250514';
const CLAUDE_TOKENS = 1000;

/**
 * Formata um preço para exibição conforme o mercado
 * @param {number} value
 * @param {'cripto'|'b3'} market
 * @returns {string}
 */
function formatPrice(value, market) {
  if (!value) return '—';
  if (market === 'cripto') {
    return value > 100
      ? '$' + value.toLocaleString('en', { maximumFractionDigits: 0 })
      : '$' + value.toFixed(4);
  }
  return 'R$ ' + value.toFixed(2);
}

/**
 * Monta o prompt para o Claude com os dados técnicos do ativo
 * @param {object} params
 * @returns {string}
 */
function buildPrompt({ assetName, market, period, price, ma9, ema21, rsi, macdLine, signal }) {
  const fmt    = v => formatPrice(v, market);
  const mktLabel = market === 'cripto' ? 'criptomoedas' : 'ações brasileiras (B3)';
  const bullish  = macdLine > signal;

  return `Você é um analista técnico especializado em ${mktLabel}.

Dados reais do ativo ${assetName} (período: ${period}):
- Preço atual: ${fmt(price)}
- MA9: ${fmt(ma9)} — preço está ${price > ma9 ? 'ACIMA' : 'ABAIXO'} da MA9
- EMA21: ${fmt(ema21)} — preço está ${price > ema21 ? 'ACIMA' : 'ABAIXO'} da EMA21
- RSI(14): ${rsi} (${classifyRSI(rsi).toUpperCase()})
- MACD: ${macdLine.toFixed(4)} | Sinal: ${signal.toFixed(4)} | Cruzamento: ${bullish ? 'BULLISH' : 'BEARISH'}

Forneça análise técnica objetiva e concisa com:
1. Tendência atual (máximo 2 linhas)
2. Ponto de entrada sugerido com justificativa (1 linha)
3. Alvo de saída / take profit (1 linha)
4. Stop loss recomendado (1 linha)
5. Sinal geral: COMPRA, VENDA ou AGUARDAR

Use valores numéricos reais baseados no preço informado. Seja direto e profissional.`;
}

/**
 * Calcula os pontos operacionais (entrada, saída, stop) com base nos indicadores
 * @param {number} price
 * @param {number} rsi
 * @param {boolean} bullish
 * @returns {{ entry: number, exit: number, stop: number }}
 */
function calcOperationalPoints(price, rsi, bullish) {
  return {
    entry: price * (rsi < 50 ? 0.986 : 1.004),
    exit:  price * (bullish  ? 1.055 : 0.945),
    stop:  price * (bullish  ? 0.972 : 1.028),
  };
}

/**
 * Chama a API do Claude e retorna o texto da análise
 * @param {object} promptParams - Parâmetros para buildPrompt()
 * @returns {Promise<string>}
 */
async function callClaude(promptParams) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_TOKENS,
      messages: [{ role: 'user', content: buildPrompt(promptParams) }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `API HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.content?.map(c => c.text || '').join('') || 'Sem resposta da IA.';
}

/**
 * Exibe os pontos operacionais na interface
 * @param {{ entry: number, exit: number, stop: number }} points
 * @param {'cripto'|'b3'} market
 * @param {boolean} bullish
 */
function renderSignalCards(points, market, bullish) {
  const fmt = v => formatPrice(v, market);
  document.getElementById('sEntry').textContent    = fmt(points.entry);
  document.getElementById('sEntryLbl').textContent = bullish ? 'tendência bullish' : 'aguardar confirmação';
  document.getElementById('sExit').textContent     = fmt(points.exit);
  document.getElementById('sExitLbl').textContent  = 'alvo técnico';
  document.getElementById('sStop').textContent     = fmt(points.stop);
  document.getElementById('sStopLbl').textContent  = 'proteção de capital';
}
