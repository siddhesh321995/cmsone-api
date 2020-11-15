const { MongoDBManager } = require('mongo-driverify');
const BaseAPI = require('../express-base-api/api');
const { CMS } = require('./../cms/main');
const { UUID_NIL } = require('node-utilify');
const { MenuFolder } = require('./menus-main');

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

  async getCurrentSiteFolderTree(siteid) {
    const out = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, {
      isActive: true
    });

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
}

MenuFolderAPI.COLLECTION_NAME = 'menufolder';
MenuFolderAPI.API_URL = '/menufolder';

/**
 * @type {MenuFolderAPI}
 */
MenuFolderAPI._instance = null;

MenuFolderAPI.getInstance = () => MenuFolderAPI._instance;

module.exports = MenuFolderAPI;