const { MongoDBManager } = require('mongo-driverify');
const { NotificationType, pushNotification } = require('./../notification/main');

class LogType {
}

LogType.INFO = 0;
LogType.WARN = 1;
LogType.ERROR = 2;

class Log {
  constructor(data = {}) {
    const dateObj = new Date();
    const epochtime = parseInt((dateObj).getTime() / 1000);

    this.createdtime = data.createdtime || epochtime;
    this.logmessage = data.logmessage || '';
    this.logstack = data.logstack || '';
    this.type = data.type || LogType.INFO;
    this.severity = data.severity || 0; // 0 to 9
  }

  toJSON() {
    const json = {};
    json.createdtime = this.createdtime;
    json.logmessage = this.logmessage;
    json.logstack = this.logstack;
    json.type = this.type;
    json.severity = this.severity;
    return json;
  }
}

class ErrorHandler {

}

const LOGS_COLLECTION_NAME = 'logs';

/**
 * Pushed one doc for error handling
 * @param {Error} err Error object
 * @param {{severity?:number}} opts contains options like severity (0 - 9), by default it is 2 for error.
 */
ErrorHandler.logError = (err, opts = {}) => {
  if (opts.severity == void 0) { opts.severity = 2; }
  const data = {
    logmessage: err.toString(),
    logstack: err.stack,
    type: LogType.ERROR,
    severity: opts.severity
  };
  if (opts.severity > 4) {
    pushNotification({
      notificationType: NotificationType.HighSeverityErrorOccured,
      notificationData: data
    });
  }
  return MongoDBManager.getInstance().insertDocProm(new Log(data).toJSON(), LOGS_COLLECTION_NAME);
};

module.exports = { ErrorHandler, LogType };