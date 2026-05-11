'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('addresses', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      chain: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'ethereum'
      },
      address: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      entity_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'entities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      address_type: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'unknown'
      },
      address_role: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'unknown'
      },
      label: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      source: {
        type: Sequelize.STRING(128),
        allowNull: true
      },
      confidence: {
        type: Sequelize.DECIMAL(4, 3),
        allowNull: false,
        defaultValue: 0
      },
      is_contract: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    await queryInterface.addConstraint('addresses', {
      fields: ['chain', 'address'],
      type: 'unique',
      name: 'addresses_chain_address_unique'
    });

    await queryInterface.addIndex('addresses', ['chain']);
    await queryInterface.addIndex('addresses', ['address']);
    await queryInterface.addIndex('addresses', ['entity_id']);
    await queryInterface.addIndex('addresses', ['address_type']);
    await queryInterface.addIndex('addresses', ['address_role']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('addresses');
  }
};