'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM signals
      WHERE signal_date IS NULL
    `);
  },

  async down() {
    // irreversible cleanup
  }
};
