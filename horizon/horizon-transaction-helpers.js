import Bignumber from 'bignumber.js'
import {parseStellarGenericId} from '@stellar-expert/ui-framework'
import {initHorizon, applyListQueryParameters} from './horizon-client-helpers'

/**
 * Load a transaction from Horizon
 * @param {string} txHashOrId - Transaction hash or generic id
 * @return {Promise<Object>}
 */
export function loadTransaction(txHashOrId) {
    if (/^[a-fA-F0-9]{64}$/.test(txHashOrId))
        return initHorizon().transactions().transaction(txHashOrId)
            .call()

    if (/^\d+$/.test(txHashOrId)) { //treat as generic tx id
        let {type, tx} = parseStellarGenericId(txHashOrId)
        if (type !== 'transaction') return Promise.reject(new Error('Invalid transaction id: ' + id))
        let cursor = new Bignumber(tx).minus(1).toString()
        return loadTransactions({cursor, order: 'asc', limit: 1, includeFailed: true})
            .then(res => res[0])
    }
    return Promise.reject(new Error(`Invalid transaction hash or id: ${txHashOrId}`))
}

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
 * Load transactions included into the ledger
 * @param {Number} sequence - Ledger sequence
 * @param {ListQueryParams} [queryParams] - Query parameters (optional)
 * @return {Promise<Array<Object>>}
 */
export function loadLedgerTransactions(sequence, queryParams = null) {
    const query = applyListQueryParameters(initHorizon().transactions().forLedger(sequence), queryParams)
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
