
const cache = {};


exports.getCache = (key) => {
  return cache[key]
};

exports.writeCache = (key, data) => {
  cache[key] = data;
};
