const { QueryTypes } = require('sequelize');

const {
  CexFlowDaily
} = require('../../models');

function buildWhere({
  source,
  fromDate,
  toDate
}) {
  const clauses = ['1 = 1'];

  if (source) {
    clauses.push('cfd.source = :source');
  }

  if (fromDate) {
    clauses.push('cfd.date >= :fromDate');
  }

  if (toDate) {
    clauses.push('cfd.date <= :toDate');
  }

  return clauses.join(' AND ');
}

async function findLatestDateBySource({
  source
}) {
  const rows = await CexFlowDaily.sequelize.query(
    `
      SELECT MAX(cfd.date)::text AS latest_date
      FROM cex_flow_daily cfd
      WHERE (:source IS NULL OR cfd.source = :source);
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        source: source || null
      }
    }
  );

  return rows[0]?.latest_date || null;
}

async function findLeaderboardRows({
  source,
  fromDate,
  toDate,
  limit = 50,
  offset = 0
}) {
  const whereSql = buildWhere({
    source,
    fromDate,
    toDate
  });

  const replacements = {
    source,
    fromDate,
    toDate,
    limit,
    offset
  };

  const rows = await CexFlowDaily.sequelize.query(
    `
      SELECT
        t.id AS token_id,
        t.symbol AS token_symbol,
        t.name AS token_name,
        t.chain AS token_chain,
        t.contract_address AS contract_address,
        t.coingecko_id AS coingecko_id,

        COUNT(*)::integer AS active_days,

        SUM(cfd.cex_inflow)::numeric AS cex_inflow,
        SUM(cfd.cex_outflow)::numeric AS cex_outflow,
        SUM(cfd.cex_netflow)::numeric AS cex_netflow,

        SUM(cfd.cex_inflow_usd)::numeric AS cex_inflow_usd,
        SUM(cfd.cex_outflow_usd)::numeric AS cex_outflow_usd,
        SUM(cfd.cex_netflow_usd)::numeric AS cex_netflow_usd,

        SUM(cfd.inflow_tx_count)::integer AS inflow_tx_count,
        SUM(cfd.outflow_tx_count)::integer AS outflow_tx_count,

        SUM(cfd.large_inflow_count)::integer AS large_inflow_count,
        SUM(cfd.large_outflow_count)::integer AS large_outflow_count,

        SUM(COALESCE(cfd.large_inflow_usd, 0))::numeric AS large_inflow_usd,
        SUM(COALESCE(cfd.large_outflow_usd, 0))::numeric AS large_outflow_usd,
        SUM(COALESCE(cfd.large_netflow_usd, 0))::numeric AS large_netflow_usd,

        MAX(COALESCE(cfd.large_transfer_threshold_usd, 0))::numeric AS large_transfer_threshold_usd,

        MIN(cfd.date)::text AS active_from_date,
        MAX(cfd.date)::text AS active_to_date,

        MAX(COALESCE(cfd.data_mode, 'unknown')) AS data_mode,

        MAX(pc.current_price_usd)::numeric AS current_price_usd,
        MAX(pc.ath_usd)::numeric AS ath_usd,
        MAX(pc.ath_date) AS ath_date,
        MAX(pc.drawdown_from_ath_pct)::numeric AS drawdown_from_ath_pct,
        MAX(pc.upside_to_ath_pct)::numeric AS upside_to_ath_pct,
        MAX(pc.provider) AS price_provider,
        MAX(pc.updated_at) AS price_updated_at

      FROM cex_flow_daily cfd
      INNER JOIN tokens t ON t.id = cfd.token_id
      LEFT JOIN token_price_context pc ON pc.token_id = t.id

      WHERE ${whereSql}

      GROUP BY
        t.id,
        t.symbol,
        t.name,
        t.chain,
        t.contract_address,
        t.coingecko_id

      ORDER BY
        ABS(SUM(cfd.cex_netflow_usd)) DESC,
        ABS(SUM(COALESCE(cfd.large_netflow_usd, 0))) DESC

      LIMIT :limit
      OFFSET :offset;
    `,
    {
      type: QueryTypes.SELECT,
      replacements
    }
  );

  const countRows = await CexFlowDaily.sequelize.query(
    `
      SELECT COUNT(*)::integer AS total
      FROM (
        SELECT cfd.token_id
        FROM cex_flow_daily cfd
        WHERE ${whereSql}
        GROUP BY cfd.token_id
      ) grouped;
    `,
    {
      type: QueryTypes.SELECT,
      replacements
    }
  );

  return {
    rows,
    total: countRows[0]?.total || 0
  };
}

module.exports = {
  findLatestDateBySource,
  findLeaderboardRows
};