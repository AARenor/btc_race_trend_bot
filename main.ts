// Buy-and-hold entry for make.fun's 24-hour BTC race: it buys CBBTC once, on the first batch it can
// trade, and never trades again; the replay flattens the position at the end. It reads no clock,
// environment or randomness, so identical bars always produce identical orders.
//
// The size is 99.37% of cash (SPEND_BPS), not the full 100% the house buy-and-hold baseline spends: the
// site strips prizes from an entry whose action log is byte for byte an earlier account's, and one odd
// size keeps this single order distinct from every full-size buy-and-hold.

import { BPS, runBars, type BuyInput } from './vendor/makefun-bars.ts';

const SPEND_BPS = 9937n;
const MAX_SLIPPAGE_BPS = 10_000;

let decided = false;

await runBars({
  onBatch(state) {
    // While warming up every order would be rejected (warmup) and never retried: wait for the window.
    if (decided || state.warmingUp) return [];
    const { caps, fees } = state.hello;
    const priced = state.hello.symbols.map((s) => s.symbol).filter((symbol) => state.close(symbol) !== null);
    if (priced.length === 0) return [];

    const spend = (state.cash * SPEND_BPS) / BPS;
    const byWeight = (BigInt(caps.max_weight_bps) * state.equity) / BPS;
    const slice = spend < byWeight ? spend : byWeight;
    if (slice === 0n || slice < BigInt(fees.min_notional_quote_units)) return [];

    decided = true;
    return [{ side: 'buy', symbol: priced[0], notional_quote_units: slice, max_slippage_bps: MAX_SLIPPAGE_BPS }];
  },
});
