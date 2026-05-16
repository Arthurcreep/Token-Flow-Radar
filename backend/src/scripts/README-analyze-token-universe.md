# Analyze Token Universe

Runs CEX-flow analysis pipeline for a token universe.

## Default first batch

```bash
cd /d/token-flow-radar/backend
node src/scripts/analyzeTokenUniverse.js
```

Default symbols:

```text
MKR,LDO,PENDLE,ENA,PEPE
```

## Custom symbols

```bash
SYMBOLS=MKR,LDO,PEPE node src/scripts/analyzeTokenUniverse.js
```

## Full universe

```bash
UNIVERSE_ANALYZE_MODE=full node src/scripts/analyzeTokenUniverse.js
```

## Optional settings

```bash
BLOCKS_BACK=216000 \
OFFSET=50 \
MAX_PAGES=2 \
MAX_ADDRESSES=7 \
VALUATION_LIMIT=1000 \
LARGE_TRANSFER_THRESHOLD_USD=50000 \
UNIVERSE_ANALYZE_DELAY_MS=2500 \
node src/scripts/analyzeTokenUniverse.js
```

## Pipeline steps

For each token:

1. ingest recent transfers
2. value transfers
3. calculate CEX flows
4. update price context

The script continues even if one token fails.
