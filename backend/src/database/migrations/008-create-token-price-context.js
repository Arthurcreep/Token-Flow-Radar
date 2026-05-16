module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS token_price_context (
        id BIGSERIAL PRIMARY KEY,
        token_id BIGINT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
        date DATE NOT NULL DEFAULT CURRENT_DATE,

        current_price_usd NUMERIC(30, 12) NOT NULL DEFAULT 0,
        ath_usd NUMERIC(30, 12) NOT NULL DEFAULT 0,
        ath_date TIMESTAMPTZ NULL,

        drawdown_from_ath_pct NUMERIC(18, 8) NOT NULL DEFAULT 0,
        upside_to_ath_pct NUMERIC(30, 8) NOT NULL DEFAULT 0,
        ath_change_percentage NUMERIC(18, 8) NULL,

        provider VARCHAR(64) NOT NULL DEFAULT 'coingecko',
        source VARCHAR(128) NOT NULL DEFAULT 'coingecko_markets',
        raw_payload JSONB NULL,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        CONSTRAINT token_price_context_token_unique UNIQUE (token_id)
      );

      CREATE INDEX IF NOT EXISTS idx_token_price_context_token_id
        ON token_price_context(token_id);

      CREATE INDEX IF NOT EXISTS idx_token_price_context_updated_at
        ON token_price_context(updated_at);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS token_price_context;
    `);
  }
};
