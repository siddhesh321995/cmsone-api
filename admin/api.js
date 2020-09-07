const { MongoDBManager } = require('./../db-manager/manager');
const BaseAPI = require('./../express-base-api/api');
const Notification = require('./../notification/main');
const { UserSession } = require('./usersession');
const { User } = require('./user');
const { ResetPassword } = require('./resetpassword');
const { ErrorHandler } = require('./../error/main');
const { sendEmailProm } = require('./../email/email');
const { CMS } = require('./../cms/main');
const { sessionCheck, USER_COLLECTION_NAME, USER_SESSION_COLLECTION_NAME } = require('./common');
const Emails = require('../email/email-list').EmailPromise;

const bcrypt = require('bcrypt');

const AdminAPI = function (app, prefix, collName) {
  BaseAPI.call(this, app, prefix, collName || AdminAPI.COLLECTION_NAME);
};

AdminAPI.COLLECTION_NAME = 'session';
AdminAPI.USER_SESSION_COLLECTION_NAME = USER_SESSION_COLLECTION_NAME;
AdminAPI.USER_COLLECTION_NAME = USER_COLLECTION_NAME;
AdminAPI.PASSWORD_RESET_COLLECTION_NAME = 'resetpassword';

AdminAPI.API_URL = '/session';
AdminAPI.TRACKER_API_URL = '/session';

AdminAPI.prototype = Object.create(BaseAPI.prototype);
AdminAPI.prototype.constructor = AdminAPI;

AdminAPI.prototype.setRoutes = function setRoutes() {
  const _this = this;

  const sessionCheckURL = _this.urlPrefix + '/sessioncheck';
  console.log('POST ' + sessionCheckURL);
  _this.app.post(sessionCheckURL, _this.sessionCheckHandler.bind(_this));

  const loginURL = _this.urlPrefix + '/login';
  console.log('POST ' + loginURL);
  _this.app.post(loginURL, _this.loginHandler.bind(_this));

  const registerURL = _this.urlPrefix + '/register';
  console.log('POST ' + registerURL);
  _this.app.post(registerURL, _this.registerHandler.bind(_this));

  const logoutURL = _this.urlPrefix + '/logout';
  console.log('POST ' + logoutURL);
  _this.app.post(logoutURL, _this.logoutHandler.bind(_this));

  const forgotPassURL = _this.urlPrefix + '/forgotpassword';
  console.log('POST ' + forgotPassURL);
  _this.app.post(forgotPassURL, BaseAPI.getGenericRouteHandler((req, resp) => {
    const email = req.body.email;
    return this.checkEmailAndSendEmail(email);
  }));

  const validateAndResetRequest = _this.urlPrefix + '/validateresetrequest';
  console.log('POST ' + validateAndResetRequest);
  _this.app.post(validateAndResetRequest, BaseAPI.getGenericRouteHandler(async (req, resp) => {
    const resetid = req.body.resetid;
    const dateObj = new Date();
    const currEpoch = parseInt((dateObj).getTime() / 1000);

    const out = await MongoDBManager.getInstance().getDocumentsByProm(AdminAPI.PASSWORD_RESET_COLLECTION_NAME, {
      id: resetid
    });

    if (!out.length) {
      return { status: 405, data: { message: 'Invalid link' } };
    }

    const resetData = new ResetPassword(out[0]);

    if (currEpoch - (60 * 5) > resetData.createtime) {
      return { status: 405, data: { message: 'Link has been expired' } };
    }

    if (!resetData.isActive) {
      return { status: 405, data: { message: 'Same password reset link cannot be used' } };
    }

    return { status: 200, data: { message: 'Request is valid' } };
  }));

  const validateRequest = _this.urlPrefix + '/resetpassword';
  console.log('POST ' + validateRequest);
  _this.app.post(validateRequest, BaseAPI.getGenericRouteHandler(async (req, resp) => {
    let pass = req.body.newpass;
    const resetid = req.body.resetid;
    const dateObj = new Date();
    const currEpoch = parseInt((dateObj).getTime() / 1000);

    const out = await MongoDBManager.getInstance().getDocumentsByProm(AdminAPI.PASSWORD_RESET_COLLECTION_NAME, {
      id: resetid
    });

    if (!out.length) {
      return { status: 405, data: { message: 'Invalid link' } };
    }

    const resetData = new ResetPassword(out[0]);

    if (currEpoch - (60 * 5) > resetData.createtime) {
      return { status: 405, data: { message: 'Link has been expired' } };
    }

    if (!resetData.isActive) {
      return { status: 405, data: { message: 'Same password reset link cannot be used' } };
    }

    pass = await hashPassword(pass);

    await MongoDBManager.getInstance().updateOneDocProm(AdminAPI.PASSWORD_RESET_COLLECTION_NAME, {
      id: resetid
    }, {
      $set: {
        isActive: false
      }
    });

    await MongoDBManager.getInstance().updateOneDocProm(AdminAPI.USER_COLLECTION_NAME, {
      email: resetData.email
    }, {
      $set: {
        pass
      }
    });

    const siteName = CMS.getInstance().sitename;
    const siteURL = CMS.getInstance().getFrontendURL();
    const emails = await Emails;

    sendEmailProm({
      from: emails.noreplyName + ' <' + emails.noreply + '>',
      sender: emails.noreplyName,
      to: resetData.email,
      subject: 'Your password has been reset for ' + siteName + ' account!',
      html: `
        <p>Hello,</p>
        <h3>Your password has been successfully reset for ${siteName} account!</h3>
        <p>If you have not requested to reset your password, please reach out to ${siteName} Engineers 
        or submit a request here on <a href="${siteURL}/contact">${siteName} contact us</a> page.
        <br/>
        Or you can reset your password from 
        <a href="${siteURL}/admin/password">here</a>
        </p>
        <p>Note: this is a system generated email.</p>
        <p>Regards,<br/>Team ${siteName}</p>
      `
    });

    return { status: 200, data: { message: 'Your password has been reset!' } };
  }));
};

