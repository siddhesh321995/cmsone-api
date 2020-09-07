const nodemailer = require('nodemailer');
let transporter;

/**
 * @typedef {{user:string;pass:string}} EmailConfigureAttribute
 */

/**
 * @typedef {{to:string|Array<string>;subject:string;html:string}} MailOptions
 */

/**
 * Configures email with username, password. Currenly gmail service is being used.
 * @param {EmailConfigureAttribute} attr Attrubites for configuration
 */
const configuerEmail = (attr) => {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: attr.user,
      pass: attr.pass
    }
  });
};

/**
 * Sends an email with config * 
 * @param {MailOptions} mailOptions {to,subject,html}
 * @param {Function} onSuccess callback function
 * @param {Function} onFail callback function
 */
const sendMail = (mailOptions, onSuccess, onFail) => {
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      typeof onFail == 'function' && onFail(error);
    } else {
      typeof onSuccess == 'function' && onSuccess(info);
    }
  });
};

/**
 * Sends an email with config * 
 * @param {MailOptions} mailOptions {to,subject,html}
 * @returns {Promise<any>} Returns email promise
 */
const sendEmailProm = (mailOptions) => {
  return new Promise((res, rej) => {
    sendMail(mailOptions, res, rej);
  });
};

module.exports = {
  sendMail,
  configuerEmail,
  sendEmailProm
};
