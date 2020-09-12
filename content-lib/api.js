const { MongoDBManager } = require('../db-manager/manager');
const BaseAPI = require('../express-base-api/api');
const { ContentItem } = require('./main');

class ContentItemAPI extends BaseAPI {
  constructor(app, prefix, collName) {
    super(app, prefix, collName || ContentItemAPI.COLLECTION_NAME, ContentItem, {
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
    const contentByFolderURL = this.urlPrefix + '/folderid/:folderid/:authtoken';
    console.log('GET ' + contentByFolderURL);
    this.app.get(contentByFolderURL, BaseAPI.getGenericRouteHandler(async (req, resp) => {
      const folderid = req.params.folderid;
      const out = await this.getItemsByFolderId(folderid);
      return { status: 200, data: out };
    }, void 0, void 0, {
      isBasicAuth: true
    }));

    const getMultiContentURL = this.urlPrefix + '/multicontent';
    console.log('POST ' + getMultiContentURL);
    this.app.post(contentByFolderURL, BaseAPI.getGenericRouteHandler(async (req, resp) => {
      const contentids = req.body.contentids;
      const out = await this.getItemsByContentIds(contentids);
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
      respOut.push(new ContentItem(item).toJSON());
    }

    return respOut;
  }

  async getItemsByContentIds(contentids) {
    const getOut = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, {
      id: {
        $in: contentids
      }
    });

    const respOut = [];
    for (const item of getOut) {
      respOut.push(new ContentItem(item).toJSON());
    }

    return respOut;
  }
}

ContentItemAPI.COLLECTION_NAME = 'contentitem';
ContentItemAPI.API_URL = '/contentitem';

/**
 * @type {ContentItemAPI}
 */
ContentItemAPI._instance = null;
ContentItemAPI.getInstance = () => ContentItemAPI._instance;

module.exports = ContentItemAPI;