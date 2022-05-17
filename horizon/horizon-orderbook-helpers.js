import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {applyListQueryParameters, initHorizon} from './horizon-client-helpers'

/**
 * Load orderbook for assets.
 * @param {object} selling - Selling asset.
 * @param {object} buying - Buying asset.
 * @param {ListQueryParams} [queryParams] - Query parameters (optional).
 * @return {Promise<Array<object>>}
 */
export function loadOrderbook(selling, buying, queryParams = null) {
    const query = applyListQueryParameters(initHorizon().orderbook(AssetDescriptor.parse(selling).toAsset(), AssetDescriptor.parse(buying).toAsset()), queryParams)
    return query.call()
}
