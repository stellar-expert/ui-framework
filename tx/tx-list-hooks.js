import {useExplorerPaginatedApi} from '../api/explorer-api-paginated-list-hooks'
import {useExplorerApi} from '../api/explorer-api-hooks'

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

export function useTxInfo(idOrHash) {
    return useExplorerApi(`tx/${idOrHash}`)
}