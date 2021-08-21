class CacheItem {
    constructor(data, ts, ttl) {
        this.data = data
        this.ts = ts
        this.ttl = ttl
        Object.freeze(this)
    }

    data

    ts

    ttl

    get isExpired() {
        return new Date().getTime() / 1000 > this.ts + this.ttl
    }

    get isStale() {
        return new Date().getTime() / 1000 > this.ts + this.ttl * 3
    }

    toJSON() {
        return {
            data: this.data,
            ts: this.ts,
            ttl: this.ttl
        }
    }
}

const storage = {}

export default class ClientCache {
    constructor({prefix, cleanupInterval = 2 * 60}) {
        this.cachePrefix = prefix
        this.cleanupInterval = cleanupInterval

        const cleanupApiCache = () => {
            for (const key of this.keys())
                if (key.indexOf(prefix) === 0) {
                    this.get(key.substr(prefix.length)) //the getter will cleanup stale entries automatically
                }
            setTimeout(cleanupApiCache, cleanupInterval * 1000)
        }
        cleanupApiCache()
    }

    formatKey(key) {
        return this.cachePrefix + key
    }

    /**
     * @param {String} key
     * @return {Boolean}
     */
    has(key) {
        return !!storage[this.formatKey(key)]
    }

    /**
     *
     * @param {String} key
     * @return {CacheItem}
     */
    get(key) {
        key = this.formatKey(key)
        let item = storage[key]
        if (!item) return null
        if (item.isStale) {
            //the data is too old
            delete storage[key]
            return null
        }
        return item
    }

    /**
     * @param {String} key
     * @param {Object} value
     * @param {Number} [ttl] - Time-to-live in seconds (equals cleanupInterval by default). Once elapsed – the data is considered expired. After 3*ttl – stale.
     * @returns {CacheItem}
     */
    set(key, value, ttl) {
        const cacheItem = new CacheItem(value, Math.round(new Date().getTime() / 1000), ttl || this.cleanupInterval)
        storage[this.formatKey(key)] = cacheItem
        return cacheItem
    }

    keys() {
        return Object.keys(storage)
            .filter(key => key.indexOf(this.cachePrefix) === 0)
    }

    delete(key) {
        delete storage[this.formatKey(key)]
    }

    clear() {
        for (const key of this.keys()) {
            delete storage[key]
        }
    }
}