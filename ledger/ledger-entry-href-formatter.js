import {getCurrentStellarNetwork} from '../state/stellar-network-hooks'

/**
 * @param {'account'|'asset'|'ledger'|'tx'|'op'|'offer'} type
 * @param {String|Number} id
 * @return {String}
 */
export function formatExplorerLink(type, id) {
    const segments = [
        explorerFrontendOrigin !== window.origin ? explorerFrontendOrigin : '',
        'explorer',
        getCurrentStellarNetwork()
    ]
    if (type) {
        segments.push(type)
    }
    if (id) {
        segments.push(id)
    }
    return segments.join('/')
}