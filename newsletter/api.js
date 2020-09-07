const { NewsLetter } = require('./main');
const { MongoDBManager } = require('../db-manager/manager');
const BaseAPI = require('../express-base-api/api');
const Notification = require('../notification/main');
const { ErrorHandler } = require('./../error/main');

const NewsLetterAPI = function (app, prefix, collName) {
  BaseAPI.call(this, app, prefix, collName || NewsLetterAPI.COLLECTION_NAME);
};

NewsLetterAPI.COLLECTION_NAME = 'newsletter';
NewsLetterAPI.API_URL = '/newsletter';

NewsLetterAPI.prototype = Object.create(BaseAPI.prototype);
NewsLetterAPI.prototype.constructor = NewsLetterAPI;

NewsLetterAPI.prototype.setRoutes = function setRoutes() {
  const base = this.urlPrefix;
  console.log('PUT ' + base);
  this.app.put(base, BaseAPI.getGenericRouteHandler(async (request, response) => {
    const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    request.body.ip = ip;
    let data = await NewsLetterAPI.put(request.body);
    data = new NewsLetter(data.doc).toJSON();
    Notification.pushNotification({
      notificationType: Notification.NotificationType.NewLetterSubscriber,
      notificationData: {
        email: request.body.email
      }
    });
    return { status: 200, data };
  }, 'Error subscribing news letters', 5));

  const getNewLetters = base + '/:authtoken';
  console.log('GET ' + getNewLetters);
  this.app.get(getNewLetters, BaseAPI.getGenericRouteHandler(async (req, resp) => {
    const auth = await BaseAPI.basicAuthentication(req, resp);
    if (!auth) {
      return { status: 401, data: { message: 'You are not authorized for this feature!' } };
    }
    const newsLetterEmails = await NewsLetterAPI.get();
    return { status: 200, data: newsLetterEmails };
  }, 'Error fetching news letters'));
};

NewsLetterAPI.put = function put(data) {
  const item = new NewsLetter(data);
  return MongoDBManager.getInstance().insertDocProm(item.toJSON(), NewsLetterAPI.COLLECTION_NAME);
};

NewsLetterAPI.get = async function () {
  const out = await MongoDBManager.getInstance().getDocumentsByProm(NewsLetterAPI.COLLECTION_NAME, {});
  const newsLetterEmails = [];

  for (const email of out) {
    newsLetterEmails.push(new NewsLetter(email).toJSON());
  }

  return newsLetterEmails;
};

module.exports = NewsLetterAPI;