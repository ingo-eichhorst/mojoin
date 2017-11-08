const chai = require('chai')
const { expect, assert } = chai
const fs = require('fs')


let queries = {
  simple: JSON.parse(fs.readFileSync(__dirname + '/fixtures/queries/simple.json', 'utf8')),
  complex: JSON.parse(fs.readFileSync(__dirname + '/fixtures/queries/complex.json', 'utf8'))
}
let docs = {
  cars: JSON.parse(fs.readFileSync(__dirname + '/fixtures/mongo-docs/cars.json', 'utf8')),
  manufacturers: JSON.parse(fs.readFileSync(__dirname + '/fixtures/mongo-docs/manufacturers.json', 'utf8'))
}
let flatDocs = {
  cars: JSON.parse(fs.readFileSync(__dirname + '/fixtures/flatDocs/cars.json', 'utf8'))
}
let csv = {
  flatCars: fs.readFileSync(__dirname + '/fixtures/csv/flatCars.csv', 'utf8')
}
let xls = {
  flatCars: __dirname + '/fixtures/xls/flatCars.xls'
}
let joinedDocs = {
  carsAndManufacturers: fs.readFileSync(__dirname + '/fixtures/joins/carsAndManufacturers.json', 'utf8')
}

// mocking modules
const proxyquire = require('proxyquire')
function SSH() {
  this.connect = (sshConnectOptions) => {
    return new Promise(function (resolve, reject) {
      if (false) reject('err')
      else resolve(sshConnectOptions)
    })
  }
  this.execCommand = (cmd) => {
    return new Promise(function (resolve, reject) {
      if (false) reject('err')
      else resolve({stdout: JSON.stringify(docs.cars)})
    })
  }
  return this
}

const mongoMock = {
  MongoClient: {
    connect: (url, callback) => {
      console.log(url, callback)
      callback(null, {
        collection: () => {
          return {
            find: (query, projection) => {
              return {
                toArray: (callback) => {
                  return callback(null, docs.cars)
                }
              }
            }
          }
        },
        close: () => {}        
      })
    }
  }
}

// Load internal libraries
//const index = require('../lib/index.js')
//const join = require('../lib/join.js')
const utils = require('../lib/utils.js')
const queryFunctions = require('../lib/query.js')
const join = proxyquire('../lib/join.js', { 'node-ssh': SSH, 'mongodb': mongoMock });

describe('Validate input', function () {
  it('should validate simple query', function () {
    let validationResult = queryFunctions.validateQuery(queries.simple)
    assert.equal(validationResult, true)
  })
  it('should validate complex query', function () {
    let validationResult = queryFunctions.validateQuery(queries.complex)
    assert.equal(validationResult, true)
  })
  it('should not validate wrong query', function () {
    let validationResult
    let error
    try {
      validationResult = queryFunctions.validateQuery(queries.wrong)
    } catch (e) {
      error = e
    }
    it('should load a json template files', function () {
      let query = queryFunctions.loadQueryFromFile(__dirname + '/fixtures/templates/simple.json')
      assert.equal(JSON.stringify(query), JSON.stringify(queries.simple))
    })
  })
})

// describe('Join databases', function() {
//   it('should query one entry', function() {
//
//   });
//   it('should join two entries on a defined key', function() {
//
//   });
//   it('should join four entries on multiple keys', function() {
//
//   });
// });

describe('Query: Load Query', function () {
  it('should throw an error when no input is supported', function () {
    let query
    let error
    try {
      query = queryFunctions.loadQuery('')
    } catch (e) {
      error = e
    }
    assert.notEqual(error, undefined)
  })

  it('should throw an error when input is no valid json or file', function () {
    let query
    let error
    try {
      query = queryFunctions.loadQuery('{low-')
    } catch (e) {
      error = e
    }
    assert.notEqual(error, undefined)
  })

  it('should throw error if query cannot be validated', function () {
    let query
    let error
    try {
      query = queryFunctions.loadQuery('{"q":"something wrong"}')
    } catch (e) {
      error = e
    }
    console.log(error)
    assert.notEqual(error, undefined)
  })

  it('should return valid query in success case', function () {
    let query = queryFunctions.loadQuery(__dirname + '/fixtures/queries/complex.json')
    assert.equal(JSON.stringify(query), JSON.stringify(queries.complex))
  })

})

