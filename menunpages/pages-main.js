const uuidv4 = require('uuid');

class Pages {
  constructor(data = {}) {
    const dateObj = new Date();
    data = Object.assign({}, Pages.defaults(), data);

    this.id = data.id;
    this.name = data.name;
    this.desc = data.desc;

    this.urlfrdnlyname = data.urlfrdnlyname;
    this.completeurl = data.completeurl;

    this.folderid = data.folderid;

    this.metaKeyword = data.metaKeyword;
    this.metaDesc = data.metaDesc;

    this.createtime = data.createtime;
    this.createdby = data.createdby;
    this.lastmodifiedtime = data.lastmodifiedtime;
    this.lastmodifiedby = data.lastmodifiedby;

    this.isActive = data.isActive;
  }

  toJSON() {
    const json = {};

    json.id = this.id;
    json.name = this.name;
    json.desc = this.desc;

    json.urlfrdnlyname = this.urlfrdnlyname;
    json.completeurl = this.completeurl;

    json.folderid = this.folderid;

    json.metaKeyword = this.metaKeyword;
    json.metaDesc = this.metaDesc;

    json.createtime = this.createtime;
    json.createdby = this.createdby;
    json.lastmodifiedtime = this.lastmodifiedtime;
    json.lastmodifiedby = this.lastmodifiedby;

    json.isActive = this.isActive;

    return json;
  }

  isValid() {
    if ((!this.id && !this.folderid) || !this.name || !this.urlfrdnlyname) {
      return false;
    }
    return true;
  }
}

Pages.defaults = (data = {}) => {
  const dateObj = new Date();
  return {
    id: uuidv4.v4(),
    createtime: parseInt((dateObj).getTime() / 1000),
    lastmodifiedtime: parseInt((dateObj).getTime() / 1000),
    isActive: true
  };
};

Pages.SCHEMA = {
  properties: [{
    name: 'id',
    isPrimaryKey: true,
    type: 'uuid'
  }, {
    name: 'type',
    type: 'number'
  }, {
    name: 'name',
    type: 'string'
  }, {
    name: 'desc',
    type: 'string'
  }, {
    name: 'urlfrdnlyname',
    type: 'string'
  }, {
    name: 'completeurl',
    type: 'string'
  }, {
    name: 'folderid',
    type: 'uuid'
  }, {
    name: 'metaKeyword',
    type: 'string'
  }, {
    name: 'metaDesc',
    type: 'string'
  }, {
    name: 'createtime',
    isCreatedDate: true,
    type: 'epoch'
  }, {
    name: 'createdby',
    type: 'uuid'
  }, {
    name: 'lastmodifiedtime',
    isLastModifiedDate: true,
    type: 'epoch'
  }, {
    name: 'lastmodifiedby',
    type: 'uuid'
  }, {
    name: 'isActive',
    isSoftDeleteKey: true,
    type: 'boolean'
  }]
};

module.exports = { Pages };
