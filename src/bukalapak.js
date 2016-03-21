import fetch from 'isomorphic-fetch';
import { transformUrl, isObject, isString, isUndefined } from './util';
import queryString from 'query-string';
import Storage from './storage';
import Auth from './auth';
import Api from './api';

const API_VERSION = 'v4';
const METHODS = ['get', 'put', 'del', 'post', 'head', 'opts'];
const AVAILABLE_ADAPTERS = { auth: Auth, api: Api };

class Bukalapak {
  constructor (options = {}) {
    this.options = {};
    this.headers = {
      'Accept': `application/vnd.bukalapak.${API_VERSION}+json`
    };

    if (!options.baseUrl) {
      throw new Error('`baseUrl` option is required');
    } else {
      this.options.baseUrl = options.baseUrl;
    }

    if (!options.storage) {
      throw new Error('`storage` option is required');
    } else {
      this.storage = new Storage(options.storage, options.storageOptions);
    }

    METHODS.forEach((method) => {
      this[method] = this._request(method);
    });
  }

  useAdapter (name, options = {}) {
    this[name] = new AVAILABLE_ADAPTERS[name](this, options);
    return this[name].registerAdapter();
  }

  _request (method) {
    return (path, options = {}) => {
      if (!isString(path)) { throw new Error('`path` must be a string'); }
      if (!isObject(options)) { throw new Error('`options` must be an object'); }

      let opts = Object.assign({}, options, {
        method: this._methodMatcher(method),
        headers: Object.assign({}, this.headers, options.headers || {})
      });

      let subdomain = opts.subdomain;
      delete opts.subdomain;

      let query = opts.query;
      delete opts.query;

      let reqUrl = this._generateUrl(path, subdomain, query);

      // ensure body always present for POST request
      if (opts.method === 'POST' && isUndefined(opts.body)) {
        opts.body = '';
      }

      // enhance this later...
      if (this.auth) {
        return this.auth.formatRequest(reqUrl, opts).then((options) => {
          return this._fetch(reqUrl, options);
        });
      } else {
        return this._fetch(reqUrl, opts);
      }
    };
  }

  _methodMatcher (method) {
    switch (method) {
      case 'del':
        return 'DELETE';
      case 'opts':
        return 'OPTIONS';
      default:
        return method.toUpperCase();
    }
  }

  _fetch (...args) {
    return fetch(...args);
  }

  _generateUrl (path, subdomain, query = {}) {
    let reqUrl = transformUrl(this.options.baseUrl, subdomain) + path;
    let reqQuery = this._queryString(query);

    if (reqQuery !== '') {
      return reqUrl + `?${reqQuery}`;
    } else {
      return reqUrl;
    }
  }

  _queryString (query) {
    return queryString.stringify(query);
  }
}

export default Bukalapak;
