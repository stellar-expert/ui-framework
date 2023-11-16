import {initHorizon, applyListQueryParameters} from './horizon-client-helpers'

/**
 * Load transactions from Horizon
 * @param {ListQueryParams} [queryParams] - Query parameters (optional)
 * @return {Promise<Array<Object>>}
 */
export function loadTransactions(queryParams = null) {
    const query = applyListQueryParameters(initHorizon().transactions().includeFailed(queryParams && !!queryParams.includeFailed), queryParams)
    return query.call()
        .then(r => r.records)
}

/**
 * Stream operations from Horizon
 * @param {String} cursor - Cursor to start from
 * @param {Function} onNewTx - Callback to invoke when new operation arrives
 * @param {Boolean} includeFailed - Include failed transactions into the stream
 * @return {Function}
 */
export function streamTransactions(cursor, onNewTx, includeFailed) {
    return initHorizon().transactions().includeFailed(!!includeFailed)
        .order('asc')
        .cursor(cursor || 'now')
        .stream({onmessage: op => onNewTx(op)})
}

/**
 * Submit transaction to Horizon
 * @param {Transaction} tx
 * @returns {Promise<Horizon.SubmitTransactionResponse>}
 */
export function submitTransaction(tx) {
    return initHorizon()
        .submitTransaction(tx)
}
