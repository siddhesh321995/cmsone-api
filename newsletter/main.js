class NewsLetter {
  constructor(data) {
    this.email = data.email;
    this.createdepochtime = data.createdepochtime;
    this.isactive = data.isactive || true;
    this.sessionid = data.sessionid;
    this.ip = data.ip;
  }

  toJSON() {
    var json = {};
    json.email = this.email;
    json.createdepochtime = this.createdepochtime;
    json.isactive = this.isactive;
    json.sessionid = this.sessionid;
    json.ip = this.ip;
    return json;
  }
}

module.exports = { NewsLetter };