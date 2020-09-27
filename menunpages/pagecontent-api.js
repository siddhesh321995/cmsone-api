const { MongoDBManager } = require('./../db-manager/manager');
const BaseAPI = require('./../express-base-api/api');
const { PageContent } = require('./pagecontent-main');
const ContentItemAPI = require('./../content-lib/api');
const PagesAPI = require('./pages-api');

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

    const getPageDetails = this.urlPrefix + '/pagedetails/:pageid';
    console.log('GET ' + getPageDetails);
    this.app.get(getPageDetails, BaseAPI.getGenericRouteHandler(async (req, resp) => {
      const pageid = req.params.pageid;
      const outData = await this.getPageDetails(pageid);
      return { status: 200, data: outData };
    }, void 0, void 0));

    const getPageDetailsByURL = this.urlPrefix + '/pagedetails';
    console.log('POST ' + getPageDetailsByURL);
    this.app.post(getPageDetailsByURL, BaseAPI.getGenericRouteHandler(async (req, resp) => {
      const pageurl = req.body.pageurl;
      const outData = await this.getPageByURL(pageurl);
      return { status: 200, data: outData };
    }, void 0, void 0));
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
    for (var i = 0; i < contentItems.length; i++) {
      for (var j = 0; j < getOut.length; j++) {
        if (getOut[j].contentid == contentItems[i].id) {
          contentItems[i].mappingid = getOut[j].id;
          break;
        }
      }
    }
    return contentItems;
  }

  async getPageDetails(pageid) {
    const pageContent = await this.getPageContent(pageid);
    const pageBasics = await PagesAPI.getInstance().getPageBasicDetailsById(pageid);
    return { pageBasics, pageContent };
  }

  async getPageByURL(completeURL) {
    if (completeURL[completeURL.length - 1] === '/') {
      completeURL += 'index';
    }

    let found = false;
    let pageContent;
    const pageBasics = await PagesAPI.getInstance().getPageBasicDetailsByURL(completeURL);
    if (pageBasics) {
      pageContent = await this.getPageContent(pageBasics.id);
      found = true;
    }
    return { pageBasics, pageContent, found };
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