AdminAPI.prototype.sessionCheckHandler = async function sessionCheckHandler(request, response) {
  sessionCheck(request, response);
};

AdminAPI.prototype.loginHandler = async function loginHandler(request, response) {
  try {
    const email = request.body.email;
    const password = request.body.password;
    const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    const output = await this.login(email, password, ip);

    response.status(output.status).send(output.data);
  } catch (err) {
    ErrorHandler.logError(err);
    response.status(500).send({ message: 'Error in login', details: err.toString(), stack: err.stack });
  }
};

AdminAPI.prototype.login = async function login(email, password, ip) {
  if (!email || !password) {
    //response.status(405).send({ message: 'Invalid input', errorCode: 1 });
    return { status: 405, data: { message: 'Invalid input', errorCode: 1 } };
  }

  const out = await MongoDBManager.getInstance().getDocumentsByProm(AdminAPI.USER_COLLECTION_NAME, {
    email: email
  });

  if (out.length == 0) {
    // response.status(405).send({ message: 'User does not exists', errorCode: 2 });
    return { status: 405, data: { message: 'User does not exists', errorCode: 2 } };
  }

  const userObj = new User(out[0]);
  const isSamePass = await isSame(password, userObj.pass);
  if (!isSamePass) {
    // response.status(405).send({ message: 'Wrong password', errorCode: 3 });
    return { status: 405, data: { message: 'Wrong password', errorCode: 3 } };
  }

  const userSessionObj = new UserSession({
    userid: userObj.id,
    ip: ip,
    isActive: true
  });

  await MongoDBManager.getInstance().insertDocProm(userSessionObj.toJSON(), AdminAPI.USER_SESSION_COLLECTION_NAME);
  return { status: 200, data: { message: 'Success', data: { sessionid: userSessionObj.id } } };
};

const hashPassword = async function (pass) {
  return new Promise((res, rej) => {
    if (!pass) {
      res('');
    }
    bcrypt.hash(pass, 10, (err, hash) => {
      if (err) {
        rej(err);
      } else {
        this.pass = hash;
        res(hash);
      }
    });
  });
};

const isSame = async (rawPass, encPass) => await bcrypt.compare(rawPass, encPass);

