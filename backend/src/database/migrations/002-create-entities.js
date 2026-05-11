'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('entities', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true
      },
      entity_type: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.addIndex('entities', ['name']);
    await queryInterface.addIndex('entities', ['entity_type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('entities');
  }
};