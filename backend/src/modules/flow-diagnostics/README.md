# Flow Diagnostics

Endpoint:

```http
GET /api/tokens/:symbol/flow-diagnostics?range=1m
```

Optional query params:

```text
range=1d|7d|1m|1y|all
source=calculated_from_etherscan_v2_recent_cex_address_tokentx
rawSource=etherscan_v2_recent_cex_address_tokentx
fromDate=YYYY-MM-DD
toDate=YYYY-MM-DD
```

It answers:

1. Main outflow day.
2. One-day spike vs multi-day series.
3. Large outflow transactions.
4. Reverse inflow after main outflow.
5. CEX entities / addresses involved.
6. Concentration risk.

The daily part uses `cex_flow_daily`.

The entity/address part uses `transfers` + `addresses` + `entities` when available.
