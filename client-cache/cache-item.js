/**
 * Immutable cache entry with expiration tracking
 */
export class CacheItem {
    /**
     * @param {Object} data - Cached value
     * @param {Number} ts - Creation timestamp (Unix seconds)
     * @param {Number} ttl - Time-to-live in seconds
     */
    constructor(data, ts, ttl) {
        this.data = data
        this.ts = ts
        this.ttl = ttl
        Object.freeze(this)
    }

    /**
     * Cached value
     * @type {Object}
     * @readonly
     */
    data

    /**
     * Creation timestamp (Unix seconds)
     * @type {Number}
     * @readonly
     */
    ts

    /**
     * Time-to-live in seconds
     * @type {Number}
     * @readonly
     */
    ttl

    /**
     * Whether the entry outlived its ttl and should be refreshed
     * @return {Boolean}
     */
    get isExpired() {
        return new Date().getTime() / 1000 > this.ts + this.ttl
    }

    /**
     * Whether the entry outlived 3*ttl and should be discarded entirely
     * @return {Boolean}
     */
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
