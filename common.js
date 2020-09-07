const UUID_NIL = '00000000-0000-0000-0000-000000000000';

const EnumGenerator = (attr) => {
  for (var key in attr) {
    if (attr.hasOwnProperty(key)) {
      attr[attr[key]] = key;
    }
  }
  return attr;
};

const getCurrentEpochTime = () => {
  const dateObj = new Date();
  return parseInt((dateObj).getTime() / 1000);
};

let _cache = {};

const CacheMgr = {
  set: (key, val) => {
    return _cache[key] = val;
  },
  get: (key) => _cache[key],
  remove: (key) => {
    delete _cache[key];
  },
  clearAll: () => {
    _cache = {};
  }
};

module.exports = { UUID_NIL, EnumGenerator, getCurrentEpochTime, CacheMgr };