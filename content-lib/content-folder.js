const uuidv4 = require('uuid');

class ContentFolder {
  constructor(data = {}) {
    const dateObj = new Date();
    data = Object.assign({}, ContentFolder.defaults(), data);

    this.id = data.id;
    this.name = data.name;
    this.desc = data.desc;
    this.folderid = data.folderid;

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
    json.folderid = this.folderid;

    json.createtime = this.createtime;
    json.createdby = this.createdby;
    json.lastmodifiedtime = this.lastmodifiedtime;
    json.lastmodifiedby = this.lastmodifiedby;
    json.isActive = this.isActive;

    return json;
  }

  isValid(isFirstFolder = false) {
    if (!(this.folderid || this.id) || !this.name) {
      return false;
    }
    return true;
  }
}

ContentFolder.defaults = (data = {}) => {
  const dateObj = new Date();
  return {
    id: uuidv4.v4(),
    createtime: parseInt((dateObj).getTime() / 1000),
    lastmodifiedtime: parseInt((dateObj).getTime() / 1000),
    isActive: true
  };
};

ContentFolder.SCHEMA = {
  properties: [{
    name: 'id',
    isPrimaryKey: true,
    type: 'uuid'
  }, {
    name: 'name',
    type: 'string'
  }, {
    name: 'desc',
    type: 'string'
  }, {
    name: 'folderid',
    type: 'uuid'
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

module.exports = { ContentFolder };