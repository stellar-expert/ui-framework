import {useExplorerPaginatedApi} from '../api/explorer-api-paginated-list-hooks'
import {useExplorerApi} from '../api/explorer-api-hooks'

export function useTxHistory(filters, order, rows = 40) {
    return useExplorerPaginatedApi(
        {
            path: 'tx',
            query: filters
        }, {
            defaultSortOrder: order,
            limit: rows,
            defaultQueryParams: {order: 'desc'}
        })
}

export function useTxInfo(idOrHash) {
    return useExplorerApi(`tx/${idOrHash}`)
}