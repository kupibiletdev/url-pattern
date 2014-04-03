'use strict';
var escapeForRegex, getNames, patternPrototype, queryString;

queryString = require('querystring');

escapeForRegex = function(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

getNames = function(arg, separator, marker) {
  var names, regex, results, sep;
  if (arg instanceof RegExp) {
    return [];
  }
  separator = separator || '/';
  sep = escapeForRegex(separator);
  marker = escapeForRegex(marker || ':');
  
  arg = arg.replace(new RegExp(sep + '\\*[^$]', 'g'), sep + marker + '_');

  results = arg.match(new RegExp(marker + '([\\w\\d_]+)', 'g')) || [];
  names = results.map(function(item) {
    return item.substr(1);
  });

  regex = arg.replace(new RegExp(sep + '?' + marker + '[\\w\\d_]+(\\?)?($)?', 'g'), function(part, match, end) {
    return (match ? '' : separator) + '(?:' + (match ? separator : '') + '([^' + sep + ']+))' + (match ? '?' : '');
  });

  if (regex.lastIndexOf('/*') === regex.length - 2) {
    names.push('_');
    regex = regex.substr(0, regex.length - 2) + '(/.*)$';
  } else {
    regex = regex + '\/?$';
  }

  return {
    names: names,
    regex: '^' + regex
  };
};

patternPrototype = {
  match: function(urlAndQuery) {
    var ampPos, bound, captured, i, match, name, query, url, value, _i, _len;
    ampPos = urlAndQuery.lastIndexOf('?');
    if (ampPos !== -1) {
      url = urlAndQuery.substr(0, ampPos);
      query = urlAndQuery.substr(ampPos + 1);
    } else {
      url = urlAndQuery;
    }
    match = this.regex.exec(url);
    if (match === null) {
      return null;
    }
    captured = match.slice(1);
    if (this.isRegex) {
      return captured;
    }
    bound = {};
    for (i = _i = 0, _len = captured.length; _i < _len; i = ++_i) {
      value = captured[i];
      name = this.names[i];
      if (bound[name]) {
        if (!Array.isArray(bound[name])) {
          bound[name] = [bound[name]];
        }
        bound[name].push(value);
      } else {
        bound[name] = value;
      }
    }
    if (query) {
      captured = queryString.parse(query);
      for (name in captured) {
        bound[name] = captured[name];
      }
    }
    return bound;
  }
};

module.exports = function(arg) {
  var isRegex, item, p;
  isRegex = arg instanceof RegExp;
  if (!(('string' === typeof arg) || isRegex)) {
    throw new TypeError('argument must be a regex or a string');
  }
  p = Object.create(patternPrototype);
  p.isRegex = isRegex;
  if (isRegex) {
    p.regex = arg;
  } else {
    item = getNames(arg);
    p.regex = new RegExp(item.regex);
    p.names = item.names;
  }
  return p;
};
