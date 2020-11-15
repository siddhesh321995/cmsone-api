const should = require('should');
const CMSOne = require('./index');

const apiURL = 'sample';
const collName = 'sampleprimarycollection';

describe('Unit tests for CMSOne API', () => {
  describe('API Functions', () => {
    it('Base API', (done) => {
      const api = new CMSOne.BaseAPI({
        get: () => { },
        post: () => { },
        delete: () => { },
        put: () => { },
      }, apiURL, collName);

      api.collName.should.equal(collName);
      api.urlPrefix.should.equal(apiURL);

      CMSOne.BaseAPI.getGenericRouteHandler((req, resp) => { });

      const a = { b: 10, c: void 0 };
      const b = CMSOne.BaseAPI.cleanObj(a);
      b.should.not.have.property('c');
      done();
    });
    it('Common Node Util Package', (done) => {
      CMSOne.Common.isArray([]).should.equal(true);
      done();
    });
    it('Main Setup', (done) => {
      CMSOne.Main.setup({
        get: () => { },
        post: () => { },
        delete: () => { },
        put: () => { },
      });
      done();
    });
  });
});
