// let clone = in=>JSON.parse(JSON.stringify(in));

const merge = require('merge')
const MongoClient = require('mongodb').MongoClient
const async = require('async')
const Nodessh = require('node-ssh')
const ssh = new Nodessh()
const urlParser = require('url')

// load scripts from this library
const { loadQuery } = require('./query.js')
const clone = (obj) => JSON.parse(JSON.stringify(obj))

/**
 * Main function that takes an input object and processes
 * the query inside of it
 * 
 * @param {object | string} program object from the cli call or query from module
 * @param {function} callback 
 */
const joinMongoCollections = (program, callback) => {

  let query, key
  if (typeof program === 'object' && program.query) {
    query = program.query
    key = program.key
  } else query = program

  let queryObject
  try {
    queryObject = loadQuery(query)
  } catch (e) {
    return callback(e)
  }

  let aggregatedEntries
  let i = 0
  async.eachSeries(queryObject, (entry, callback) => {
    console.log('Start fetching: ' + entry.q.db + '/' + entry.q.collection)
    let sortKey
    if (entry.on && entry.on.key2) sortKey = entry.on.key2
    fetchMongo(
      entry.q.query, entry.q.projection, entry.q.db, entry.q.collection, sortKey, program.key,
      (err, docs) => {
        if (err) return callback(err)
        if (entry.on && i > 0) {
          console.log('Joining ' + entry.q.collection + ' into existing data on ' + entry.on.key2)
          aggregatedEntries = joinArraysOnKey(aggregatedEntries, entry.on.key1, docs, entry.on.key2, entry.on.options)
          console.log('Original docs: ' + docs.length + ' - docs after join: ' + aggregatedEntries.length)
        } else {
          aggregatedEntries = docs
          console.log('Docs: ' + docs.length)
        }
        i++
        return callback()
      }
    )
  }, (err) => {
    if (err) return callback(err)
    return callback(null, aggregatedEntries)
  })
}

/**
 * 
 * @param {*} query 
 * @param {*} projection 
 * @param {*} db 
 * @param {*} collection 
 * @param {*} key 
 * @param {*} callback 
 */

const fetchMongo = (query, projection, db, collection, sortKey, key, callback) => {
  if (!callback) {
    callback = key
    key = undefined
  }
  let dbObject = urlParser.parse(db)

  let callbackHandler = function (err, result) {
    if (err) return callback(err)
    return callback(null, result)
  }

  if (dbObject.protocol === 'mongodb:') {
    fetchMongoOverMongoProtocol(query, projection, db, collection, callbackHandler)
  } else if (dbObject.protocol === 'ssh:') {
    fetchMongoOverSsh(query, projection, db, collection, sortKey, key, callbackHandler)
  } else return callback('unsupported protocol')
}

/**
 * 
 * @param {*} query 
 * @param {*} projection 
 * @param {*} url 
 * @param {*} collection 
 * @param {*} key 
 * @param {*} callback 
 */

const fetchMongoOverSsh = (query, projection, url, collection, sortKey, key, callback) => {
  if(!callback) {
    callback = key
    key = undefined
  }
  let urlObject = urlParser.parse(url)

  let username, password

  if (urlObject.auth) { username = urlObject.auth.split(':')[0] }
  if (username && urlObject.auth.split(':').length > 1) { password = urlObject.auth.split(':')[1] }

  let sshConnectOptions = {
    host: urlObject.host,
    username: username || 'root'
  }

  if (password || key) {
    if (password) sshConnectOptions.password = password
    if (key) sshConnectOptions.privateKey = key
  } else return callback('no auth method defined (keyfile or password)')

  let dbName = urlObject.pathname.substr(1).split('/')[0]

  sortKey = undefined
  let sortString = (sortKey) ? '.sort({"' + sortKey + '":1})' : ''
  //let sortString = ''
  // pagination is only needed if sorting
  let limit, offset
  if (sortKey) {
    offset = 0
    limit = 10000
  }

  let fetchWithOffset = (offset, callback) => {
    let limitString = ''
    if (offset !== undefined) limitString = '.limit(' + limit + ').skip(' + offset + ')'

    let mongoCommand =  "mongo --quiet '" + dbName + "' --eval " +
    "'printjson(db." + collection + '.find(' +
    JSON.stringify(query) + ',' + JSON.stringify(projection) +
    ')' + sortString + limitString +
    ".toArray())'"

    ssh.connect(sshConnectOptions)
      .then(function () {
        ssh.execCommand(mongoCommand)
          .then(function (result) {
            if (result.stderr) return callback(result.stderr)
            // console.log(result.stdout)
            let resultObj
            try {
              resultObj = JSON.parse(result.stdout)
            } catch (e) {
              return callback(e + ' -> ' + JSON.stringify(result) + ' -> ' + mongoCommand)
            }
            return callback(null, resultObj)
          }).catch(function (e) {
            return callback(e)
          })
      }).catch(function (e) {
        return callback(e)
      })
  }

  let concResult = []
  let lastLength
  async.doWhilst(
    callback => {
      fetchWithOffset(offset, (err, result) => {
        if (err) return callback(err)
        lastLength = result.length
        // console.log('fetched ' + result.length)
        if (offset !== undefined) offset = offset + limit
        result.forEach(entry => concResult.push(entry))
        return callback(null, concResult)
      })
    },
    // continue condition
    () => (lastLength > 0 && offset !== undefined),
    function (err, result) {
      if (err) return callback(err)
      return callback(null, result)
    }
  )
}

