# Token Universe Import

This script imports a curated Ethereum ERC-20 token universe into the local database.

## Run

```bash
cd /d/token-flow-radar/backend
node src/scripts/importTokenUniverse.js
```

Optional delay override:

```bash
UNIVERSE_IMPORT_DELAY_MS=2000 node src/scripts/importTokenUniverse.js
```

## What it does

For every contract address:

1. Calls backend token resolver service.
2. If token exists, returns existing DB token.
3. If token is new, reads ERC-20 metadata.
4. Looks up CoinGecko by contract.
5. Saves token.
6. Continues even if one token fails.

## Important

This script only imports tokens. It does not run CEX-flow analysis.

Next step after import:

- ingest recent transfers
- value transfers
- calculate CEX flows
- update price context
