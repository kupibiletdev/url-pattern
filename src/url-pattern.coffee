queryString = require 'querystring'

# source: http://stackoverflow.com/a/3561711
escapeForRegex = (string) ->
    string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

getNames = (arg, separator, marker) ->
  return []  if arg instanceof RegExp
  separator = separator or '/'
  sep = escapeForRegex(separator)
  marker = escapeForRegex(marker or ':')
  arg = arg.replace(new RegExp(sep + '\\*[^$]', 'g'), sep + marker + '_')
  results = arg.match(new RegExp(marker + '([\\w\\d_]+)', 'g')) or []
  names = results.map((item) ->
    item.substr 1
  )
  regex = arg.replace(new RegExp(sep + '?' + marker + '[\\w\\d_]+(\\?)?($)?', 'g'), (part, match, end) ->
    ((if match then '' else separator)) + '(?:' + ((if match then separator else '')) + '([^' + sep + ']+))' + ((if match then '?' else ''))
  )
  if regex.lastIndexOf('/*') is regex.length - 2
    names.push '_'
    regex = regex.substr(0, regex.length - 2) + '(/.*)$'
  else
    regex = regex + '/?$'

  names: names
  regex: '^' + regex'

patternPrototype =
    match: (urlAndQuery) ->
        ampPos = urlAndQuery.lastIndexOf '?'
        if ampPos != -1
            url   = urlAndQuery.substr 0, ampPos
            query = urlAndQuery.substr ampPos + 1
        else
            url = urlAndQuery

        match = this.regex.exec url
        return null unless match?

        captured = match.slice(1)
        return captured if this.isRegex

        bound = {}
        for value, i in captured
            name = this.names[i]
            if bound[name]
                bound[name] = [bound[name]]  unless Array.isArray(bound[name])
                bound[name].push value  if typeof value isnt "undefined"
            else
                bound[name] = value

        if query 
            captured = queryString.parse query
            for name of captured
                bound[name] = captured[name]

        bound

module.exports = (arg) ->
    isRegex = arg instanceof RegExp
    unless ('string' is typeof arg) or isRegex
        throw new TypeError 'argument must be a regex or a string'
    p = Object.create patternPrototype
    p.isRegex = isRegex
    if isRegex
        p.regex = arg
    else
        item    = getNames arg
        p.regex = new RegExp item.regex
        p.names = item.names
    p
