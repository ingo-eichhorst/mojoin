const fs = require('fs')
const yaml = require('js-yaml')

/**
 * 
 * @param {string} queryInput 
 */

const loadQuery = queryInput => {
  if (!queryInput) throw new Error('No query string or query file defined')
  // try to load query as json string
  let query
  try {
    query = JSON.parse(queryInput)
  } catch (jsonError) {
    // try to load query as from file if it's no valid json string
    try {
      query = loadQueryFromFile(queryInput)
    } catch (fileError) {
      throw new Error(`Input query is no valid json string or a pointer \n
                        to a file with a valid (json/yaml) string\n
                        - JSON parse error: ${jsonError}\n
                        - Load file Error: ${fileError}`)
    }
  }

  // normalize and validate the query
  let normalizedQuery
  try {
    normalizedQuery = normalizeQuery(query)
    validateQuery(normalizedQuery)
  } catch (e) {
    throw new Error(e)
  }

  return normalizedQuery
}

/**
 * 
 * @param {*} file 
 */

const loadQueryFromFile = file => {
  if (!file) throw new Error('no file provided')
  console.log('Load template from: ' + file)
  let query, fileContent
  try {
    fileContent = fs.readFileSync(file, 'utf8')
    let ending = file.split('.')[1]
    if (ending === 'yml' || ending === 'yaml') query = yaml.safeLoad(fileContent)
    else query = JSON.parse(fileContent)
  } catch (e) {
    throw new Error('Cannot parse template: ' + file)
  }
  return query
}

/**
 * 
 * @param {object} query 
 */

const normalizeQuery = query => {
  if (Array.isArray(query)) return query
  else if (typeof query === 'object') return [query]
  else throw new Error('unsupported type of query. has to be a string or an object')
}

/**
 * 
 * @param {object} query 
 */

const validateQuery = query => {
  let validateSingleEntry = (entry, i) => {
    let validateQuery = (query) => {
      if (query.query && query.projection && query.db && query.collection) return true
      else throw new Error('some parts of the query are not specified. always specify query, projection, db and collection')
    }
    if (entry.q) {
      if (validateQuery(entry.q) &&
        ((entry.on && entry.on.key1 && entry.on.key2) || i === 0)) return true
      else {
        throw new Error('correct form of query is not met. see readme for details')
      }
    }
  }

  try {
    query.forEach((entry, i) => {
      validateSingleEntry(entry, i)
    })
  } catch (e) {
    throw new Error(e)
  }

  return true
}

module.exports = {
  loadQuery: loadQuery,
  loadQueryFromFile: loadQueryFromFile,
  validateQuery: validateQuery
}
