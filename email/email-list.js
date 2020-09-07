const fs = require('fs');
const EmailPromise = new Promise((res, rej) => {
  fs.readFile('emails.json', (err, data) => {
    if (err) {
      console.warn(err);
      rej(err);
    }
    let emails = JSON.parse(data);
    res(emails);
  });
});

module.exports = {
  EmailPromise
};