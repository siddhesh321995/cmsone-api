const { MongoDBManager } = require('mongo-driverify');
const { ErrorHandler } = require('./../error/main');
const { quicklyCheckMySession } = require('./../admin/common');
const { getCurrentEpochTime } = require('node-utilify');


/**
 * @typedef {{isBasicAuth:boolean;resolver:(data)=>void,authGaurd:()=>Promise<any>}} ConfigSettings
 */

/**
 * @typedef {{get?:ConfigSettings;post?:ConfigSettings;put?:ConfigSettings;delete?:ConfigSettings}} BaseAPIConfig
 */

/**
 * Class for Base API
 * @param {Object} app Express app
 * @param {string} prefix URL Prefix for your api
 * @param {string} collName Default mongo db collection name
 * @param {Object} handlerClass Main class entity
 * @param {BaseAPIConfig} config API Config
 */
var BaseAPI = function BaseAPI(app, prefix, collName, handlerClass, config = {}) {
  this.app = app;
  this.urlPrefix = prefix || "";
  this.collName = collName || "";
  this.handlerClass = handlerClass;
  this.config = config;

  this.setRoutes();
  this.setMongoRoutes();

  if (this.handlerClass) {
    this.setBasicRoutes();
  }
};

BaseAPI._isMongoRoutesSet = false;

BaseAPI.prototype.setRoutes = function setRoutes() {

};

BaseAPI.prototype.setMongoRoutes = function setRoutes() {
  const _this = this;

  if (!BaseAPI._isMongoRoutesSet) {
    BaseAPI._isMongoRoutesSet = true;
    const collMongo = '/admin/collection';
    console.log('POST ' + collMongo);
    _this.app.post(collMongo, async (request, response) => {
      const page = Number(request.body.page);
      const max = Number(request.body.max);
      const find = request.body.find;
      const sort = request.body.sort;
      const collectionName = request.body.collectionName;
      const skip = (page - 1) * max;
      try {
        const out = await MongoDBManager.getInstance().getDocumentsParamProm(collectionName, {
          limit: max,
          skip: skip,
          query: find,
          sort: sort
        });
        response.status(200).send({ message: 'Success', data: out });
      } catch (err) {
        ErrorHandler.logError(err);
        response.status(500).send({ message: 'Tracker data get error', details: err.toString() });
      }
    });

    const collDistMongo = '/admin/collection/dist';
    console.log('POST ' + collDistMongo);
    _this.app.post(collDistMongo, async (request, response) => {
      try {
        const page = Number(request.body.page);
        const max = Number(request.body.max);
        const skip = (page - 1) * max;
        const dist = request.body.dist;
        const collectionName = request.body.collectionName;

        let out = await MongoDBManager.getInstance().getDistinctDocumentsProm(collectionName, {
          distinct: {
            propName: dist
          }
        });
        out = out.splice(skip, max);

        response.status(200).send({ message: 'Success', data: out });
      } catch (err) {
        ErrorHandler.logError(err);
        response.status(500).send({ message: 'Tracker data get error', details: err.toString() });
      }
    });
  }
};

/**
 * Returns function wraped in nice try catch block
 * @param {(req:Object,resp:Object)=>Promise<{status:number;data:any}>} callback executable safe function, should return {status:number;data:any}
 * @param {string} errorMsg Optional, Error message
 * @param {number} severity Optional, Severity of error, based on which actions will be taken
 * @param {{isBasicAuth?:boolean}} config Optional config, has props like basic authentication
 */
BaseAPI.getGenericRouteHandler = (callback, errorMsg = 'Runtime error occured', severity = 2, config = {}) => {
  return async (req, resp) => {
    try {
      if (config.isBasicAuth == true) {
        const authOut = await BaseAPI.basicAuthentication(req, resp);
        if (!authOut) {
          resp.status(401).send({ message: 'You are not authorized for this!' });
          return;
        }
      }

      const { status, data } = await callback(req, resp);
      resp.status(status).send(data);
    } catch (err) {
      ErrorHandler.logError(err, { severity: severity });
      resp.status(500).send({ message: err.toString(), details: err.stack });
    }
  };
};

BaseAPI.basicAuthentication = async (req, resp) => {
  const usersessionid = req.body.usersessionid || req.params.usersessionid || req.body.authtoken || req.params.authtoken;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const { status, data } = await quicklyCheckMySession(usersessionid, ip);
  return !!(status == 200);
};

BaseAPI.cleanObj = (obj) => {
  const json = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (obj[key] != void 0) {
        json[key] = obj[key];
      }
    }
  }
  return json;
};

BaseAPI.getPKey = (classVar) => {
  let key = 'id';
  for (const prop of classVar.SCHEMA.properties) {
    if (prop.isPrimaryKey == true) {
      key = prop.name;
      break;
    }
  }
  return key;
};

