import {useEffect, useState} from 'react'
import {useExplorerApi} from '../api/explorer-api-hooks'
import {getCurrentStellarNetwork} from '../state/stellar-network-hooks'

/**
 * React hook that fetches contract information from the Explorer API
 * @param {string} address - Contract address
 * @return {ExplorerApiResult}
 */
export function useContractInfo(address) {
    return useExplorerApi('contract/' + address, {
        processResult(data) {
            if (data?.error && (data.status || data.error.status) === 404) {
                data.nonExistentContract = true
            }
            data.address = address
            return data
        }
    })
}

/**
 * Generate a URL to download the WASM source for a contract
 * @param {string} hash - Contract WASM hash
 * @return {string} Full URL to the contract WASM source
 */
export function generateContractSourceLink(hash) {
    return `${explorerApiOrigin}/explorer/${getCurrentStellarNetwork()}/contract/wasm/${hash}`
}

/**
 * React hook that fetches contract WASM binary source by hash
 * @param {string} hash - Contract WASM hash
 * @return {ArrayBuffer|null|undefined} WASM binary (undefined while loading, null if not found)
 */
export function useContractSource(hash) {
    const [source, setSource] = useState()
    useEffect(() => {
        if (!hash) {
            setSource(null)
            return
        }
        fetch(generateContractSourceLink(hash))
            .then(res => res.ok && res.arrayBuffer())
            .then(src => setSource(src))
    }, [hash])
    return source
}