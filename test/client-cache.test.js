import {CacheItem, InMemoryClientCache} from '../client-cache/index.js'

describe('CacheItem', () => {
    test('tracks expiration and staleness against ttl', () => {
        const now = Math.round(Date.now() / 1000)
        expect(new CacheItem('x', now, 60).isExpired).toBe(false)
        expect(new CacheItem('x', now - 61, 60).isExpired).toBe(true)
        expect(new CacheItem('x', now - 61, 60).isStale).toBe(false)
        expect(new CacheItem('x', now - 181, 60).isStale).toBe(true)
    })

    test('is frozen and serializable', () => {
        const item = new CacheItem({a: 1}, 100, 60)
        expect(Object.isFrozen(item)).toBe(true)
        expect(item.toJSON()).toEqual({data: {a: 1}, ts: 100, ttl: 60})
    })
})

describe('InMemoryClientCache', () => {
    test('stores and retrieves values', () => {
        const cache = new InMemoryClientCache()
        cache.set('a', {v: 1})
        expect(cache.get('a').data).toEqual({v: 1})
        expect(cache.has('a')).toBe(true)
        expect(cache.get('missing')).toBeNull()
        expect(cache.has('missing')).toBe(false)
    })

    test('does not start a background timer', () => {
        //the constructor used to schedule an uncancellable setTimeout chain that kept the event loop alive
        const scheduled = []
        const original = global.setTimeout
        global.setTimeout = (...args) => {
            scheduled.push(args)
            return original(() => {}, 0)
        }
        try {
            new InMemoryClientCache()
        } finally {
            global.setTimeout = original
        }
        expect(scheduled).toHaveLength(0)
    })

    test('evicts stale entries lazily on access', () => {
        const cache = new InMemoryClientCache(60)
        cache.set('a', 1)
        //backdate the entry past 3*ttl so it counts as stale
        cache.storage.a = new CacheItem(1, Math.round(Date.now() / 1000) - 181, 60)
        expect(cache.get('a')).toBeNull()
        expect(Object.keys(cache.storage)).toHaveLength(0)
    })

    test('keys() prunes stale entries', () => {
        const cache = new InMemoryClientCache(60)
        const stale = Math.round(Date.now() / 1000) - 181
        cache.set('fresh', 1)
        cache.storage.old = new CacheItem(2, stale, 60)
        expect(cache.keys()).toEqual(['fresh'])
        expect(cache.storage.old).toBeUndefined()
    })

    test('expired but not stale entries survive and stay readable', () => {
        const cache = new InMemoryClientCache(60)
        cache.storage.a = new CacheItem(1, Math.round(Date.now() / 1000) - 61, 60)
        const item = cache.get('a')
        expect(item).not.toBeNull()
        expect(item.isExpired).toBe(true)
        expect(item.isStale).toBe(false)
    })

    test('set() honours an explicit ttl and falls back to the default', () => {
        const cache = new InMemoryClientCache(60)
        expect(cache.set('a', 1, 600).ttl).toBe(600)
        expect(cache.set('b', 1).ttl).toBe(60)
    })

    test('a non-numeric cleanupInterval falls back to the default ttl', () => {
        //call sites used to pass an options object here, which poisoned every ttl comparison with NaN
        const cache = new InMemoryClientCache({prefix: 'ac:'})
        expect(typeof cache.set('a', 1).ttl).toBe('number')
        expect(cache.set('a', 1).isExpired).toBe(false)
    })

    test('delete and clear', () => {
        const cache = new InMemoryClientCache()
        cache.set('a', 1)
        cache.set('b', 2)
        cache.delete('a')
        expect(cache.get('a')).toBeNull()
        cache.clear()
        expect(cache.keys()).toHaveLength(0)
    })
})
