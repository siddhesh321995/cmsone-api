const envs = {
  production: {
    MONGODB_CONNECTION: 'mongodb+srv://XXXX:XXXX@XXXX-7tde3.mongodb.net/XXXX',
    HAS_CERT: false,
    DATABASE_NAME: 'cmsone',
    EMAILID: 'XXX@gmail.com',
    EMAIL_PASSWORD: 'QWERTY'
  },
  local: {
    MONGODB_CONNECTION: 'mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false',
    HAS_CERT: false,
    DATABASE_NAME: 'cmsone',
    EMAILID: 'XXX@gmail.com',
    EMAIL_PASSWORD: 'QWERTY'
  },
  stage: {
    MONGODB_CONNECTION: 'mongodb+srv://XXXX:XXXX@XXXX-7tde3.mongodb.net/XXXX',
    HAS_CERT: false,
    DATABASE_NAME: 'cmsone',
    EMAILID: 'XXX@gmail.com',
    EMAIL_PASSWORD: 'QWERTY'
  }
};

/**
 * Sets up application using command line arguments.
 * Default NODE_ENV is production
 */
const setupApp = () => {
  for (var i = 0; i < process.argv.length; i++) {
    var currArg = process.argv[i];
    if (currArg.indexOf('=') != -1) {
      var split = currArg.split('=');
      process.env[split[0]] = split[1];
    }
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }
};

module.exports = { envs: envs, setup: setupApp };