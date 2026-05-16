const { Op, QueryTypes } = require('sequelize');

const {
  Token
} = require('../../models');

async function findTokensForPriceContext({
  symbols,
  onlyActive = true
}) {
  const where = {
    coingecko_id: {
      [Op.ne]: null
    }
  };

  if (onlyActive) {
    where.is_active = true;
  }

  if (symbols?.length) {
    where.symbol = symbols.map((symbol) => symbol.toUpperCase());
  }

  return Token.findAll({
    where,
    order: [['symbol', 'ASC']]
  });
}

async function upsertPriceContext({
  tokenId,
  currentPriceUsd,
  athUsd,
  athDate,
  drawdownFromAthPct,
  upsideToAthPct,
  athChangePercentage,
  provider,
  source,
  rawPayload
}) {
  return Token.sequelize.query(
    `
      INSERT INTO token_price_context (
        token_id,
        date,
        current_price_usd,
        ath_usd,
        ath_date,
        drawdown_from_ath_pct,
        upside_to_ath_pct,
        ath_change_percentage,
        provider,
        source,
        raw_payload,
        created_at,
        updated_at
      )
      VALUES (
        :tokenId,
        CURRENT_DATE,
        :currentPriceUsd,
        :athUsd,
        :athDate,
        :drawdownFromAthPct,
        :upsideToAthPct,
        :athChangePercentage,
        :provider,
        :source,
        CAST(:rawPayload AS JSONB),
        NOW(),
        NOW()
      )
      ON CONFLICT (token_id)
      DO UPDATE SET
        date = EXCLUDED.date,
        current_price_usd = EXCLUDED.current_price_usd,
        ath_usd = EXCLUDED.ath_usd,
        ath_date = EXCLUDED.ath_date,
        drawdown_from_ath_pct = EXCLUDED.drawdown_from_ath_pct,
        upside_to_ath_pct = EXCLUDED.upside_to_ath_pct,
        ath_change_percentage = EXCLUDED.ath_change_percentage,
        provider = EXCLUDED.provider,
        source = EXCLUDED.source,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = NOW();
    `,
    {
      type: QueryTypes.INSERT,
      replacements: {
        tokenId,
        currentPriceUsd,
        athUsd,
        athDate,
        drawdownFromAthPct,
        upsideToAthPct,
        athChangePercentage,
        provider,
        source,
        rawPayload: JSON.stringify(rawPayload || {})
      }
    }
  );
}

async function findPriceContextBySymbol(symbol) {
  const rows = await Token.sequelize.query(
    `
      SELECT
        t.id AS token_id,
        t.symbol,
        t.name,
        t.chain,
        t.contract_address,
        t.coingecko_id,
        pc.date::text AS date,
        pc.current_price_usd,
        pc.ath_usd,
        pc.ath_date,
        pc.drawdown_from_ath_pct,
        pc.upside_to_ath_pct,
        pc.ath_change_percentage,
        pc.provider,
        pc.source,
        pc.updated_at
      FROM tokens t
      LEFT JOIN token_price_context pc ON pc.token_id = t.id
      WHERE t.symbol = :symbol
      LIMIT 1;
    `,
    {
      type: QueryTypes.SELECT,
      replacements: {
        symbol: symbol.toUpperCase()
      }
    }
  );

  return rows[0] || null;
}

module.exports = {
  findTokensForPriceContext,
  upsertPriceContext,
  findPriceContextBySymbol
};
