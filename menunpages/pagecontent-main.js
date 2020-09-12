const uuidv4 = require('uuid');

class PageContent {
  constructor(data = {}) {
    data = Object.assign({}, PageContent.defaults(), data);

    /**
     * @type {string} UUID string id
     */
    this.id = data.id;

    /**
     * @type {string} UUID string id
     */
    this.pageid = data.pageid;

    /**
     * @type {string} UUID string id
     */
    this.contentid = data.contentid;

    /**
     * @type {number} UUID string id
     */
    this.displayOrder = data.displayOrder;
  }

  toJSON() {
    const json = {};

    json.id = this.id;
    json.pageid = this.pageid;
    json.contentid = this.contentid;
    json.displayOrder = this.displayOrder;

    return json;
  }

  isValid() {
    if (!this.pageid || !this.contentid || !this.displayOrder) {
      return false;
    }
    return true;
  }
}

PageContent.defaults = (data = {}) => {
  return {
    id: uuidv4.v4()
  };
};

PageContent.SCHEMA = {
  properties: [{
    name: 'id',
    isPrimaryKey: true,
    type: 'uuid'
  }, {
    name: 'pageid',
    type: 'uuid'
  }, {
    name: 'contentid',
    type: 'uuid'
  }, {
    name: 'displayOrder',
    type: 'number'
  }]
};

module.exports = { PageContent };