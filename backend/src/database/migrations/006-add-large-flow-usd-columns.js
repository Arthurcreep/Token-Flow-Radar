module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE cex_flow_daily
      ADD COLUMN IF NOT EXISTS large_inflow_usd NUMERIC(30, 8) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS large_outflow_usd NUMERIC(30, 8) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS large_netflow_usd NUMERIC(30, 8) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS large_transfer_threshold_usd NUMERIC(30, 8) NOT NULL DEFAULT 0;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE cex_flow_daily
      DROP COLUMN IF EXISTS large_inflow_usd,
      DROP COLUMN IF EXISTS large_outflow_usd,
      DROP COLUMN IF EXISTS large_netflow_usd,
      DROP COLUMN IF EXISTS large_transfer_threshold_usd;
    `);
  }
};
