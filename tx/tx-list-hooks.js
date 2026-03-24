import {useExplorerPaginatedApi} from '../api/explorer-api-paginated-list-hooks'
import {useExplorerApi} from '../api/explorer-api-hooks'

/**
 * React hook that fetches paginated transaction history from the Explorer API
 * @param {Object} params
 * @param {Object} params.filters - Query filters (e.g., `{account: [address]}`)
 * @param {'asc'|'desc'} [params.order='desc'] - Sort order
 * @param {number} [params.rows=40] - Number of rows per page
 * @param {boolean} [params.updateLocation=true] - Update browser query string on navigation
 * @return {ExplorerApiListResponse}
 */
export function useTxHistory({filters, order = 'desc', rows = 40, updateLocation = true}) {
    return useExplorerPaginatedApi(
        {
            path: 'tx',
            query: filters
        }, {
            defaultSortOrder: order,
            limit: rows,
            updateLocation,
            defaultQueryParams: {order}
        })
}

/**
 * React hook that fetches transaction details by ID or hash
 * @param {string} idOrHash - Transaction ID or hash
 * @return {ExplorerApiResult}
 */
export function useTxInfo(idOrHash) {
    return useExplorerApi(`tx/${idOrHash}`)
}