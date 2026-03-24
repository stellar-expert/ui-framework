import {useState, useEffect} from 'react'

/**
 * @typedef {'public'|'testnet'} StellarNetwork
 */

const listeners = []
let currentNetwork = 'public'

setStellarNetwork(currentNetwork)

function removeListener(callback) {
    const idx = listeners.indexOf(callback)
    if (~idx) listeners.splice(idx, 1)
}

/**
 * Get current Stellar network identifier
 * @return {StellarNetwork}
 */
export function getCurrentStellarNetwork() {
    return currentNetwork
}

/**
 * Set current Stellar network
 * @param {StellarNetwork} network
 */
export function setStellarNetwork(network) {
    if (currentNetwork === network) return
    currentNetwork = network
    for (const listener of listeners) {
        listener(network)
    }
}

/**
 * Subscribe to Stellar network change events
 * @param {function(StellarNetwork): void} onChange - Callback invoked when the network changes
 */
export function subscribeToStellarNetworkChange(onChange) {
    removeListener(onChange)
    listeners.push(onChange)
}

/**
 * React hook that returns the current Stellar network and re-renders on network changes
 * @return {StellarNetwork}
 */
export function useStellarNetwork() {
    const [state, updateState] = useState(currentNetwork)
    useEffect(() => {
        subscribeToStellarNetworkChange(updateState)
        return () => removeListener(updateState)
    }, [])
    return state
}