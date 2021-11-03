import {useState, useEffect} from 'react'

const listeners = []
let currentNetwork = 'public'

setStellarNetwork(currentNetwork)

function removeListener(callback) {
    const idx = listeners.indexOf(callback)
    if (~idx) listeners.splice(idx, 1)
}

export function getCurrentStellarNetwork() {
    return currentNetwork
}

/**
 * Set current Stellar network.
 * @param {'testnet'|'public'} network
 */
export function setStellarNetwork(network) {
    if (currentNetwork === network) return
    currentNetwork = network
    for (const listener of listeners) {
        listener(network)
    }
}

export function subscribeToStellarNetworkChange(onChange) {
    removeListener(onChange)
    listeners.push(onChange)
}

/**
 * React hook for reacting on Stellar network changes.
 * @return {'testnet'|'public'}
 */
export function useStellarNetwork() {
    const [state, updateState] = useState(currentNetwork)
    useEffect(() => {
        subscribeToStellarNetworkChange(updateState)
        return () => removeListener(updateState)
    }, [])
    return state
}