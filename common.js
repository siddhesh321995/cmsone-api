const UUID_NIL = '00000000-0000-0000-0000-000000000000';

/**
 * Generates a Enum class
 * @param {{[key:number]:string}} attr Valid enum data
 */
const EnumGenerator = (attr) => {
  for (var key in attr) {
    if (attr.hasOwnProperty(key)) {
      attr[attr[key]] = key;
    }
  }
  return attr;
};

/**
 * Returns current epoch time in int.
 */
const getCurrentEpochTime = () => {
  const dateObj = new Date();
  return parseInt((dateObj).getTime() / 1000);
};

let _cache = {};

/**
 * Cache manager, stores data in memory.
 */
const CacheMgr = {
  /**
   * Sets cache value
   * @param {string} key Key of the value
   * @param {any} val Cached value
   */
  set: (key, val) => {
    return _cache[key] = val;
  },
  /**
   * Gets cached value
   * @param {string} key Key of the value
   */
  get: (key) => _cache[key],
  /**
   * Removes given cached value
   * @param {string} key Key of the value
   */
  remove: (key) => {
    delete _cache[key];
  },
  /**
   * Removes all cached values.
   */
  clearAll: () => {
    _cache = {};
  }
};

module.exports = { UUID_NIL, EnumGenerator, getCurrentEpochTime, CacheMgr };