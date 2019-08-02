'use strict';

const path = require('path');

const exps = {
  // had enabled by egg
  // static: {
  //   enable: true,
  // }
};

exps.sequelize = {
  enable: true,
  package: 'egg-sequelize',
};
exps.wafer = {
  enable: true,
  path: path.join(__dirname, '../plugins/wafer-egg'),
};
exps.validate = {
  enable: true,
  package: 'egg-validate',
};
exps.redis = {
  enable: true,
  package: 'egg-redis',
};

/** @type Egg.EggPlugin */
module.exports = exps;
