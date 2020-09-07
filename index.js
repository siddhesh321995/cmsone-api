const environments = require('./environment');
const { CMS } = require('./cms/main');
const { configuerEmail } = require('./email/email');
const BaseAPI = require('./express-base-api/api');
const TrackerAPI = require('./event-tracker/tracker');
const AdminAPI = require('./admin/api');
const AnalyticsAPI = require('./analytics/api');
const NewsLetterAPI = require('./newsletter/api');
const SiteInfoAPI = require('./cms/siteinfo');
const { MongoDBManager } = require('./db-manager/manager');

// setup environment
environments.setup();

const getVersion = function () {
  var major = 2;
  var minor = 0;
  var patch = 0;

  return {
    version: 'v' + major + '.' + minor + '.' + patch,
    major,
    minor,
    patch
  };
};

/**
 * Sets up your express app
 * @param {Object} app Express API App
 * @param {Object} mainConfig Env config like mongo connection string, email config etc
 * @param {Object} foldersData Object containing folder API and Classes
 */
const setup = (app, mainConfig, foldersData) => {
  const config = environments.envs[process.env.NODE_ENV];
  if (!mainConfig) {
    mainConfig = config;
  } else {
    mainConfig = mainConfig[process.env.NODE_ENV];
  }

  // Configure database
  MongoDBManager.configure({
    connectionString: mainConfig.MONGODB_CONNECTION,
    hasCert: mainConfig.HAS_CERT,
    certPath: __dirname + "/ssl.cert",
    dbName: mainConfig.DATABASE_NAME
  });

  // Configure email
  configuerEmail({
    user: mainConfig.EMAILID,
    pass: mainConfig.EMAIL_PASSWORD
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
  MongoManager: require('./db-manager/manager'),
  Notification: require('./notification/main'),
  Log: require('./error/main'),
  Common: require('./common')
};
