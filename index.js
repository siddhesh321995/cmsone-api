const environments = require('./environment');
const { CMS } = require('./cms/main');
const { configuerEmail } = require('./email/email');
const BaseAPI = require('./express-base-api/api');
const TrackerAPI = require('./event-tracker/tracker');
const AdminAPI = require('./admin/api');
const AnalyticsAPI = require('./analytics/api');
const NewsLetterAPI = require('./newsletter/api');
const SiteInfoAPI = require('./cms/siteinfo');

const ContentFolderAPI = require('./content-lib/content-folder-api');
const { ContentFolder } = require('./content-lib/content-folder');
const ContentItemAPI = require('./content-lib/api');

const MenuFolderAPI = require('./menunpages/menus-api');
const { MenuFolder } = require('./menunpages/menus-main');
const PagesAPI = require('./menunpages/pages-api');
const PageContentAPI = require('./menunpages/pagecontent-api');
const MongoDriver = require('mongo-driverify');


// setup environment
environments.setup();

const getVersion = function () {
  var major = 1;
  var minor = 1;
  var patch = 28;

  return {
    version: 'v' + major + '.' + minor + '.' + patch,
    major,
    minor,
    patch
  };
};

/**
 * @typedef {{sessionCollectionName:string;}} SetupOptions
 */

/**
 * @typedef {{MONGODB_CONNECTION:string;HAS_CERT:boolean;DATABASE_NAME:string;EMAILID:string;EMAIL_PASSWORD:string}} EnvironmentConfigs
 */

/**
 * @typedef {{[env:string]:EnvironmentConfigs}} Configs
 */

/**
 * Sets up your express app
 * @param {Object} app Express API App
 * @param {Configs} mainConfig Env config like mongo connection string, email config etc
 * @param {Object} foldersData Object containing folder API and Classes
 */
const setup = (app, mainConfig, foldersData = {}) => {
  if (foldersData.ContentFolderAPI == void 0) { foldersData.ContentFolderAPI = ContentFolderAPI; }
  if (foldersData.ContentFolder == void 0) { foldersData.ContentFolder = ContentFolder; }
  if (foldersData.MenuFolderAPI == void 0) { foldersData.MenuFolderAPI = MenuFolderAPI; }
  if (foldersData.MenuFolder == void 0) { foldersData.MenuFolder = MenuFolder; }

  const config = environments.envs[process.env.NODE_ENV];
  /**
   * @type {EnvironmentConfigs}
   */
  let usedConfig;

  if (!mainConfig) {
    usedConfig = config;
  } else {
    usedConfig = mainConfig[process.env.NODE_ENV];
  }

  // Configure database
  MongoDriver.MongoDBManager.configure({
    connectionString: usedConfig.MONGODB_CONNECTION,
    hasCert: usedConfig.HAS_CERT,
    certPath: __dirname + "/ssl.cert",
    dbName: usedConfig.DATABASE_NAME
  });

  // Configure email
  configuerEmail({
    user: usedConfig.EMAILID,
    pass: usedConfig.EMAIL_PASSWORD
  });

  app.get('/', function (request, response) {
    response.status(200).send('API is running on ' + getVersion().version + ' with environment ' + process.env.NODE_ENV);
  });

  app.get('/connect', function (request, response) {
    response.status(200).send("Depricated");
  });

  app.get('/version', function (request, response) {
    response.status(200).send(getVersion());
  });

  app.get('/isconfigured', BaseAPI.getGenericRouteHandler(async (req, resp) => {
    if (!CMS.isConfigured) {
      let url = req.headers.origin;
      url = url.replace('https://', '');
      url = url.replace('http://', '');
      url = url.replace('www.', '');
      url = url.replace('stage.', '');
      console.log('checking to autoconfig', url);
      const autoOut = await SiteInfoAPI.getInstance().autoConfig(url);
    }
    return { status: 200, data: { isConfigured: CMS.isConfigured } };
  }));

  app.get('/info', BaseAPI.getGenericRouteHandler(async (req, resp) => {
    return { status: 200, data: { siteinfo: CMS.getInstance().toJSON() } };
  }));

  new TrackerAPI(app, '/events');
  new AdminAPI(app, '/admin');
  new AnalyticsAPI(app, '/analytics');
  new NewsLetterAPI(app, '/newsletter');

  const contentItemAPI = new ContentItemAPI(app, '/contentitem');
  ContentItemAPI._instance = contentItemAPI;

  const contentFolderAPI = new ContentFolderAPI(app, '/contentfolder');
  ContentFolderAPI._instance = contentFolderAPI;

  const pagesAPI = new PagesAPI(app, PagesAPI.API_URL);
  PagesAPI._instance = pagesAPI;

  const pageContentAPI = new PageContentAPI(app, PageContentAPI.API_URL);
  PageContentAPI._instance = pageContentAPI;

  const menuFolderAPI = new MenuFolderAPI(app, MenuFolderAPI.API_URL);
  MenuFolderAPI._instance = menuFolderAPI;

  const siteInfoAPI = new SiteInfoAPI(app, '/siteinfo', void 0, foldersData);
  SiteInfoAPI._instance = siteInfoAPI;
};

module.exports = {
  Main: {
    setup,
    getVersion
  },
  BaseAPI,
  Email: require('./email/email'),
  TrackerAPI,
  AdminAPI,
  AnalyticsAPI,
  NewsLetterAPI,
  SiteInfoAPI,
  CMS,
  MongoManager: MongoDriver,
  Notification: require('./notification/main'),
  Log: require('./error/main'),
  Common: require('node-utilify'),
  ContentItemAPI,
  ContentFolderAPI,
  PagesAPI,
  PageContentAPI,
  MenuFolderAPI,
  SiteInfoAPI
};
