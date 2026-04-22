# Agente de Análise Gráfica

Agente inteligente de análise técnica de ativos financeiros com interface web interativa.
Combina indicadores técnicos reais com análise gerada por IA (Claude — Anthropic).

---

## Funcionalidades

- **Mercados suportados:** Ações brasileiras (B3) e Criptomoedas
- **Dados em tempo real:** Binance API (cripto) e Yahoo Finance (B3)
- **Indicadores técnicos:**
  - Médias Móveis: MA9 e EMA21
  - RSI — Índice de Força Relativa (14 períodos)
  - MACD (12/26/9) com histograma
- **Análise por IA:** Claude (Anthropic) interpreta os indicadores e retorna pontos de entrada, saída e stop loss
- **Fallback automático:** se o Yahoo Finance estiver indisponível, usa dados simulados com aviso

---

## Ativos disponíveis

| Mercado | Ativo | Código |
|---------|-------|--------|
| B3 | Petrobras PN | PETR4 |
| B3 | Vale ON | VALE3 |
| B3 | Itaú Unibanco PN | ITUB4 |
| B3 | Bradesco PN | BBDC4 |
| B3 | Ambev ON | ABEV3 |
| Cripto | Bitcoin | BTC |
| Cripto | Ethereum | ETH |
| Cripto | Solana | SOL |
| Cripto | BNB | BNB |
| Cripto | XRP | XRP |

---

## Como usar

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/agente-analise-grafica.git
cd agente-analise-grafica
```

### 2. Configure a chave da API Anthropic

Abra `js/agent.js` e localize a função `callClaude`. A requisição à API já está configurada — você precisa fornecer sua chave de uma das seguintes formas:

**Opção A — Variável de ambiente via proxy (recomendado para produção):**
Configure um back-end simples que injete o header `x-api-key`.

**Opção B — Desenvolvimento local apenas:**
Adicione o header diretamente em `agent.js` (nunca faça commit com a chave):

```js
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'SUA_CHAVE_AQUI',  // não faça commit!
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-allow-browser': 'true',
},
```

> A Anthropic disponibiliza a opção `anthropic-dangerous-allow-browser: true` para desenvolvimento. Em produção, sempre use um proxy back-end.

### 3. Abra no navegador

```bash
# Com Python
python -m http.server 8080

# Com Node.js (npx)
npx serve .
```

Acesse `http://localhost:8080`.

---

## Estrutura do projeto

```
agente-analise-grafica/
├── index.html          # Interface principal
├── js/
│   ├── indicators.js   # Cálculo de MA, EMA, RSI, MACD
│   ├── dataFetch.js    # Busca de dados (Binance, Yahoo Finance, fallback)
│   ├── charts.js       # Renderização dos gráficos (Chart.js)
│   ├── agent.js        # Integração com API do Claude
│   └── app.js          # Controlador principal da aplicação
└── README.md
```

---

## Stack tecnológica

| Tecnologia | Finalidade |
|------------|-----------|
| HTML5 / CSS3 / JavaScript ES6 | Interface e lógica |
| [Chart.js 4.4](https://www.chartjs.org/) | Gráficos interativos |
| [Binance API](https://binance-docs.github.io/apidocs/) | Dados de criptomoedas (gratuita) |
| [Yahoo Finance](https://finance.yahoo.com/) | Dados de ações B3 |
| [Claude (Anthropic)](https://anthropic.com/) | Análise textual por IA |

---

## Roadmap

- [ ] v1.1 — Gráfico de candlestick (OHLCV)
- [ ] v1.2 — Bandas de Bollinger e Volume
- [ ] v1.3 — Histórico de análises (IndexedDB)
- [ ] v1.4 — Alertas de entrada/saída (notificações do navegador)
- [ ] v2.0 — Back-end proxy (Node.js/Python) + autenticação

---

## Aviso legal

Este sistema é de caráter **informativo e educacional**. Nenhuma análise gerada constitui recomendação formal de investimento. Decisões financeiras devem considerar o perfil de risco do investidor e, quando necessário, a orientação de um profissional certificado (CNPI).

---

## Licença

MIT
