'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('signals', 'signal_date', {
      type: Sequelize.DATEONLY,
      allowNull: true
    });

    await queryInterface.addIndex('signals', ['token_id', 'signal_type', 'regime', 'signal_date'], {
      name: 'signals_token_type_regime_date_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('signals', 'signals_token_type_regime_date_idx');
    await queryInterface.removeColumn('signals', 'signal_date');
  }
};