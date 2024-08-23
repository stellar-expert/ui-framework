import {useEffect, useState} from 'react'
import {useExplorerApi} from '../api/explorer-api-hooks'
import {getCurrentStellarNetwork} from '../state/stellar-network-hooks'

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

export function generateContractSourceLink(hash) {
    return `${explorerApiOrigin}/explorer/${getCurrentStellarNetwork()}/contract/wasm/${hash}`
}

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