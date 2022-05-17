import {initHorizon, applyListQueryParameters} from './horizon-client-helpers'

/**
 * Load operations from the Horizon
 * @param {String} operationId - Operation id
 * @return {Promise<Array<Object>>}
 */
export function loadOperation(operationId) {
    return initHorizon().operations().operation(operationId)
        .call()
}

/**
 * Load operations from the Horizon
 * @param {ListQueryParams} [queryParams] - Query parameters (optional)
 * @return {Promise<Array<Object>>}
 */
export function loadOperations(queryParams = null) {
    const query = applyListQueryParameters(initHorizon().operations().includeFailed(queryParams && !!queryParams.includeFailed), queryParams)
    return query.call()
        .then(r=>r.records)
}

/**
 * Load operations for a given transaction
 * @param {String} txId - Transaction id
 * @param {ListQueryParams} [queryParams] - Query parameters (optional)
 * @return {Promise<Array<Object>>}
 */
export function loadTransactionOperations(txId, queryParams = null) {
    const query = applyListQueryParameters(initHorizon().operations().forTransaction(txId), queryParams)
    return query.call()
        .then(r=>r.records)
}

/**
 * Stream operations from Horizon
 * @param {String} cursor - Cursor to start from
 * @param {Function} onNewOperation - Callback to invoke when new operation arrives
 * @param {Boolean} includeFailed - Include failed operations into the stream
 * @return {Function}
 */
export function streamOperations(cursor, onNewOperation, includeFailed = false) {
    return initHorizon().operations().includeFailed(!!includeFailed)
        .order('asc')
        .cursor(cursor || 'now')
        .stream({onmessage: op => onNewOperation(op)})
}
