# Token Flow Profile

Unified token endpoint.

```http
GET /api/tokens/:symbol/flow-profile?range=1m
```

Returns:

- token
- range
- summary
- priceContext
- analysisProfile
- scores
- diagnostics
- dailyFlows

This endpoint is intended to replace multiple frontend calls:

- /tokens/:symbol/cex-flows
- /price-context/:symbol
- /markets/cex-flow-leaderboard
- /tokens/:symbol/flow-diagnostics
