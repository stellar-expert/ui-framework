import {initHorizon, applyListQueryParameters} from './horizon-client-helpers'

/**
 * Load effects for a given operation
 * @param {String} operationId - Operation id
 * @param {ListQueryParams} [queryParams] - Query parameters (optional)
 * @return {Promise<Array<object>>}
 */
export function loadOperationEffects(operationId, queryParams = null) {
    const query = applyListQueryParameters(initHorizon().effects().forOperation(operationId), queryParams)
    return query.call()
        .then(r => r.records)
}