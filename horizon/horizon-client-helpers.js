import {Server} from 'stellar-sdk'

export function initHorizon() {
    return new Server(window.horizonOrigin)
}


/**
 * Load all data from the horizon query using next() iteration
 * @param {CallBuilder} query
 * @return {Promise<Object[]>}
 */
async function loadAllHorizonRecords(query) {
    let res = []
    let response = await query.call()
    while (true) {
        const {records = []} = response
        const limitParam = (query.url.query() || '')
            .split('&')
            .find(q => q.indexOf('limit=') === 0)
        const limit = (limitParam && parseInt(limitParam.split('=')[1])) || 10
        if (!records.length) break
        res = res.concat(records)
        if (records.length < limit) break
        response = await response.next()
    }
    return {records: res}
}


/**
 * @typedef {Object} ListQueryParams
 * @property {string} [cursor] - Paging cursor.
 * @property [('asc'|'desc'))] [order] - Sort order.
 * @property {number} [limit] - Page size (200 by default).
 */

/**
 * Apply list query parameters to horizon query
 * @param {object} query - Horizon query.
 * @param {object} queryParameters - Parameters to apply.
 * @return {object}
 */
export function applyListQueryParameters(query, queryParameters) {
    const {cursor, order, limit = 200} = queryParameters || {}
    if (cursor) {
        query.cursor(cursor)
    }
    if (order) {
        query.order(order || 'asc')
    }
    query.limit(limit)
    return query
}
