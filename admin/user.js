const uuidv4 = require('uuid');

class User {
  constructor(data) {
    if (data == void 0) { data = {}; }
    const dateObj = new Date();

    this.id = data.id || uuidv4.v4();
    this.fName = data.fName || null;
    this.lName = data.lName || null;
    this.email = data.email || null;
    this.contactno = data.contactno || null;
    this.pass = data.pass || null;
    this.salt = data.salt || null;
    this.createtime = data.createtime || parseInt((dateObj).getTime() / 1000);
    this.rolename = data.rolename || 'super';
    this.ssoclient = data.ssoclient || null;
    this.ssoid = data.ssoid || null;
    this.isActive = data.isActive || null;
  }

  validate() {
    if (!this.fName || !this.lName || !this.email || !this.pass) {
      return false;
    }
    return true;
  }

  toJSON(getPass = false) {
    var json = {};
    json.id = this.id;
    json.fName = this.fName;
    json.lName = this.lName;
    json.email = this.email;
    json.contactno = this.contactno;
    json.createtime = this.createtime;
    json.rolename = this.rolename;
    json.ssoclient = this.ssoclient;
    json.ssoid = this.ssoid;
    json.isActive = this.isActive;
    if (getPass) {
      json.pass = this.pass;
      json.salt = this.salt;
    }
    return json;
  }
}

module.exports = { User };