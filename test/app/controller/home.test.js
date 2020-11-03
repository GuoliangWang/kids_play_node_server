'use strict';

const { app, assert } = require('egg-mock/bootstrap');

const basePath = '/app_kids';

describe('test/app/controller/home.test.js', () => {

  it('should assert', function* () {
    const pkg = require('../../../package.json');
    assert(app.config.keys.startsWith(pkg.name));

    // const ctx = app.mockContext({});
    // yield ctx.service.xx();
  });

  it(`should GET ${basePath}/home/index`, () => {
    return app.httpRequest()
      .get(`${basePath}/home/index`)
      // .expect('hi, egg')
      .expect(200);
  });
});
