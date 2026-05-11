'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tokens', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      symbol: {
        type: Sequelize.STRING(32),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      chain: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'ethereum'
      },
      contract_address: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true
      },
      decimals: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      coingecko_id: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('tokens', ['symbol']);
    await queryInterface.addIndex('tokens', ['contract_address']);
    await queryInterface.addIndex('tokens', ['chain']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tokens');
  }
};