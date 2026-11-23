// Long-only CBBTC trend bot: one position at a time. It enters on the first tradable
// bar, exits when the close falls below the 720-bar EMA or 6% under the highest close
// since entry, then waits out a 60-bar cooldown. After a stop-out a faster 120-bar EMA
// gates re-entry, so a recovery is caught sooner. It reads no clock, environment or
// randomness, so identical bars always produce identical orders.

import { BPS, runBars, type Bar, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const SLOW_BARS = 720;
const FAST_BARS = 120;
const TRAIL_BPS = 600;
const COOLDOWN_BARS = 60;
const MAX_SLIPPAGE_BPS = 100;
const SYMBOL = 'CBBTC';

interface Ema {
  span: number;
  warm: number[];
  value: number | null;
}

const slow: Ema = { span: SLOW_BARS, warm: [], value: null };
const fast: Ema = { span: FAST_BARS, warm: [], value: null };
let peak = 0;
let cooldown = 0;
let entered = false;

function updateEma(tracker: Ema, close: number): void {
  if (tracker.value !== null) {
    tracker.value += (2 / (tracker.span + 1)) * (close - tracker.value);
    return;
  }
  tracker.warm.push(close);
  if (tracker.warm.length < tracker.span) return;
  tracker.value = tracker.warm.reduce((sum, value) => sum + value, 0) / tracker.span;
  tracker.warm = [];
}

function onBatch(state: BarsState, batch: { bars: Bar[] }): Array<BuyInput | SellInput> {
  let close: number | null = null;
  for (const bar of batch.bars) {
    if (bar.symbol !== SYMBOL) continue;
    close = Number(bar.c);
    updateEma(slow, close);
    updateEma(fast, close);
  }
  if (close === null || state.warmingUp) return [];

  const held = state.positions.get(SYMBOL);
  if (held !== undefined) {
    if (close > peak) peak = close;
    const stopped = close < peak * (1 - TRAIL_BPS / 10000);
    const belowTrend = slow.value !== null && close < slow.value;
    if (!stopped && !belowTrend) return [];
    cooldown = COOLDOWN_BARS;
    entered = true;
    return [{ side: 'sell', symbol: SYMBOL, qty: held.qty, max_slippage_bps: MAX_SLIPPAGE_BPS }];
  }

  if (cooldown > 0) {
    cooldown--;
    return [];
  }
  const filter = entered ? fast : slow;
  const allowed = filter.value === null || close > filter.value;
  if (!allowed) return [];

  const { caps, fees } = state.hello;
  const cap = (BigInt(caps.max_weight_bps) * state.equity) / BPS;
  const size = state.cash < cap ? state.cash : cap;
  if (size === 0n || size < BigInt(fees.min_notional_quote_units)) return [];
  entered = true;
  peak = close;
  return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: size, max_slippage_bps: MAX_SLIPPAGE_BPS }];
}

void runBars({ onBatch });
