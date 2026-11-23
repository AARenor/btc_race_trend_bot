// Long-only trend bot for cbBTC: one position at a time, a slow EMA exit and a
// trailing stop. It reads no clock, environment or randomness, so identical
// bars always produce identical decisions.

import { BPS, runBars, type Bar, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const SLOW_BARS = 720;
const TRAIL_BPS = 500;
const COOLDOWN_BARS = 240;
const MAX_SLIPPAGE_BPS = 100;

let warm: number[] = [];
let ema: number | null = null, peak = 0, cooldown = 0, entered = false;

function updateEma(close: number): void {
  if (ema !== null) { ema += (2 / (SLOW_BARS + 1)) * (close - ema); return; }
  warm.push(close);
  if (warm.length === SLOW_BARS) { ema = warm.reduce((sum, value) => sum + value, 0) / SLOW_BARS; warm = []; }
}

function onBatch(state: BarsState, batch: { bars: Bar[] }): Array<BuyInput | SellInput> {
  let close: number | null = null;
  for (const bar of batch.bars) {
    if (bar.symbol !== SYMBOL) continue;
    close = Number(bar.c);
    updateEma(close);
  }
  if (close === null || state.warmingUp) return [];

  const held = state.positions.get(SYMBOL);
  if (held !== undefined) {
    if (close > peak) peak = close;
    const stopped = close < peak * (1 - TRAIL_BPS / 10000);
    const belowTrend = ema !== null && close < ema;
    if (stopped || belowTrend) {
      cooldown = COOLDOWN_BARS;
      entered = true;
      return [{ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
    }
    return [];
  }

  if (cooldown > 0) { cooldown--; return []; }
  const trendOk = ema === null || close > ema;
  if (entered && !trendOk) return [];

  const { caps, fees } = state.hello;
  const cap = (BigInt(caps.max_weight_bps) * state.equity) / BPS;
  const size = state.cash < cap ? state.cash : cap;
  if (size === 0n || size < BigInt(fees.min_notional_quote_units)) return [];
  entered = true;
  peak = close;
  return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: size, max_slippage_bps: MAX_SLIPPAGE_BPS }];
}

void runBars({ onBatch });
