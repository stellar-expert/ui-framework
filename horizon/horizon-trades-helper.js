import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {initHorizon, applyListQueryParameters} from './horizon-client-helpers'

/**
 * Load offer from Horizon for the particular account
 * @param {AssetDescriptor} baseAsset - Base asset descriptor
 * @param {AssetDescriptor} counterAsset - Counter asset descriptor
 * @param {ListQueryParams} [queryParams] - Query parameters (optional)
 * @return {Promise<Array<Object>>}
 */
export function loadMarketTrades(baseAsset, counterAsset, queryParams = null) {
    const q = initHorizon().trades()
        .forAssetPair(baseAsset.toAsset(), counterAsset.toAsset())
    const query = applyListQueryParameters(q, queryParams)
    return query.call()
        .then(r=>r.records)
}


/**
 * Stream trades from Horizon
 * @param {String} cursor - Cursor to start from
 * @param {AssetDescriptor} baseAsset - Base asset descriptor
 * @param {AssetDescriptor} counterAsset - Counter asset descriptor
 * @param {Function} onNewTrade - Callback to invoke when new trade arrives
 * @return {Function}
 */
export function streamMarketTrades(cursor, baseAsset, counterAsset, onNewTrade) {
    return initHorizon().trades()
        .forAssetPair(baseAsset.toAsset(), counterAsset.toAsset())
        .order('asc')
        .cursor(cursor || 'now')
        .stream({onmessage: op => onNewTrade(op)})
}


/**
 * Stream all trades from Horizon
 * @param {String} cursor - Cursor to start from
 * @param {Function} onNewTrade - Callback to invoke when new trade arrives
 * @return {Function}
 */
export function streamTrades(cursor, onNewTrade) {
    return initHorizon().trades()
        .order('asc')
        .cursor(cursor || 'now')
        .limit(200)
        .stream({onmessage: op => onNewTrade(op)})
}


/**
 *
 * @param {String|AssetDescriptor|Asset} base - Base asset
 * @param {String|AssetDescriptor|Asset} counter - Counter asset
 * @param {('5m'|'15m'|'1h'|'1d'|'1w')} resolution - Segment duration
 * @param {Number} period - Period in days
 * @param {Number} [limit] - Max number of records to fetch
 * @return {Promise<TradeAggregationRecord>}
 */
export function loadTradesAggregation({base, counter, resolution, period, limit = 200}) {
    let res
    switch (resolution) {
        case '5m':
            res = 300000
            break
        case '15m':
            res = 900000
            break
        case '1h':
            res = 3600000
            break
        case '1d':
            res = 86400000
            break
        case '1w':
            res = 604800000
            break
        default:
            throw new Error(`Not supported trades aggregation resolution: ${resolution}`)
    }
    const endTime = new Date().getTime(),
        startTime = endTime - period * 24 * 60 * 60 * 1000

    return initHorizon()
        .tradeAggregation(AssetDescriptor.parse(base).toAsset(), AssetDescriptor.parse(counter).toAsset(), startTime, endTime, res, 0)
        .limit(limit)
        .call()
}