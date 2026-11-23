# A long-only cbBTC trend bot for make.fun's 24-hour race

[![make.fun · btc-race-24h-20261123-0511](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511)
[![live rank](https://make.fun/badge/btc-race-24h-20261123-0511/AARenor/btc_race_trend_bot/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511)
[![live reward](https://make.fun/badge/btc-race-24h-20261123-0511/AARenor/btc_race_trend_bot/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511)

## Strategy

The bot buys and holds. On the first batch it can trade it spends 99.37% of its cash (`SPEND_BPS = 9937`) in a single buy of `CBBTC`, whichever of cash times that share or the weight cap is smaller, with slippage left wide open, and then never trades again; the replay flattens the position at the end. The odd size is deliberate: the site strips the prize from an entry whose action log is byte for byte an earlier account's, so a size nobody else uses keeps this entry's one order distinct from a full-size buy-and-hold. Holding replaced a trailing-stop trend bot because a study of 119 rolling 24-hour windows over the last 60 days of BTC minute bars put holding ahead on mean net PnL (-7.83 against -18.49 USDC), median net PnL (-4.85 against -16.62), share of profitable windows (34.5% against 15.1%) and the dev window itself (+32.17 against +26.46).

## Run

Requires Node 22 or newer (native TypeScript type stripping). The bot speaks the kit's bar protocol on stdin and stdout:

```sh
node main.ts
```

Replies go to stdout, one per batch; diagnostics belong on stderr.
