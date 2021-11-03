import {getCurrentStellarNetwork} from '../state/stellar-network-hooks'

/**
 * @param {'account'|'asset'|'ledger'|'tx'|'op'|'offer'} type
 * @param {String|Number} id
 * @return {String}
 */
export function formatExplorerLink(type, id) {
    return `${explorerFrontendOrigin}/explorer/${getCurrentStellarNetwork()}/${type}/${id}`
}