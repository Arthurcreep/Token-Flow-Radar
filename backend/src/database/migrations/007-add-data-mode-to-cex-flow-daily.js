module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE cex_flow_daily
      ADD COLUMN IF NOT EXISTS data_mode VARCHAR(32) NOT NULL DEFAULT 'unknown';
    `);

    await queryInterface.sequelize.query(`
      UPDATE cex_flow_daily
      SET data_mode = CASE
        WHEN source ILIKE '%etherscan%' THEN 'real'
        WHEN source ILIKE '%manual_seed%' OR source ILIKE '%fake%' THEN 'fake'
        ELSE 'mixed'
      END
      WHERE data_mode = 'unknown' OR data_mode IS NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE cex_flow_daily
      DROP COLUMN IF EXISTS data_mode;
    `);
  }
};