AdminAPI.prototype.registerHandler = async function registerHandler(request, response) {
  try {
    const email = request.body.email;
    const fName = request.body.fName;
    const lName = request.body.lName;
    let pass = request.body.password;

    const output = await this.register(email, fName, lName, pass);

    Notification.pushNotification({
      notificationType: Notification.NotificationType.UserRegistered,
      notificationData: {
        fName: request.body.fName,
        lName: request.body.lName,
        email: request.body.email
      }
    });

    response.status(output.status).send(output.data);
  } catch (err) {
    ErrorHandler.logError(err);
    response.status(500).send({ message: 'Error in user registration', details: err.toString(), stack: err.stack });
  }
};

AdminAPI.prototype.register = async function register(email, fName, lName, pass) {
  const out = await MongoDBManager.getInstance().getDocumentsByProm(AdminAPI.USER_COLLECTION_NAME, {
    email: email
  });
  if (out.length) {
    // response.status(405).send({ message: 'User already present or deleted', errorCode: 1 });
    return { status: 405, data: { message: 'User already present or deleted', errorCode: 1 } };
  }
  pass = await hashPassword(pass);
  const newUserObj = new User({
    fName,
    lName,
    email,
    pass,
    isActive: true
  });
  if (!newUserObj.validate()) {
    //response.status(405).send({ message: 'User data invalid', errorCode: 2 });
    return { status: 405, data: { message: 'User data invalid', errorCode: 2 } };
  }

  await MongoDBManager.getInstance().insertDocProm(newUserObj.toJSON(true), AdminAPI.USER_COLLECTION_NAME);

  // response.status(200).send({ message: 'Success', data: {} });
  return { status: 200, data: { message: 'Success', data: {} } };
};

AdminAPI.prototype.logoutHandler = async function logoutHandler(request, response) {
  try {
    const usersessionid = request.body.usersessionid;

    const output = await this.logout(usersessionid);

    response.status(output.status).send(output.data);
  } catch (err) {
    ErrorHandler.logError(err);
    response.status(500).send({ message: 'Error in logout', details: err.toString(), stack: err.stack });
  }
};

AdminAPI.prototype.logout = async function logout(usersessionid) {

  const dateObj = new Date();
  const endtime = parseInt((dateObj).getTime() / 1000);
  const out = await MongoDBManager.getInstance().updateOneDocProm(AdminAPI.USER_SESSION_COLLECTION_NAME, {
    id: usersessionid
  }, { $set: { isActive: false, endtime: endtime } });

  return { status: 200, data: {} };
};

AdminAPI.prototype.checkEmailAndSendEmail = async function checkEmailAndSendEmail(email) {
  const out = await MongoDBManager.getInstance().getDocumentsByProm(AdminAPI.USER_COLLECTION_NAME, {
    email
  });

  const user = new User(out[0]);

  if (!out.length) {
    return { status: 405, data: { message: 'Invalid email input' } };
  }

  const inRec = await MongoDBManager.getInstance().insertDocProm(new ResetPassword({
    email
  }), AdminAPI.PASSWORD_RESET_COLLECTION_NAME);

  const siteName = CMS.getInstance().sitename;
  const siteURL = CMS.getInstance().getFrontendURL();
  const emails = await Emails;

  await sendEmailProm({
    from: emails.noreplyName + ' <' + emails.noreply + '>',
    sender: emails.noreplyName,
    to: email,
    subject: 'Reset your password for ' + siteName + ' account',
    html: `
      <p>Hi ${user.fName},</p>
      <h3>Reset your password here</h3>
      <p>
      It seems you have requested to reset your password.
      <br/>
      <a href="${siteURL}/admin/request?type=resetpassword&resetid=${inRec.doc.id}">Click here</a> to create a new password
      for your account and secure your acount.
      </p>
      <p>If you have not requested to generate your password, please reach out to ${siteName} Engineers 
      or submit a request here on <a href="${siteURL}/contact">${siteName} contact us</a> page.
      <br/>
      If you feel unsafe reset your password from 
      <a href="${siteURL}/admin/request?type=resetpassword&resetid=${inRec.doc.id}">here</a> 
      nonetheless to secure your acount.
      </p>
      <p>Note: This link will expire in 5 min after it has been generated.</p>
      <p>Note: this is a system generated email.</p>
      <p>Regards,<br/>Team ${siteName}</p>
    `
  });

  return { status: 200, data: { message: 'We have sent an email, please check' } };
};

module.exports = AdminAPI;