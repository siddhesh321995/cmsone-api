const { MongoDBManager } = require('mongo-driverify');
const BaseAPI = require('./../express-base-api/api');
const { CMS } = require('./main');

let ContentFolderAPI;
let ContentFolder;

let MenuFolderAPI;
let MenuFolder;

const uuidv4 = require('uuid');
const { UUID_NIL, CacheMgr } = require('node-utilify');

class SiteInfoAPI extends BaseAPI {
  constructor(app, prefix, collName, foldersData) {
    if (foldersData == void 0) { foldersData = {}; }
    super(app, prefix, collName || SiteInfoAPI.COLLECTION_NAME, CMS, {
      get: {},
      put: {},
      post: {},
      delete: {}
    });
    this.foldersData = foldersData;

    ContentFolderAPI = foldersData.ContentFolderAPI;
    ContentFolder = foldersData.ContentFolder;

    MenuFolderAPI = foldersData.MenuFolderAPI;
    MenuFolder = foldersData.MenuFolder;
  }

  setRoutes() {
    const configure = this.urlPrefix + '/configure';
    console.log('POST ', configure);
    this.app.post(configure, BaseAPI.getGenericRouteHandler(async (req, resp) => {
      const siteurl = req.body.frontendurl;

      const getOut = await this.get(true, {
        frontendurl: siteurl
      }, req, resp);
      if (getOut.status != 200) {
        return getOut;
      }

      if (getOut.data.length != 0) {
        req.body.id = getOut.data[0].id;
        const postOut = await this.post(true, req, resp);
        if (postOut.status != 200) {
          return postOut;
        }

        CMS._instance.set(new CMS(getOut.data[0]));
        CMS.isConfigured = true;
        return { status: 200, data: CMS._instance.toJSON() };
      } else {

        const out = await this.put(true, req, resp);
        if (out.status != 200) {
          return out;
        }

        if (ContentFolder, ContentFolderAPI, MenuFolder, MenuFolderAPI) {
          const contentFolderData = new ContentFolder({
            id: out.data.id,
            name: out.data.sitename,
            desc: 'Detault root content folder for your website',
            folderid: UUID_NIL
          }).toJSON();
          const outContentFld2 = await ContentFolderAPI._instance.put(true, {
            body: contentFolderData
          });

          const menuParentFolder = new MenuFolder({
            id: out.data.id,
            name: out.data.sitename,
            desc: 'Detault root parent folder for your website',
            folderid: UUID_NIL,
            isMenu: false,
            showOnNavBar: false,
            displayOrder: 1
          }).toJSON();
          const outMenuFolder = await MenuFolderAPI.getInstance().put(true, {
            body: menuParentFolder
          });

          const menuFolder = new MenuFolder({
            name: 'Menu',
            desc: 'Detault Menu',
            folderid: outMenuFolder.data.id,
            isMenu: true,
            showOnNavBar: true,
            displayOrder: 1
          }).toJSON();
          const outMenu = await MenuFolderAPI.getInstance().put(true, {
            body: menuFolder
          });

          const footerFolder = new MenuFolder({
            name: 'Footer',
            desc: 'Detault Footer',
            folderid: outMenuFolder.data.id,
            isMenu: false,
            showOnNavBar: false,
            displayOrder: 2
          }).toJSON();
          const outFooter = await MenuFolderAPI.getInstance().put(true, {
            body: footerFolder
          });
        }

        CMS._instance.set(new CMS(out.data));
        CMS.isConfigured = true;
        return { status: 200, data: CMS._instance.toJSON() };
      }
    }));

    const autoconfig = this.urlPrefix + '/autoconfigure';
    console.log('POST ', autoconfig);
    this.app.post(autoconfig, BaseAPI.getGenericRouteHandler(async (req, resp) => {
      const siteurl = req.body.frontendurl;
      return await this.autoConfig(siteurl);
    }));

    const settingsURL = this.urlPrefix + '/settings';
    console.log('POST ' + settingsURL);
    this.app.post(settingsURL, BaseAPI.getGenericRouteHandler(async (req, resp) => {
      const newVal = Object.assign({}, req.body);
      delete newVal.authtoken;
      const out = await MongoDBManager.getInstance().updateOneDocProm(this.collName, {
        id: CMS.getInstance().id
      }, {
        $set: newVal
      });
      CacheMgr.remove('siteInfoMeta');
      return await this.getSiteMetaData();
    }, void 0, void 0, {
      isBasicAuth: true
    }));

    console.log('GET ' + settingsURL);
    this.app.get(settingsURL, BaseAPI.getGenericRouteHandler(this.getSiteMetaData.bind(this)));
  }

  /**
   * Fetches meta data from db
   */
  async getSiteMetaData() {
    const data = CacheMgr.get('siteInfoMeta');
    if (data) {
      return { status: 200, data };
    }
    const out = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, {
      id: CMS.getInstance().id
    });

    if (!out || !out.length) {
      return { status: 500, data: { message: 'Site not configured' } };
    }

    const siteObj = new CMS(out[0]).toJSON();

    CacheMgr.set('siteInfoMeta', siteObj);

    return { status: 200, data: siteObj };
  }

  async autoConfig(siteurl) {
    const getOut = await this.get(true, {
      frontendurl: siteurl
    });
    if (getOut.status != 200) {
      return getOut;
    }
    if (!getOut.data.length) {
      return { status: 200, data: {} };
    }

    CMS._instance.set(new CMS(getOut.data[0]));
    CMS.isConfigured = true;
    CMS.writeJSON(CMS.SITE_JSON_PATH, CMS._instance.toJSON());
    return { status: 200, data: CMS._instance.toJSON() };
  }

  async autoConfigNew() {
    const getOut = await this.get(true);
    if (getOut.status != 200) {
      return getOut;
    }
    if (!getOut.data.length) {
      return { status: 200, data: {} };
    }

    CMS._instance.set(new CMS(getOut.data[0]));
    CMS.isConfigured = true;
    CMS.writeJSON(CMS.SITE_JSON_PATH, CMS._instance.toJSON());
    return { status: 200, data: CMS._instance.toJSON() };
  }
}

SiteInfoAPI.COLLECTION_NAME = 'siteinfo';
SiteInfoAPI.API_URL = '/siteinfo';

/**
 * @type {SiteInfoAPI}
 */
SiteInfoAPI._instance = null;

SiteInfoAPI.getInstance = () => SiteInfoAPI._instance;

module.exports = SiteInfoAPI;