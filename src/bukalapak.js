/*eslint prefer-spread: 2*/

import fetch from 'isomorphic-fetch'

const API_VERSION = 'v4'
const METHODS = ['get', 'put', 'del', 'post', 'head', 'opts']

class Bukalapak {
  constructor (options = {}) {
    this.options = {}
    this.headers = {
      'Accept': `application/vnd.bukalapak.${API_VERSION}+json`
    }

    if (!options.baseUrl) {
      throw new Error('`baseUrl` option is required')
    } else {
      this.options.baseUrl = options.baseUrl
    }

    METHODS.forEach((method) => {
      this[method] = this._request(method)
    })
  }

  _request (method) {
    return (path, options = {}) => {
      if (typeof path !== 'string') { throw new Error('`path` must be a string') }
      if (typeof options !== 'object' || Array.isArray(options)) { throw new Error('`options` must be an object') }

      let opts = {
        ...options,
        method: this._methodMatcher(method),
        headers: Object.assign(options.headers || {}, this.headers)
      }

      // ensure body always present for POST request
      if (opts.method === 'POST' && typeof opts.body === 'undefined') {
        opts.body = ''
      }

      return this._fetch(this.options.baseUrl + path, opts)
    }
  }

  _methodMatcher (method) {
    if (method === 'del') { return 'DELETE' }
    if (method === 'opts') { return 'OPTIONS' }

    return method.toUpperCase()
  }

  _fetch (...args) {
    return fetch(...args)
  }
}

export default Bukalapak
