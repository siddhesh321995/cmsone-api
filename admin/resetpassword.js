const uuidv4 = require('uuid');

class ResetPassword {
  constructor(data) {
    if (data == void 0) { data = {}; }
    if (data.isActive == void 0) { data.isActive = true; }
    const dateObj = new Date();

    this.id = data.id || uuidv4.v4();
    this.email = data.email || null;
    this.createtime = data.createtime || parseInt((dateObj).getTime() / 1000);
    this.isActive = data.isActive;
  }

  toJSON() {
    var json = {};
    json.id = this.id;
    json.email = this.email;
    json.createtime = this.createtime;
    json.isActive = this.isActive;
    return json;
  }
}

module.exports = { ResetPassword };