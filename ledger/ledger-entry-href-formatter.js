import {getCurrentStellarNetwork} from '../state/stellar-network-hooks'

/**
 * @param {'account'|'asset'|'ledger'|'tx'|'op'|'offer'} type
 * @param {String|Number} id
 * @param {String} network?
 * @return {String}
 */
export function formatExplorerLink(type, id, network = null) {
    const segments = [
        explorerFrontendOrigin !== window.origin ? explorerFrontendOrigin : '',
        'explorer',
        network || getCurrentStellarNetwork()
    ]
    if (type) {
        segments.push(type)
    }
    if (id) {
        segments.push(id)
    }
    return segments.join('/')
}