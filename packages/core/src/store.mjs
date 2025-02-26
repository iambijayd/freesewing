import set from 'lodash.set'
import unset from 'lodash.unset'
import get from 'lodash.get'

// Don't allow setting of these top-level keys in the store
const avoid = ['set', 'setIfUnset', 'push', 'unset', 'get', 'extend']

//////////////////////////////////////////////
//               CONSTRUCTOR                //
//////////////////////////////////////////////

/**
 * Constructor for a Store
 *
 * @constructor
 * @param {Array} methods - Any methods to add to the store
 * @return {Store} this - The Store instance
 */
export function Store(methods = []) {
  /*
   * Default logging methods
   * You can override these with a plugin
   */
  const logs = {
    debug: [],
    info: [],
    warn: [],
    error: [],
  }
  this.log = {
    debug: function (...data) {
      logs.debug.push(...data)
    },
    info: function (...data) {
      logs.info.push(...data)
    },
    warn: function (...data) {
      logs.warn.push(...data)
    },
    error: function (...data) {
      if (typeof window !== 'undefined') console.error(...data[0])
      logs.error.push(...data)
    },
  }
  this.logs = logs

  for (const [path, method] of methods) {
    if (avoid.indexOf(path) !== -1) {
      this.log.warn(`You cannot overwrite \`store.${path}()\``)
    } else set(this, path, method)
  }

  // Fallback packing algorithm
  this.pack = fallbackPacker

  return this
}

//////////////////////////////////////////////
//            PUBLIC METHODS                //
//////////////////////////////////////////////

/**
 * Extend the store with additional methods
 *
 * @param {function} method - Method to add to the store (variadic)
 * @return {Store} this - The Store instance
 */
Store.prototype.extend = function (methods) {
  for (const [path, method] of methods) {
    if (avoid.indexOf(path) !== -1) {
      this.log.warn(`You cannot overwrite \`store.${path}()\``)
    } else {
      this.log.info(`Extending store with \`${path}\``)
      set(this, path, (...args) => method(this, ...args))
    }
  }

  return this
}

/**
 * Retrieve a key from the store
 *
 * @param {string|array} path - Path to the key
 * @param {mixed} dflt - Default method to return if key is undefined
 * @return {mixed} value - The value stored under key
 */
Store.prototype.get = function (path, dflt) {
  const val = get(this, path, dflt)
  if (typeof val === 'undefined') {
    this.log.warn(`Store.get(key) on key \`${path}\`, which is undefined`)
  }

  return val
}

/**
 * Adds a value to an array stored under path
 *
 * @param {string|array} path - Path to the key
 * @param {mixed} values - One or more values to add (variadic)
 * @return {Store} this - The Store instance
 */
Store.prototype.push = function (path, ...values) {
  const arr = get(this, path)
  if (Array.isArray(arr)) {
    return this.set(path, [...arr, ...values])
  } else {
    this.log.warn(`Store.push(value) on key \`${path}\`, but key does not hold an array`)
  }

  return this
}

/**
 * Set key at path to value
 *
 * @param {string|array} path - Path to the key
 * @param {mixed} value - The value to set
 * @return {Store} this - The Store instance
 */
Store.prototype.set = function (path, value) {
  if (typeof value === 'undefined') {
    this.log.warn(`Store.set(value) on key \`${path}\`, but value is undefined`)
  }
  set(this, path, value)

  return this
}

/**
 * Set key at path to value, but only if it's not currently set
 *
 * @param {string|array} path - Path to the key
 * @param {mixed} value - The value to set
 * @return {Store} this - The Store instance
 */
Store.prototype.setIfUnset = function (path, value) {
  if (typeof value === 'undefined') {
    this.log.warn(`Store.setIfUnset(value) on key \`${path}\`, but value is undefined`)
  }
  if (typeof get(this, path) === 'undefined') {
    return set(this, path, value)
  }

  return this
}

/**
 * Remove the key at path
 *
 * @param {string|array} path - Path to the key
 * @param {mixed} value - The value to set
 * @return {Store} this - The Store instance
 */
Store.prototype.unset = function (path) {
  unset(this, path)

  return this
}

/**
 * The default pack method comes from a plugin, typically
 * plugin-bin-back which is part of core plugins.
 * However, when a pattern is loaded without plugins
 * we stil don't want it work even when no pack method
 * is available, so this is the fallback default pack method.
 */
function fallbackPacker(items) {
  let w = 0
  let h = 0
  for (const item of items) {
    if (item.width > w) w = item.width
    if (item.height > w) w = item.height
  }

  return { w, h }
}
