const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid');
const appDir = path.dirname(require.main.filename);

const SITE_JSON_PATH = appDir + '/data/siteinfo.json';
const AUTH_JSON_PATH = appDir + '/data/auth.json';

class CMS {
  constructor(data = {}) {
    data = Object.assign({}, CMS.defaults(), data);
    this.id = data.id;
    this.sitename = data.sitename;
    this.frontendurl = data.frontendurl;
    this.apiurl = data.apiurl;
    this.haswww = data.haswww;
    this.isHttps = data.isHttps;
    this.authkey = data.authkey;

    this.googleAdClient = data.googleAdClient;
    this.googleAnalytics = data.googleAnalytics;
    this.msValidator = data.msValidator;
    this.defMetaDesc = data.defMetaDesc;
    this.defMetaKey = data.defMetaKey;
    this.lang = data.lang;
  }

  validate() {
    if (!this.sitename || !this.frontendurl || !this.apiurl) {
      return false;
    }
    return true;
  }

  /**
   * Returns new object with current data.
   * @param {{needAuthKey:boolean;}} data Optional, has props like authkey flag
   */
  toJSON(data = {}) {
    if (data.needAuthKey == void 0) { data.needAuthKey = false; }
    const json = {};
    json.id = this.id;
    json.sitename = this.sitename;
    json.frontendurl = this.frontendurl;
    json.apiurl = this.apiurl;
    json.haswww = this.haswww;
    json.isHttps = this.isHttps;

    if (data.needAuthKey) {
      json.authkey = this.authkey;
    }

    json.googleAdClient = this.googleAdClient;
    json.googleAnalytics = this.googleAnalytics;
    json.msValidator = this.msValidator;
    json.defMetaDesc = this.defMetaDesc;
    json.defMetaKey = this.defMetaKey;
    json.lang = this.lang;
    return json;
  }

  clean() {
    for (let key in this) {
      if (this.hasOwnProperty(key)) {
        delete this[key];
      }
    }
  }

  set(data) {
    this.clean();
    Object.assign(this, {}, data);
  }

  getFrontendURL() {
    let www = '';
    if (this.haswww) {
      www = 'www.';
    }

    let https = 'http://';
    if (this.isHttps) {
      https = 'https://';
    }

    return https + www + this.frontendurl;
  }

  getAPIURL() {
    let https = 'http://';
    if (this.isHttps) {
      https = 'https://';
    }

    return https + this.apiurl;
  }
}

CMS.SCHEMA = {
  properties: [{
    name: 'id',
    isPrimaryKey: true,
    type: 'uuid'
  }, {
    name: 'sitename',
    type: 'string'
  }, {
    name: 'frontendurl',
    type: 'string'
  }, {
    name: 'apiurl',
    type: 'uuid'
  }, {
    name: 'haswww',
    type: 'boolean'
  }, {
    name: 'isHttps',
    type: 'boolean'
  }, {
    name: 'authkey',
    type: 'string'
  }, {
    name: 'googleAdClient',
    type: 'string'
  }, {
    name: 'googleAnalytics',
    type: 'string'
  }, {
    name: 'msValidator',
    type: 'string'
  }, {
    name: 'defMetaDesc',
    type: 'string'
  }, {
    name: 'defMetaKey',
    type: 'string'
  }, {
    name: 'lang',
    type: 'string'
  }]
};

CMS.defaults = () => {
  return {
    id: uuidv4.v4(),
    haswww: true,
    isHttps: false,
    googleAdClient: '',
    googleAnalytics: '',
    msValidator: '',
    defMetaDesc: '',
    defMetaKey: '',
    lang: ''
  };
};

CMS.isConfigured = false;

/**
 * Returns promise containing JSON object.
 * @param {string} path path of the json to read from
 */
CMS.readJSON = (path) => {
  return new Promise((res, rej) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        rej(err);
      } else {
        res(JSON.parse(data));
      }
    });
  });
};

/**
 * Writes json by stringifying it
 * Returns promise containing JSON object.
 * @param {string} path path of the json to write to
 * @param {Object} json JSON object to write
 */
CMS.writeJSON = (path, json) => {
  return new Promise((res, rej) => {
    fs.writeFile(path, JSON.stringify(json), (err) => {
      if (err) {
        rej(err);
      } else {
        res(json);
      }
    });
  });
};

CMS.readConfigJSONFIle = () => CMS.readJSON(SITE_JSON_PATH);

/**
 * Automatically configures site incase of memory failure.
 */
CMS.autoConfigure = () => {
  return new Promise((res, rej) => {
    CMS.readConfigJSONFIle().then((data) => {
      CMS._instance.set(data);
      CMS.isConfigured = true;
      res({ message: 'configured', siteinfo: CMS._instance.toJSON() });
      return data;
    }, (err) => {
      if (err.code == 'ENOENT') {
        res({ message: 'jsonfilenotpresent' });
        CMS.isConfigured = false;
        console.log('Site is not configured yet, needs to be configured');
      } else {
        CMS.isConfigured = false;
        rej(err);
      }
    });
  });
};

CMS._instance = new CMS();

CMS.getInstance = () => CMS._instance;

module.exports = { CMS };