const EnumGenerator = function EnumGenerator(attr) {
  for (var key in attr) {
    if (attr.hasOwnProperty(key)) {
      attr[attr[key]] = key;
    }
  }
  return attr;
};

const EventTypes = EnumGenerator({
  IgnorePageViewEvent: 0,
  Login: 1,
  Logout: 2,
  PageView: 3,
  ContactUsSubmitted: 4,
  ProductListingPageVisited: 5,
  ProductPageVisited: 6,
  LinkClicked: 7,
  NewsLetterSubscribed: 8,
  ReviewSubmitted: 9
});

const ActivityScore = {
  IgnorePageViewEvent: 0,
  Login: 0,
  Logout: 0,
  PageView: 1,
  ContactUsSubmitted: 5,
  ProductListingPageVisited: 2,
  ProductPageVisited: 2,
  LinkClicked: 2,
  NewsLetterSubscribed: 5,
  ReviewSubmitted: 5
};

class Tracker {
  constructor(data) {
    this.platform = data.platform;
    this.type = data.data;
    this.url = data.url;
    this.route = data.route;
    this.timestamp = data.timestamp;
    this.epochtime = data.epochtime;
    this.date = data.date;
    this.time = data.time;
    this.geoloc = data.geoloc;
    this.useragent = data.useragent;
    this.browser = data.browser;
    this.reso = data.reso;
    this.sessionid = data.sessionid;
    this.userid = data.userid;
    this.skuid = data.skuid;
    this.pageno = data.pageno;
    this.ip = data.ip;
    this.resourceid = data.resourceid;
  }

  toJSON() {
    var json = {};
    json.platform = this.platform;
    json.type = this.this;
    json.url = this.url;
    json.route = this.route;
    json.timestamp = this.timestamp;
    json.epochtime = this.epochtime;
    json.date = this.date;
    json.time = this.time;
    json.geoloc = this.geoloc;
    json.useragent = this.useragent;
    json.browser = this.browser;
    json.reso = this.reso;
    json.sessionid = this.sessionid;
    json.userid = this.userid;
    json.skuid = this.skuid;
    json.pageno = this.pageno;
    json.ip = this.ip;
    json.resourceid = this.resourceid;
    return json;
  }
}

module.exports = { Tracker, EventTypes, ActivityScore };