BaseAPI.getSoftDeleteKey = (classVar) => {
  let key;
  for (const prop of classVar.SCHEMA.properties) {
    if (prop.isSoftDeleteKey == true) {
      key = prop.name;
      break;
    }
  }
  return key;
};

BaseAPI.getValidProps = (classVar, data, withoutPKey = false) => {
  const pkey = BaseAPI.getPKey(classVar);
  const json = {};
  for (const prop of classVar.SCHEMA.properties) {
    if (prop.name == pkey && withoutPKey) {
      continue;
    }
    if (data[prop.name] != void 0) {
      json[prop.name] = data[prop.name];
    }
  }
  return json;
};

BaseAPI.keyGetter = (keyName) => {
  return (classVar) => {
    let key = null;
    for (const prop of classVar.SCHEMA.properties) {
      if (prop[keyName] == true) {
        key = prop.name;
        break;
      }
    }
    return key;
  };
};

BaseAPI.propGetter = (keyName) => {
  return (classVar) => {
    let key = null;
    for (const prop of classVar.SCHEMA.properties) {
      if (prop[keyName] == true) {
        key = prop;
        break;
      }
    }
    return key;
  };
};

BaseAPI.getCreatedDateKey = BaseAPI.keyGetter('isCreatedDate');
BaseAPI.getLastModifiedDateKey = BaseAPI.keyGetter('isLastModifiedDate');

BaseAPI.getCreatedDateProp = BaseAPI.propGetter('isCreatedDate');
BaseAPI.getLastModifiedDateProp = BaseAPI.propGetter('isLastModifiedDate');

/**
 * Fetches records from database as per given query.
 * @param {boolean} bypassAuth Bypasses authentication checks.
 * @param {Object} query Database query object.
 * @param {Object} req Express request object.
 * @param {Object} resp Express response object.
 * @returns {{status:200|405|401|500;data:{message?:string;}}} Returns object with http status and data object.
 */
BaseAPI.prototype.get = async function (bypassAuth, query, req, resp) {
  if (bypassAuth == void 0) { bypassAuth = false; }
  if (query == void 0) { query = {}; }

  if (bypassAuth == false) {
    if (this.config && this.config.get && this.config.get.authGaurd) {
      const authOut = await this.config.get.authGaurd(req, resp);
      if (!authOut) {
        return { status: 401, data: { message: 'You are not authorized for this!' } };
      }
    }

    if (this.config && this.config.get && this.config.get.isBasicAuth) {
      const authOut = await BaseAPI.basicAuthentication(req, resp);
      if (!authOut) {
        return { status: 401, data: { message: 'You are not authorized for this!' } };
      }
    }
  }

  const out = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, query);
  const items = [];
  for (const currItem of out) {
    items.push(new this.handlerClass(currItem).toJSON());
  }

  if (this.config && this.config.get && typeof this.config.get.resolver == 'function') {
    this.config.get.resolver(items);
  }

  return { status: 200, data: items };
};

/**
 * Updates records from database as per given query.
 * @param {boolean} bypassAuth Bypasses authentication checks.
 * @param {Object} req Express request object.
 * @param {Object} resp Express response object.
 * @returns {{status:200|405|401|500;data:{message?:string;}}} Returns object with http status and data object.
 */
BaseAPI.prototype.post = async function (bypassAuth, req, resp) {
  if (bypassAuth == void 0) { bypassAuth = false; }

  if (bypassAuth == false) {
    if (this.config && this.config.post && this.config.post.authGaurd) {
      const authOut = await this.config.get.authGaurd(req, resp);
      if (!authOut) {
        return { status: 401, data: { message: 'You are not authorized for this!' } };
      }
    }

    if (this.config && this.config.post && this.config.post.isBasicAuth) {
      const authOut = await BaseAPI.basicAuthentication(req, resp);
      if (!authOut) {
        return { status: 401, data: { message: 'You are not authorized for this!' } };
      }
    }
  }

  const query = {};
  const pkeyName = BaseAPI.getPKey(this.handlerClass);
  query[pkeyName] = req.body[pkeyName];

  const exists = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, query);
  if (exists.length == 0) {
    return { status: 404, data: { message: 'Not found' } };
  }

  const cleanInst = BaseAPI.getValidProps(this.handlerClass, req.body, true);

  const mDateKey = BaseAPI.getLastModifiedDateProp(this.handlerClass);
  if (mDateKey && mDateKey.type == 'epoch') {
    cleanInst[mDateKey.name] = getCurrentEpochTime();
  }

  await MongoDBManager.getInstance().updateOneDocProm(this.collName, query, {
    $set: cleanInst
  });

  if (this.config && this.config.post && typeof this.config.post.resolver == 'function') {
    this.config.post.resolver(items);
  }

  return { status: 200, data: { message: 'Item was succesfully updated' } };
};

/**
 * Soft/Hard deletes matched one record from database based on query.
 * @param {boolean} bypassAuth Bypasses authentication checks.
 * @param {Object} req Express request object.
 * @param {Object} resp Express response object.
 * @returns {{status:200|405|401|500;data:{message?:string;}}} Returns object with http status and data object.
 */
