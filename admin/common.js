const { MongoDBManager } = require('mongo-driverify');
const { UserSession } = require('./usersession');
const { User } = require('./user');

const USER_SESSION_COLLECTION_NAME = 'usersession';
const USER_COLLECTION_NAME = 'user';

const sessionCheck = async (request, response) => {
  try {
    const usersessionid = request.body.usersessionid;
    const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    const output = await checkMySession(usersessionid, ip);
    response.status(output.status).send(output.data);
  } catch (err) {
    ErrorHandler.logError(err);
    response.status(500).send({ message: 'Error in session check', details: err.toString(), stack: err.stack });
  }
};

const checkMySession = async (usersessionid, ip) => {
  const out = await MongoDBManager.getInstance().getDocumentsByProm(USER_SESSION_COLLECTION_NAME, {
    id: usersessionid
  });
  if (out.length == 0) {
    return { status: 401, data: { message: 'No session found', errorCode: 1 } };
  }
  const sessionObj = new UserSession(out[0]);
  if (!sessionObj.isActive) {
    return { status: 401, data: { message: 'Session has been expired', errorCode: 2 } };
  }
  if (sessionObj.ip != ip) {
    const dateObj = new Date();
    const endtime = parseInt((dateObj).getTime() / 1000);
    MongoDBManager.getInstance().updateOneDocProm(USER_SESSION_COLLECTION_NAME, {
      id: usersessionid
    }, { $set: { isActive: false, endtime: endtime } });

    return { status: 401, data: { message: 'Network has been changed', errorCode: 3 } };
  }

  const dateObj1 = new Date();
  const endtime1 = parseInt((dateObj1).getTime() / 1000);
  if ((sessionObj.starttime + (60 * 60 * 24)) < endtime1) {
    MongoDBManager.getInstance().updateOneDocProm(USER_SESSION_COLLECTION_NAME, {
      id: usersessionid
    }, { $set: { isActive: false, endtime: endtime1 } });

    return { status: 401, data: { message: 'Session has been expired', errorCode: 2 } };
  }

  const userOut = await MongoDBManager.getInstance().getDocumentsByProm(USER_COLLECTION_NAME, {
    id: sessionObj.userid
  });

  if (userOut.length == 0) {
    return { status: 401, data: { message: 'User information is corrupted', errorCode: 4 } };
  }

  const userObj = new User(userOut[0]);

  return { status: 200, data: { message: 'Success', user: userObj.toJSON() } };
};

const quicklyCheckMySession = async (usersessionid, ip) => {
  const out = await MongoDBManager.getInstance().getDocumentsByProm(USER_SESSION_COLLECTION_NAME, {
    id: usersessionid
  });
  if (out.length == 0) {
    return { status: 401, data: { message: 'No session found', errorCode: 1 } };
  }
  const sessionObj = new UserSession(out[0]);
  if (!sessionObj.isActive) {
    return { status: 401, data: { message: 'Session has been expired', errorCode: 2 } };
  }
  if (sessionObj.ip != ip) {
    return { status: 401, data: { message: 'Network has been changed', errorCode: 3 } };
  }

  const dateObj1 = new Date();
  const endtime1 = parseInt((dateObj1).getTime() / 1000);
  if ((sessionObj.starttime + (60 * 60 * 24)) < endtime1) {
    MongoDBManager.getInstance().updateOneDocProm(USER_SESSION_COLLECTION_NAME, {
      id: usersessionid
    }, { $set: { isActive: false, endtime: endtime1 } });

    return { status: 401, data: { message: 'Session has been expired', errorCode: 2 } };
  }

  return { status: 200, data: true };
};

module.exports = { sessionCheck, checkMySession, quicklyCheckMySession, USER_SESSION_COLLECTION_NAME, USER_COLLECTION_NAME };