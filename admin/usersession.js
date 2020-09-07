const uuidv4 = require('uuid');

class UserSession {
  constructor(data) {
    if (data == void 0) { data = {}; }

    const dateObj = new Date();
    this.id = data.id || uuidv4.v4();
    this.starttime = data.starttime || parseInt((dateObj).getTime() / 1000);
    this.endtime = data.endtime || null;
    this.userid = data.userid;
    this.ip = data.ip || null;
    this.isActive = data.isActive;
  }

  toJSON() {
    var json = {};
    json.id = this.id;
    json.starttime = this.starttime;
    json.endtime = this.endtime;
    json.userid = this.userid;
    json.ip = this.ip;
    json.isActive = this.isActive;
    return json;
  }
}

module.exports = { UserSession };