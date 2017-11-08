const json2csv = require('json2csv')
const json2xls = require('json2xls')

/**
 * 
 * @param {*} currentKey 
 * @param {*} into 
 * @param {*} target 
 */

let dive = (currentKey, into, target) => {
  for (let i in into) {
    let newKey = i
    let newVal = into[i]
    if (currentKey.length > 0) {
      newKey = currentKey + '.' + i
    }

    if (typeof newVal === 'object') {
      dive(newKey, newVal, target)
    } else {
      target[newKey] = newVal
    }
  }
}

/**
 * 
 * @param {*} arr 
 */

let flattenObject = (arr) => {
  var newObj = {}
  dive('', arr, newObj)
  return newObj
}

/**
 * 
 * @param {*} array 
 */
const flattenObjectArray = array => {
  let flatArray = []

  array.forEach(entry => {
    flatArray.push(flattenObject(entry)
    )
  })

  return flatArray
}
/**
 * 
 * @param {*} data 
 * @param {*} format 
 */
const formatData = (data, format) => {
  if (format === 'csv') {
    return json2csv({data: flattenObjectArray(data)})
  } else if (format === 'xls') {
    return json2xls(flattenObjectArray(data))
  } else return JSON.stringify(data, null, 2)
}

module.exports = {
  flattenObject: flattenObject,
  flattenObjectArray: flattenObjectArray,
  formatData: formatData
}
