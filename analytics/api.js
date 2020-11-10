const { Tracker, EventTypes, ActivityScore } = require('./main');
const { MongoDBManager } = require('mongo-driverify');
const BaseAPI = require('../express-base-api/api');
const Notification = require('../notification/main');
const { ErrorHandler } = require('./../error/main');

const AnalyticsAPI = function (app, prefix, collName) {
  BaseAPI.call(this, app, prefix, collName || AnalyticsAPI.COLLECTION_NAME);
};

AnalyticsAPI.COLLECTION_NAME = 'tracker';
AnalyticsAPI.API_URL = '/analytics';

AnalyticsAPI.prototype = Object.create(BaseAPI.prototype);
AnalyticsAPI.prototype.constructor = AnalyticsAPI;

AnalyticsAPI.prototype.setRoutes = function setRoutes() {
  const _this = this;

  const sessionDetailsURL = _this.urlPrefix + '/sessiondetails/:authtoken';
  console.log('GET ' + sessionDetailsURL);
  _this.app.get(sessionDetailsURL, _this.sessionDetailsHandler);

  const summaryURL = _this.urlPrefix + '/summary/:authtoken';
  console.log('GET ' + summaryURL);
  _this.app.get(summaryURL, _this.summaryHandler);

  const visitorsForURL = _this.urlPrefix + '/visitorsfordays/:days/:authtoken';
  console.log('GET ' + visitorsForURL);
  _this.app.get(visitorsForURL, _this.visitorInfoHandler);

  const activityForURL = _this.urlPrefix + '/activityfordays/:days/:authtoken';
  console.log('GET ' + activityForURL);
  _this.app.get(activityForURL, _this.activityInfoHandler);
};

AnalyticsAPI.prototype.sessionDetailsHandler = async function sessionDetailsHandler(request, response) {
  try {
    const auth = await BaseAPI.basicAuthentication(request, response);
    if (!auth) {
      response.status(401).send({ message: 'You are not authorized for this feature!' });
      return;
    }

    const dateObj = new Date();
    const month = dateObj.getUTCMonth() + 1; //months from 1-12
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();

    const date = year + "/" + month + "/" + day;

    const out = await MongoDBManager.getInstance().getDocumentsByProm(AnalyticsAPI.COLLECTION_NAME, {
      date
    });
    const respOut = {};
    respOut.sessions = {};
    let count = 0;
    let totalCount = 0;
    for (const tracker of out) {
      const sessionId = tracker.sessionid;
      if (!respOut.sessions[sessionId]) {
        respOut.sessions[sessionId] = {};
        respOut.sessions[sessionId].mainInfo = [];
        respOut.sessions[sessionId].commonInfo = {};
        respOut.sessions[sessionId].commonInfo.pageVisits = 0;
        respOut.sessions[sessionId].commonInfo.linksClicked = 0;
        respOut.sessions[sessionId].commonInfo.timespent = 0;
        respOut.sessions[sessionId].commonInfo.startTime = tracker.epochtime;
        respOut.sessions[sessionId].commonInfo.endTime = tracker.epochtime;
        count++;
      }
      delete tracker.sessionid;
      delete tracker._id;
      delete tracker.useragent;
      respOut.sessions[sessionId].mainInfo.push(tracker);
      if (tracker.type == EventTypes[EventTypes.PageView]) {
        respOut.sessions[sessionId].commonInfo.pageVisits++;
        totalCount++;
      } else if (tracker.type == EventTypes[EventTypes.LinkClicked]) {
        respOut.sessions[sessionId].commonInfo.linksClicked++;
        totalCount++;
      }

      if (respOut.sessions[sessionId].commonInfo.startTime > tracker.epochtime) {
        respOut.sessions[sessionId].commonInfo.startTime = tracker.epochtime;
      }

      if (respOut.sessions[sessionId].commonInfo.endTime < tracker.epochtime) {
        respOut.sessions[sessionId].commonInfo.endTime = tracker.epochtime;
      }

      respOut.sessions[sessionId].commonInfo.timespent = respOut.sessions[sessionId].commonInfo.endTime - respOut.sessions[sessionId].commonInfo.startTime;
    }
    respOut.count = count;
    respOut.totalCount = totalCount;
    response.status(200).send({ message: 'Success', data: respOut });
  } catch (err) {
    ErrorHandler.logError(err);
    response.status(500).send({ message: 'Unique visitor info get error', details: err.toString(), stack: err.stack });
  }
};