BaseAPI.prototype.delete = async function (bypassAuth, req, resp) {
  if (bypassAuth == void 0) { bypassAuth = false; }

  if (bypassAuth == false) {
    if (this.config && this.config.delete && this.config.delete.authGaurd) {
      const authOut = await this.config.delete.authGaurd(req, resp);
      if (!authOut) {
        return { status: 401, data: { message: 'You are not authorized for this!' } };
      }
    }

    if (this.config && this.config.delete && this.config.delete.isBasicAuth) {
      const authOut = await BaseAPI.basicAuthentication(req, resp);
      if (!authOut) {
        return { status: 401, data: { message: 'You are not authorized for this!' } };
      }
    }
  }

  const pkey = BaseAPI.getPKey(this.handlerClass);
  const query = {};
  query[pkey] = req.body[pkey];
  const softDelKey = BaseAPI.getSoftDeleteKey(this.handlerClass);
  if (softDelKey) {
    const newVal = {};
    newVal[softDelKey] = false;
    await MongoDBManager.getInstance().updateOneDocProm(this.collName, query, { $set: newVal });
  } else {
    await MongoDBManager.getInstance().deleteOneDocProm(this.collName, query);
  }
  if (this.config && this.config.delete && typeof this.config.delete.resolver == 'function') {
    this.config.delete.resolver('Item deleted successfully');
  }
  return { status: 200, data: { message: 'Item deleted successfully' } };
};

/**
 * Inserts or Updates existing record based on matched query.
 * @param {boolean} bypassAuth Bypasses authentication checks.
 * @param {Object} req Express request object.
 * @param {Object} resp Express response object.
 * @returns {{status:200|405|401|500;data:{message?:string;}}} Returns object with http status and data object.
 */
BaseAPI.prototype.put = async function (bypassAuth, req, resp) {
  if (bypassAuth == void 0) { bypassAuth = false; }
  if (bypassAuth == false) {
    if (this.config && this.config.put && this.config.put.authGaurd) {
      const authOut = await this.config.put.authGaurd(req, resp);
      if (!authOut) {
        return { status: 401, data: { message: 'You are not authorized for this!' } };
      }
    }

    if (this.config && this.config.put && this.config.put.isBasicAuth) {
      const authOut = await BaseAPI.basicAuthentication(req, resp);
      if (!authOut) {
        return { status: 401, data: { message: 'You are not authorized for this!' } };
      }
    }
  }

  const item = new this.handlerClass(req.body);
  let isValid = true;
  if (typeof item.isValid == 'function') {
    isValid = item.isValid();
  }
  if (!isValid) {
    return { status: 405, data: { message: 'Invalid input, please provide all details' } };
  }

  const pkey = BaseAPI.getPKey(this.handlerClass);
  if (pkey) {
    const getQuery = {};
    getQuery[pkey] = req.body[pkey];
    const getOut = await MongoDBManager.getInstance().getDocumentsByProm(this.collName, getQuery);

    if (getOut.length) {
      return await this.post(true, req, resp);
    }
  }

  const retData = item.toJSON();

  const cDateKey = BaseAPI.getCreatedDateProp(this.handlerClass);
  if (cDateKey && cDateKey.type == 'epoch') {
    retData[cDateKey.name] = getCurrentEpochTime();
  }

  await MongoDBManager.getInstance().insertDocProm(retData, this.collName);

  if (this.config && this.config.put && typeof this.config.put.resolver == 'function') {
    this.config.put.resolver(retData);
  }

  return { status: 200, data: retData };
};

/**
 * Sets basic routes like get, post, put and delete.
 */
BaseAPI.prototype.setBasicRoutes = function setBasicRoutes() {
  if (this.config && this.config.put) {
    console.log('PUT ' + this.urlPrefix);
    this.app.put(this.urlPrefix, BaseAPI.getGenericRouteHandler(this.put.bind(this, false)));
  }

  if (this.config && this.config.get) {
    let getURL = this.urlPrefix;
    if (this.config && this.config.get && this.config.get.isBasicAuth) {
      getURL += '/:authtoken';
    }
    console.log('GET ' + getURL);
    this.app.get(getURL, BaseAPI.getGenericRouteHandler(this.get.bind(this, false, {})));
  }

  if (this.config && this.config.post) {
    console.log('POST ' + this.urlPrefix);
    this.app.post(this.urlPrefix, BaseAPI.getGenericRouteHandler(this.post.bind(this, false)));
  }

  if (this.config && this.config.delete) {
    console.log('DELETE ' + this.urlPrefix);
    this.app.delete(this.urlPrefix, BaseAPI.getGenericRouteHandler(this.delete.bind(this, false)));
  }
};

BaseAPI.COLLECTION_NAME = 'avara';
BaseAPI.API_URL = '/';

module.exports = BaseAPI;
