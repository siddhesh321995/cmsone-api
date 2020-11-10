const { MongoDBManager } = require('mongo-driverify');
const BaseAPI = require('./../express-base-api/api');
const { ErrorHandler } = require('./../error/main');

var TrackerAPI = function TrackerAPI(app, prefix, collName) {
  BaseAPI.call(this, app, prefix, collName || TrackerAPI.COLLECTION_NAME);
};

TrackerAPI.COLLECTION_NAME = 'tracker';
TrackerAPI.API_URL = '/capture-it';

TrackerAPI.prototype = Object.create(BaseAPI.prototype);
TrackerAPI.prototype.constructor = TrackerAPI;

TrackerAPI.prototype.setRoutes = function setRoutes() {
  var _this = this;

  _this.app.post(_this.urlPrefix + '/capture-it', function (request, response) {
    try {
      const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
      request.body.ip = ip;
      _this.trackIt(request.body, function () {
        response.status(200).send({ message: 'event tracked' });
      }, function (resp) {
        response.status(500).send({ message: 'event tracking failed', details: resp });
      });

    } catch (err) {
      ErrorHandler.logError(err);
      response.status(500).send({ message: 'event tracking failed, an exception has occured', details: err.toString() });
    }
  });
};

TrackerAPI.prototype.trackIt = function trackIt(data, onSuccess, onFail) {
  const dateObj = new Date();
  const epochtime = parseInt((dateObj).getTime() / 1000);
  data.epochtime = epochtime;
  return MongoDBManager.getInstance().insertDoc(data, this.collName, onSuccess, onFail);
};

module.exports = TrackerAPI;