AnalyticsAPI.prototype.summaryHandler = async function summaryHandler(request, response) {
  try {
    const auth = await BaseAPI.basicAuthentication(request, response);
    if (!auth) {
      response.status(401).send({ message: 'You are not authorized for this feature!' });
      return;
    }

    const dateObj = new Date();
    const month = dateObj.getUTCMonth() + 1; //months from 1-12
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();

    const date = year + "/" + month + "/" + day;

    const out = await MongoDBManager.getInstance().getDocumentsByProm(AnalyticsAPI.COLLECTION_NAME, {
      date
    });
    const respOut = {};
    respOut.totalPageViews = 0;
    respOut.totalNewsLetterSubscribed = 0;
    respOut.totalContactUsSubmitted = 0;
    const sessionIds = {};
    const browsers = {};
    const ips = {};
    const urls = {};
    let countUnique = 0;
    for (const tracker of out) {
      if (tracker.type == EventTypes[EventTypes.PageView]) {
        respOut.totalPageViews++;
        if (!browsers[tracker.browser]) {
          browsers[tracker.browser] = 0;
        }
        browsers[tracker.browser] = browsers[tracker.browser] + 1;

        if (!urls[tracker.url]) {
          urls[tracker.url] = 0;
        }
        urls[tracker.url] = urls[tracker.url] + 1;
      } else if (tracker.type == EventTypes[EventTypes.NewsLetterSubscribed]) {
        respOut.totalNewsLetterSubscribed++;
      } else if (tracker.type == EventTypes[EventTypes.ContactUsSubmitted]) {
        respOut.totalContactUsSubmitted++;
      }
      sessionIds[tracker.sessionid] = true;

      if (!ips[tracker.ip]) {
        ips[tracker.ip] = 0;
      }
      ips[tracker.ip] = ips[tracker.ip] + 1;
    }

    for (let key in sessionIds) {
      if (sessionIds.hasOwnProperty(key)) {
        countUnique++;
      }
    }
    respOut.totalUniqueVisits = countUnique;

    let maxBrowserName = '';
    let currentBrowserCount = 0;
    for (let key in browsers) {
      if (browsers.hasOwnProperty(key)) {
        if (currentBrowserCount < browsers[key]) {
          currentBrowserCount = browsers[key];
          maxBrowserName = key;
        }
      }
    }
    respOut.hotBrowser = { name: maxBrowserName, count: currentBrowserCount };

    let maxIP = '';
    let currentIPCount = 0;
    for (let key in ips) {
      if (ips.hasOwnProperty(key)) {
        if (currentIPCount < ips[key]) {
          currentIPCount = ips[key];
          maxIP = key;
        }
      }
    }
    respOut.hotIP = { name: maxIP, count: currentIPCount };

    let maxURL = '';
    let currentURLCount = 0;
    for (let key in urls) {
      if (urls.hasOwnProperty(key)) {
        if (currentURLCount < urls[key]) {
          currentURLCount = urls[key];
          maxURL = key;
        }
      }
    }
    respOut.hotURL = { name: maxURL, count: currentURLCount };

    response.status(200).send({ message: 'Success', data: respOut });

  } catch (err) {
    ErrorHandler.logError(err);
    response.status(500).send({ message: 'Summary get error', details: err.toString(), stack: err.stack });
  }
};

AnalyticsAPI.prototype.visitorInfoHandler = async function visitorInfoHandler(request, response) {
  try {
    const auth = await BaseAPI.basicAuthentication(request, response);
    if (!auth) {
      response.status(401).send({ message: 'You are not authorized for this feature!' });
      return;
    }

    const days = request.params.days;
    const dateObj = new Date();
    const currentEpoch = parseInt((dateObj).getTime() / 1000);

    const epochBefore = dateObj.getTime() - (days * 24 * 60 * 60 * 1000);
    const dateBefore = new Date(epochBefore);
    const beforeEpoch = parseInt((dateBefore).getTime() / 1000);

    const respOut = {};
    const dates = {};
    const out = await MongoDBManager.getInstance().getDocumentsByProm(AnalyticsAPI.COLLECTION_NAME, {
      epochtime: { $lt: currentEpoch, $gt: beforeEpoch }
    });

    for (const track of out) {
      if (track.type == EventTypes[EventTypes.PageView]) {
        if (!dates[track.date]) {
          dates[track.date] = 0;
        }
        dates[track.date] = dates[track.date] + 1;
      }
    }

    response.status(200).send({ message: 'Success', data: dates });
  } catch (err) {
    ErrorHandler.logError(err);
    response.status(500).send({ message: 'Summary get error', details: err.toString(), stack: err.stack });
  }
};

AnalyticsAPI.prototype.activityInfoHandler = async function activityInfoHandler(request, response) {
  try {
    const auth = await BaseAPI.basicAuthentication(request, response);
    if (!auth) {
      response.status(401).send({ message: 'You are not authorized for this feature!' });
      return;
    }

    const days = request.params.days;
    const dateObj = new Date();
    const currentEpoch = parseInt((dateObj).getTime() / 1000);

    const epochBefore = dateObj.getTime() - (days * 24 * 60 * 60 * 1000);
    const dateBefore = new Date(epochBefore);
    const beforeEpoch = parseInt((dateBefore).getTime() / 1000);

    const dates = {};
    const out = await MongoDBManager.getInstance().getDocumentsByProm(AnalyticsAPI.COLLECTION_NAME, {
      epochtime: { $lt: currentEpoch, $gt: beforeEpoch }
    });

    for (const track of out) {
      if (!dates[track.date]) {
        dates[track.date] = 0;
      }
      dates[track.date] = dates[track.date] + ActivityScore[track.type];
    }

    response.status(200).send({ message: 'Success', data: dates });
  } catch (err) {
    ErrorHandler.logError(err);
    response.status(500).send({ message: 'Summary get error', details: err.toString(), stack: err.stack });
  }
};

module.exports = AnalyticsAPI;