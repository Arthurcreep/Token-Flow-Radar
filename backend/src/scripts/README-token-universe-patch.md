# Patch Token Universe Metadata

Use this after the first token universe import if some tokens were imported without CoinGecko IDs or if trusted tokens failed ERC-20 metadata decoding.

## Run

```bash
cd /d/token-flow-radar/backend
node src/scripts/patchTokenUniverseMetadata.js
```

Then verify:

```bash
node src/scripts/checkTokenUniverse.js
```

## Why this exists

Some older or non-standard ERC-20 contracts can fail `symbol()` decoding through Etherscan eth_call even though they are valid tokens. For the curated universe, we patch trusted token metadata manually.
