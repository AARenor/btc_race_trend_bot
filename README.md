# A long-only cbBTC trend bot for make.fun's 24-hour race

[![make.fun · btc-race-24h-20261123-0511](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511)
[![live rank](https://make.fun/badge/btc-race-24h-20261123-0511/AARenor/btc_race_trend_bot/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511)
[![live reward](https://make.fun/badge/btc-race-24h-20261123-0511/AARenor/btc_race_trend_bot/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511)

## Strategy

The bot trades one symbol, `CBBTC`, and holds at most one position. On the first bar it can trade it spends its full allowed weight in a single buy. It then holds while the close stays above the 720-bar exponential moving average, and exits the whole position on either a 6% trailing stop below the highest close since entry or a close below that EMA. After an exit it waits 60 bars before considering another entry, which is then gated by a faster 120-bar EMA so a recovery is caught sooner.

## Run

Requires Node 22 or newer (native TypeScript type stripping). The bot speaks the kit's bar protocol on stdin and stdout:

```sh
node main.ts
```

Replies go to stdout, one per batch; diagnostics belong on stderr.
