const request = require('request');
const Promise = require('bluebird');

class RequestPromise {

  constructor() {
    this.contentType = 'application/json'
  }

  get(query) {
    return new Promise((resolve, reject) => {
      return request({
        method: 'GET',
        url: query.url,
        headers: {
          'Content-Type': this.contentType
        }
      }, (err, response, body) => {
        if (err || response.statusCode !== 200) {
          return reject({
            status: response && response.statusCode || 500,
            message: body && body || 'can not connect server'
          });
        }
        return resolve(body);
      })
    })
  }

  put(body) {
    return new Promise((resolve, reject) => {
      return request({
        method: 'PUT',
        url: body.url,
        json: body.params,
        headers: {
          'Content-Type': this.contentType
        }
      }, (err, response, body) => {
        if (err || response.statusCode !== 200) {
          return reject({
            status: response && response.statusCode || 500,
            message: body && body || 'can not connect server'
          });
        }
        return resolve(body);
      })
    })
  }
}

module.exports = RequestPromise;