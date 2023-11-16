import {parseStellarGenericId} from '../stellar/ledger-generic-id'
import {getCurrentStellarNetwork} from '../state/stellar-network-hooks'
import {fetchExplorerApi} from './explorer-api-call'

/**
 * Load transaction from API
 * @param {String} txHashOrId - Transaction hash or generic id
 * @return {Promise<Object>}
 */
export function loadTransaction(txHashOrId) {
    if (/^\d+$/.test(txHashOrId)) { //treat as generic tx id
        const {type} = parseStellarGenericId(txHashOrId)
        if (type !== 'transaction')
            return Promise.reject(new Error('Invalid transaction id: ' + txHashOrId))
    } else if (!/^[a-fA-F0-9]{64}$/.test(txHashOrId))
        return Promise.reject(new Error('Invalid transaction hash or id: ' + txHashOrId))

    return fetchExplorerApi(getCurrentStellarNetwork() + '/tx/' + txHashOrId)
}


/**
 * Load transactions included into the ledger
 * @param {Number} sequence - Ledger sequence
 * @return {Promise<Array<Object>>}
 */
export function loadLedgerTransactions(sequence) {
    return fetchExplorerApi(getCurrentStellarNetwork() + '/ledger/' + sequence + '/tx')
}