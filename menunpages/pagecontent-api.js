const { MongoDBManager } = require('./../db-manager/manager');
const BaseAPI = require('./../express-base-api/api');
const { PageContent } = require('./pagecontent-main');
const ContentItemAPI = require('./../content-lib/api');

class PageContentAPI extends BaseAPI {
  constructor(app, prefix, collName) {
    super(app, prefix, collName || PageContentAPI.COLLECTION_NAME, PageContent, {
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
    const pageContentById = this.urlPrefix + '/page/:pageid/:authtoken';
    console.log('GET ' + pageContentById);
    this.app.get(pageContentById, BaseAPI.getGenericRouteHandler(async (req, resp) => {
      const pageid = req.params.pageid;
      const out = await this.getPageContent(pageid);
      return { status: 200, data: out };
    }, void 0, void 0, {
      isBasicAuth: true
    }));
  }

  async getPageContent(pageid) {
    const getOut = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, {
      pageid
    });

    const ids = [];
    for (const item of getOut) {
      ids.push(item.contentid);
    }

    const contentItems = await ContentItemAPI.getInstance().getItemsByContentIds(ids);
    return contentItems;
  }
}

PageContentAPI.COLLECTION_NAME = 'pagecontent';
PageContentAPI.API_URL = '/pagecontent';

/**
 * @type {PageContentAPI}
 */
PageContentAPI._instance = null;
PageContentAPI.getInstance = () => PageContentAPI._instance;

module.exports = PageContentAPI;