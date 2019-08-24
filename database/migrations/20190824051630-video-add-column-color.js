'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { STRING } = Sequelize;
    await queryInterface.addColumn(
      'videos',
      'color',
      STRING
    );
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('videos', 'color');
  },
};
