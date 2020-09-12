const uuidv4 = require('uuid');
const { EnumGenerator } = require('./../common');

const ContentItemTypes = EnumGenerator({
  PLAIN_TEXT: 1,
  HTML: 2,
  JSON: 3,
  XML: 4
});

class ContentItem {
  constructor(data = {}) {
    const dateObj = new Date();
    data = Object.assign({}, ContentItem.defaults(), data);

    this.id = data.id;
    this.type = data.type;
    this.name = data.name;
    this.desc = data.desc;
    this.contentstr = data.contentstr;
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
    json.type = this.type;
    json.name = this.name;
    json.desc = this.desc;
    json.contentstr = this.contentstr;
    json.folderid = this.folderid;
    json.createtime = this.createtime;
    json.createdby = this.createdby;
    json.lastmodifiedtime = this.lastmodifiedtime;
    json.lastmodifiedby = this.lastmodifiedby;
    json.isActive = this.isActive;

    return json;
  }

  isValid() {
    if ((!this.id && !this.folderid) || !this.type || !this.name || !this.contentstr) {
      return false;
    }
    return true;
  }
}

ContentItem.defaults = (data = {}) => {
  const dateObj = new Date();
  return {
    id: uuidv4.v4(),
    type: ContentItemTypes.PLAIN_TEXT,
    createtime: parseInt((dateObj).getTime() / 1000),
    lastmodifiedtime: parseInt((dateObj).getTime() / 1000),
    isActive: true
  };
};

ContentItem.SCHEMA = {
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
    name: 'contentstr',
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

module.exports = { ContentItem };