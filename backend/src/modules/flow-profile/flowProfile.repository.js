const { QueryTypes } = require('sequelize');

const {
  sequelize
} = require('../../models');

const DEFAULT_SOURCE = 'calculated_from_etherscan_v2_recent_cex_address_tokentx';

const findTokenBySymbol = async (symbol) => {
  const rows = await sequelize.query(
    `
      SELECT
        id,
        symbol,
        name,
        chain,
        contract_address,
        decimals,
        coingecko_id,
        is_active
      FROM tokens
      WHERE UPPER(symbol) = :symbol
      LIMIT 1;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        symbol: String(symbol || '').toUpperCase()
      }
    }
  );

  return rows[0] || null;
};

const findLatestFlowDate = async ({
  tokenId,
  source = DEFAULT_SOURCE
}) => {
  const rows = await sequelize.query(
    `
      SELECT MAX(date)::text AS latest_date
      FROM cex_flow_daily
      WHERE token_id = :tokenId
        AND (:source IS NULL OR source = :source);
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        tokenId,
        source: source || null
      }
    }
  );

  return rows[0]?.latest_date || null;
};

const findDailyFlows = async ({
  tokenId,
  source = DEFAULT_SOURCE,
  fromDate,
  toDate,
  limit = 500,
  offset = 0
}) => {
  const rows = await sequelize.query(
    `
      SELECT
        cfd.id,
        cfd.date::text AS date,
        cfd.source,
        COALESCE(cfd.data_mode, 'unknown') AS data_mode,

        cfd.cex_inflow::numeric AS cex_inflow,
        cfd.cex_outflow::numeric AS cex_outflow,
        cfd.cex_netflow::numeric AS cex_netflow,

        cfd.cex_inflow_usd::numeric AS cex_inflow_usd,
        cfd.cex_outflow_usd::numeric AS cex_outflow_usd,
        cfd.cex_netflow_usd::numeric AS cex_netflow_usd,

        cfd.inflow_tx_count::integer AS inflow_tx_count,
        cfd.outflow_tx_count::integer AS outflow_tx_count,

        COALESCE(cfd.large_inflow_count, 0)::integer AS large_inflow_count,
        COALESCE(cfd.large_outflow_count, 0)::integer AS large_outflow_count,

        COALESCE(cfd.large_inflow_usd, 0)::numeric AS large_inflow_usd,
        COALESCE(cfd.large_outflow_usd, 0)::numeric AS large_outflow_usd,
        COALESCE(cfd.large_netflow_usd, 0)::numeric AS large_netflow_usd,

        COALESCE(cfd.large_transfer_threshold_usd, 0)::numeric AS large_transfer_threshold_usd

      FROM cex_flow_daily cfd

      WHERE cfd.token_id = :tokenId
        AND (:source IS NULL OR cfd.source = :source)
        AND (:fromDate IS NULL OR cfd.date >= :fromDate)
        AND (:toDate IS NULL OR cfd.date <= :toDate)

      ORDER BY cfd.date DESC

      LIMIT :limit
      OFFSET :offset;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        tokenId,
        source: source || null,
        fromDate: fromDate || null,
        toDate: toDate || null,
        limit,
        offset
      }
    }
  );

  const countRows = await sequelize.query(
    `
      SELECT COUNT(*)::integer AS total
      FROM cex_flow_daily cfd
      WHERE cfd.token_id = :tokenId
        AND (:source IS NULL OR cfd.source = :source)
        AND (:fromDate IS NULL OR cfd.date >= :fromDate)
        AND (:toDate IS NULL OR cfd.date <= :toDate);
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        tokenId,
        source: source || null,
        fromDate: fromDate || null,
        toDate: toDate || null
      }
    }
  );

  return {
    rows,
    total: countRows[0]?.total || 0
  };
};

const findPriceContext = async (tokenId) => {
  const rows = await sequelize.query(
    `
      SELECT
        token_id,
        date,
        current_price_usd::numeric AS current_price_usd,
        ath_usd::numeric AS ath_usd,
        ath_date,
        drawdown_from_ath_pct::numeric AS drawdown_from_ath_pct,
        upside_to_ath_pct::numeric AS upside_to_ath_pct,
        ath_change_percentage::numeric AS ath_change_percentage,
        provider,
        source,
        updated_at
      FROM token_price_context
      WHERE token_id = :tokenId
      LIMIT 1;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        tokenId
      }
    }
  );

  return rows[0] || null;
};

module.exports = {
  findTokenBySymbol,
  findLatestFlowDate,
  findDailyFlows,
  findPriceContext
};
