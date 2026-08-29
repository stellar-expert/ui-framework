import {CacheItem} from './cache-item.js'

const defaultTtl = 2 * 60

export class InMemoryClientCache {
    /**
     * Create new instance of ClientCache with simple in-memory storage
     * @param {Number} [cleanupInterval] - Default entry time-to-live in seconds, used when `set()` is called without an explicit ttl
     */
    constructor(cleanupInterval = defaultTtl) {
        //guard against non-numeric values - a non-number here silently poisoned every expiration check
        this.cleanupInterval = typeof cleanupInterval === 'number' && cleanupInterval > 0 ? cleanupInterval : defaultTtl
        this.storage = {}
    }

    /**
     * Default entry time-to-live in seconds
     * @type {Number}
     * @readonly
     */
    cleanupInterval

    /**
     * @type {Object<String, CacheItem>}
     * @protected
     */
    storage

    /**
     * @param {String} key
     * @return {String}
     */
    formatKey(key) {
        return key
    }

    /**
     * Check whether cache contains given item
     * @param {String} key
     * @return {Boolean}
     */
    has(key) {
        return !!this.get(key)
    }

    /**
     * Try to retrieve an item from the cache
     * @param {String} key
     * @return {CacheItem|null}
     */
    get(key) {
        const formattedKey = this.formatKey(key)
        const item = this.storage[formattedKey]
        if (!item)
            return null
        if (item.isStale) { //the data is too old
            delete this.storage[formattedKey]
            return null
        }
        return item
    }

    /**
     * Add/replace cache object
     * @param {String} key - Unique key
     * @param {Object} value - Associated value to store
     * @param {Number} [ttl] - Time-to-live in seconds (equals cleanupInterval by default). Once elapsed – the data is considered expired. After 3*ttl – stale.
     * @return {CacheItem}
     */
    set(key, value, ttl) {
        const cacheItem = new CacheItem(value, Math.round(new Date().getTime() / 1000), ttl || this.cleanupInterval)
        this.storage[this.formatKey(key)] = cacheItem
        return cacheItem
    }

    /**
     * Get all stored cache keys, discarding stale entries along the way
     * @return {String[]}
     */
    keys() {
        this.prune()
        return Object.keys(this.storage)
    }

    /**
     * Remove an item from cache
     * @param {String} key
     */
    delete(key) {
        delete this.storage[this.formatKey(key)]
    }

    /**
     * Remove all cache entries
     */
    clear() {
        this.storage = {}
    }

    /**
     * Discard every stale entry - invoked lazily on access instead of from a background timer
     * @protected
     */
    prune() {
        for (const key of Object.keys(this.storage))
            if (this.storage[key].isStale) {
                delete this.storage[key]
            }
    }
}
