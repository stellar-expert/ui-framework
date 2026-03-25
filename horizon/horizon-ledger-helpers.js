import {initHorizon, applyListQueryParameters} from './horizon-client-helpers'

/**
 * Load ledgers from Horizon
 * @param {ListQueryParams} [queryParams] - Query parameters (optional)
 * @return {Promise<Array<Object>>}
 */
export function loadLedgers(queryParams = null) {
    const query = applyListQueryParameters(initHorizon().ledgers(), queryParams)
    return query.call()
        .then(r => r.records)
}

/**
 * Load ledger by its sequence
 * @param {number} sequence - Sequence of the ledger to fetch
 * @return {Object}
 */
export function loadLedger(sequence) {
    return initHorizon().ledgers()
        .ledger(sequence)
        .call()
}

/**
 * Stream ledgers from Horizon
 * @param {string} cursor - Cursor to start from
 * @param {function} onNewLedger - Callback to invoke when new ledger arrives
 * @return {function}
 */
export function streamLedgers(cursor, onNewLedger) {
    return initHorizon().ledgers()
        .order('asc')
        .cursor(cursor || 'now')
        .stream({onmessage: ledger => onNewLedger(ledger)})
}