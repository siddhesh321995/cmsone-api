const { MongoDBManager, MGConnection } = require('mongo-driverify');
const BaseAPI = require('../express-base-api/api');
const { CMS } = require('./../cms/main');
const { UUID_NIL } = require('node-utilify');
const { MenuFolder } = require('./menus-main');
const PagesAPI = require('./pages-api');
const { Pages } = require('./pages-main');

class MenuFolderAPI extends BaseAPI {
  constructor(app, prefix, collName) {
    super(app, prefix, collName || MenuFolderAPI.COLLECTION_NAME, MenuFolder, {
      get: {
        isBasicAuth: true
      },
      put: {
        isBasicAuth: true,
        authGaurd: async (req, resp) => {
          if (req.body.folderid && req.body.name) {
            // Same name folder exist in same parent
            const exists = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, {
              folderid: req.body.folderid,
              name: req.body.name,
              isActive: true
            });
            if ((!req.body.id && exists.length > 0) || (req.body.id && exists.length > 0)) {
              return false;
            }
          }
          return true;
        }
      },
      post: {
        isBasicAuth: true,
        authGaurd: async (req, resp) => {
          if (req.body.folderid && req.body.name) {
            // Same name folder exist in same parent
            const exists = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, {
              folderid: req.body.folderid,
              name: req.body.name,
              isActive: true
            });
            if ((!req.body.id && exists.length > 0) || (req.body.id && exists.length > 0)) {
              return false;
            }
          }
          return true;
        }
      },
      delete: {
        isBasicAuth: true,
        authGaurd: async (req, resp) => {
          if (req.body.id == CMS.getInstance().id || req.body.folderid == UUID_NIL) {
            return false;
          }
          return true;
        }
      }
    });
  }

  setRoutes() {
    const getFoldersURL = this.urlPrefix + '/site/:authtoken';
    console.log('GET ' + getFoldersURL);
    this.app.get(getFoldersURL, BaseAPI.getGenericRouteHandler(async (req, resp) => {
      const tree = await this.getCurrentSiteFolderTree(CMS.getInstance().id);
      return { status: 200, data: tree };
    }, void 0, void 0, {
      isBasicAuth: true
    }));
  }

  async getCurrentSiteFolderTree(siteid, db) {
    const out = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, {
      isActive: true
    }, db);

    const getFolderById = (id) => {
      for (const folder of out) {
        if (folder.id == id) {
          return folder;
        }
      }
    };

    const getFolderByParentId = (id) => {
      const folders = [];
      for (const folder of out) {
        if (folder.folderid == id) {
          const folderJSON = new MenuFolder(folder).toJSON();
          folderJSON.nodes = getFolderByParentId(folderJSON.id);
          folders.push(folderJSON);
        }
      }
      return folders;
    };

    const root = Object.assign({}, new MenuFolder(getFolderById(siteid)).toJSON());
    root.nodes = getFolderByParentId(root.id);

    return root;
  }

  async getAllActivePages(db) {
    await CMS.autoConfigure();
    console.log('siteid', CMS.getInstance().id);
    const tree = await this.getCurrentSiteFolderTree(CMS.getInstance().id, db);
    return tree;
  }

  async getPagesByFolderId(folderid, db) {
    return PagesAPI.getInstance().getItemsByFolderId(folderid, db);
  }

  async writeAllHtmlPages() {
    const conn = new MGConnection();
    await conn.openConnection();
    const db = conn.client[MongoDBManager.DATABASE_NAME];
    const tree = await this.getAllActivePages(db);

    const each = (node, callback) => {
      if (node) {
        callback(node);
        for (const nNode of node.nodes) {
          each(nNode, callback);
        }
      }
    };

    each(tree, async (node) => {
      const pages = await this.getPagesByFolderId(node.id, db);
      node.pages = pages;
    });

    conn.closeConnection();

    console.log('tree', tree);

    return tree;
  }
}

MenuFolderAPI.COLLECTION_NAME = 'menufolder';
MenuFolderAPI.API_URL = '/menufolder';

/**
 * @type {MenuFolderAPI}
 */
MenuFolderAPI._instance = null;

MenuFolderAPI.getInstance = () => MenuFolderAPI._instance;

module.exports = MenuFolderAPI;