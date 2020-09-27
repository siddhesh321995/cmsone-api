const { MongoDBManager } = require('./../db-manager/manager');
const BaseAPI = require('./../express-base-api/api');
const { Pages } = require('./pages-main');

class PagesAPI extends BaseAPI {
  constructor(app, prefix, collName) {
    super(app, prefix, collName || PagesAPI.COLLECTION_NAME, Pages, {
      get: {
        isBasicAuth: true
      },
      put: {
        isBasicAuth: true
      },
      post: {
        isBasicAuth: true
      },
      delete: {
        isBasicAuth: true
      }
    });
  }

  setRoutes() {
    const pageByFolderURL = this.urlPrefix + '/folderid/:folderid/:authtoken';
    console.log('GET ' + pageByFolderURL);
    this.app.get(pageByFolderURL, BaseAPI.getGenericRouteHandler(async (req, resp) => {
      const folderid = req.params.folderid;
      const out = await this.getItemsByFolderId(folderid);
      return { status: 200, data: out };
    }, void 0, void 0, {
      isBasicAuth: true
    }));
  }

  async getItemsByFolderId(folderid) {
    const getOut = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, {
      folderid,
      isActive: true
    });

    const respOut = [];
    for (const item of getOut) {
      respOut.push(new Pages(item).toJSON());
    }

    return respOut;
  }

  async getPageBasicDetailsById(pageid) {
    const getOut = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, {
      id: pageid,
      isActive: true
    });

    return new Pages(getOut[0]).toJSON();
  }

  async getPageBasicDetailsByURL(completeURL) {
    if (completeURL[completeURL.length - 1] === '/') {
      completeURL += 'index';
    }

    const pageOut = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, {
      completeurl: completeURL,
      isActive: true
    });
    if (pageOut.length) {
      return new Pages(pageOut[0]).toJSON();
    } else {
      return void 0;
    }
  }
}

PagesAPI.COLLECTION_NAME = 'page';
PagesAPI.API_URL = '/page';

/**
 * @type {PagesAPI}
 */
PagesAPI._instance = null;
PagesAPI.getInstance = () => PagesAPI._instance;

module.exports = PagesAPI;