describe('Query: Load template file', function () {
  it('should load a json template file', function () {
    let query = queryFunctions.loadQueryFromFile(__dirname + '/fixtures/templates/simple.json')
    assert.equal(JSON.stringify(query), JSON.stringify(queries.simple))
  })
  it('should load a yml template files', function () {
    let query = queryFunctions.loadQueryFromFile(__dirname + '/fixtures/templates/simple.yml')
    assert.equal(JSON.stringify(query), JSON.stringify(queries.simple))
  })
  it('should throw an error if json is invalid', function () {
    let query, error
    try {
      let query = queryFunctions.loadQueryFromFile(__dirname + '/fixtures/templates/wrong.json')
    } catch (e) {
      error = e
    }
    assert.notEqual(error, undefined)
  })
})

describe('Join Arrays On Key', function() {
  it('should join two arrays on a predefined key', function() {
    let result = join.joinArraysOnKey(docs.cars, 'manuafacturer', docs.manufacturers, 'name')
    console.log(JSON.stringify(result))
    assert.equal(JSON.stringify(result), joinedDocs.carsAndManufacturers)
  })
  // it('should ouput an error when one or more files are corrupt', function() {
  // });
});

describe('Utils: Flatten Arrays', function () {
  it('should make the object arrays flat and seperated by a dot', function () {
    let result = utils.flattenObjectArray(docs.cars)
    assert.equal(JSON.stringify(result), JSON.stringify(flatDocs.cars))
  })

  // it('should throw an error when the array is corrupt', function() {
  // });
})

var xlsx = require('node-xlsx');
describe('Utils: Format output', function () {
  it('should format the output as csv', function () {
    let result = utils.formatData(docs.cars, 'csv')
    assert.equal(result, csv.flatCars)
  })

  it('should format the output as xls', function () {
    let result = utils.formatData(docs.cars, 'xls')
    var parsedOutput = xlsx.parse(xls.flatCars)
    fs.writeFileSync(__dirname + '/xls-test.xls', result, 'binary')
    var parsedResult = xlsx.parse(__dirname + '/xls-test.xls')
    fs.unlink(__dirname + '/xls-test.xls')
    assert.equal(JSON.stringify(parsedOutput), JSON.stringify(parsedResult))
  })

  it('should format the output as prettified json', function () {
    let result = utils.formatData(docs.cars)
    assert.equal(result, JSON.stringify(docs.cars, null, 2))
  })

  // it('should throw an error when the array is corrupt', function() {
  // });
})

describe('Join: Fetch MongoDB', function() {
  it('should get MongoDB data over SSH protocol with username + pw', function() {
    let q = queries.simple[0].q;
    join.fetchMongo(q.query, q.projection, q.db, q.collection, function(err,result){
      assert.equal(result, docs.cars)
      // expect(result).to.equal(docs.cars)
    })
  })
//
// it('should resond with an error if fetching over SSH failed', function() {
//   //
// });
//
  it('should get MongoDB data over MongoDB protocol', function() {
    let q = queries.complex[0].q;
    join.fetchMongo(q.query, q.projection, q.db, q.collection, function(err,result) {
      assert.equal(result, docs.cars)
    })
  })
//
//
//   it('should resond with an error if fetching over MongoDB protocol failed', function() {
//     //
//   });
//
})
//
// describe('Call service over CLI', function() {
//   it('should start with query only', function() {
//   });
//   it('should start with template only', function() {
//   });
// });
//
// describe('Call service as Webservice', function() {
//   // TODO
// });
//
// describe('Load Service as Module', function() {
//   // TODO
// });

// let array1 = [{id:1,"one": "hello", "two": "world", "obj": {"a":"b"}},{id:2,"one": "hello2", "two": "world2"}]
// let array2 = [{id:1,"three": "ola", "four": "atlasius", "obj": {"a":"b"}},{id:2,"one": "ola2", "four": "atl2"}]
//
// console.log(joinArraysOnKey(array1,'id',array2,'id'));

/**
 *  USE-CASE: Query Database
 *
 *
 *
 */