/**
 * 
 * @param {*} query 
 * @param {*} projection 
 * @param {*} url 
 * @param {*} collection 
 * @param {*} callback 
 */

const fetchMongoOverMongoProtocol = (query, projection, url, collection, callback) => {
  MongoClient.connect(url, function (err, db) {
    if (err) callback(err)
    let col = db.collection(collection)
    col.find(query, projection).toArray(function (err, docs) {
      db.close()
      if (err) callback(err)
      return callback(null, docs)
    })
  })
}

/**
 * Joins two arrays of objects on a defined key of the object
 * Note that there are optional options to change the join 
 * behavour and performance
 * 
 * @param {array} array1 
 * @param {string} key1 
 * @param {array} array2 
 * @param {string} key2 
 * @param {object | undefined} options { reference: 'noMatch', 
 *                                       method:    'binarySearch' }
 */

const joinArraysOnKey = (array1, key1, array2, key2, options) => {
  if (!options) options = {}

  // TODO: filter allowed methods
  options.reference = options.reference || 'match'
  options.method = options.method || 'simpleSearch'

  let resolve = (cur, ns) => {
    let undef
    ns = ns.split('.')
    while (cur && ns[0]) cur = cur[ns.shift()] || undef
    return cur
  }

  function compare (a,b) {
    if (resolve(a, key2) < resolve(b, key2)) return -1
    if (resolve(a, key2) > resolve(b, key2)) return 1
    return 0
  }
  console.log('Sorting Array')
  array2.sort(compare)

  function getDescendantProp (obj, desc) {
    if(!obj || !desc) return undefined
    //console.log(obj, desc)
    let value = obj
    desc.split(".").forEach((arr) => {value = value[arr]})
    return value;
  }

  let iterator = 0
  let length = array1.length * array2.length
  let startLength = length
  let noMatch = 0
  let updateProgressOnCli = () => {
    let calc = 100 - ((length-iterator) * 100 / startLength)
    let percentage = Math.round(calc * 100) / 100
    process.stdout.write('\r\x1b[K' + iterator + '/' + length + ' (' + percentage + '%) - no match: ' + noMatch)
  }

  function binarySearch (array, key, searchValue) {
    //console.log('BINARY_SEARCH')
    //console.log(array, key, searchValue)
    let low = 0
    let high = array.length - 1
    let mid
    while (low <= high) {
      mid = Math.floor((low + high) / 2)
      // console.log(getDescendantProp(array[mid], key) + ' vs ' + searchValue)
      if (getDescendantProp(array[mid], key) === searchValue) {
        let concArray = []
        concArray.push(array[mid])

        // THERE ARE ISSUES WITH MULTIPLE ENTRIES RETURNED WITH THE ABOVE CODE

        // let up = mid+1
        // let down = mid-1
        // while(up <= array.length && getDescendantProp(array[up], key) === searchValue) {
        //   concArray.push(array[up])
        //   up++
        // }
        // while(down >= 0 && getDescendantProp(array[down], key) === searchValue) {
        //   concArray.push(array[down])
        //   down--
        // }
        // console.log('CONC_ARRAY')
        // console.log(concArray)
        length = length - array.length
        iterator = iterator + concArray.length
        if (concArray.length >= 2) console.log(concArray)
        return concArray
      }
      else if (getDescendantProp(array[mid], key) < searchValue) low = mid + 1
      else high = mid - 1
      // TODO: after one entry was found look up and dowm as long as no more matches are found
    }

    return []
  }

  /**
   * Return all items in an array that match a value over a key
   * 
   * @param {object} array 
   * @param {string} key 
   * @param {string | number} value 
   */

  let simpleSearch = (array, key, value) => {
    let items = []
    array.forEach((item, i) => {
      if (resolve(item, key) && resolve(item, key) === value) {
        items.push(item)
        iterator++
      } else length--
    })
    // console.log('search for ' + value + ' on ' + array.length + '[' + key + '] + result: ' + items.length)
    return items
  }

  let start = new Date()
  console.log('Start Join: ' + start)

  let output = []
  array1.forEach(item1 => {
    if (resolve(item1, key1)) {
      let joinedItems = []
      if (options.method === 'binarySearch') joinedItems = binarySearch(array2, key2, item1[key1])
      else joinedItems = simpleSearch(array2, key2, resolve(item1, key1))

      if (joinedItems.length === 0) noMatch++

      if (options.reference === 'noMatch') {
        if (joinedItems.length === 0) {
          output.push(item1)
        }
      } else {
        joinedItems.forEach(joinedItem => {
          output.push(clone(merge(item1, joinedItem)))
        })
      }
    } else length = length - array1.length * array2.length
    updateProgressOnCli()
  })
  console.log('')
  console.log('Join time: ' + (new Date() - start) + ' ms')
  console.log(output.length)
  return output
}

module.exports = {
  joinMongoCollections: joinMongoCollections,
  joinArraysOnKey: joinArraysOnKey,
  fetchMongo: fetchMongo
}
