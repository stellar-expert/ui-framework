import {getCurrentStellarNetwork} from '../state/stellar-network-hooks'

/**
 * Build URL path to StellarExpert explorer page for given ledger entry
 * @param {'account'|'asset'|'ledger'|'tx'|'op'|'offer'|'contract'|'liquidity-pool'|'claimable-balance'} type
 * @param {string|number} id
 * @param {string} [network]
 * @return {string}
 */
export function formatExplorerLink(type, id, network = null) {
    if (typeof window.explorerLinkFormatter === 'function') {
        const link = window.explorerLinkFormatter(type, id, network)
        if (link)
            return link
    }
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