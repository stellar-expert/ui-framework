import {useEffect, useState} from 'react'
import {StrKey} from '@stellar/stellar-base'
import {stringifyQuery} from '@stellar-expert/navigation'
import {InMemoryClientCache} from '@stellar-expert/client-cache'
import {fetchExplorerApi} from '../api/explorer-api-call'
import {ExplorerBatchInfoLoader} from '../api/explorer-batch-info-loader'

const cache = new InMemoryClientCache({})

const loader = new ExplorerBatchInfoLoader(batch => {
    return fetchExplorerApi('directory' + stringifyQuery({address: batch}))
}, entry => {
    cache.set(entry.address, entry)
    return {key: entry.address, info: entry}
})

export async function getDirectoryEntry(address, options) {
    const {forceRefresh = false, extended = false} = options || {}
    //ignore invalid addresses
    if (!address || !StrKey.isValidEd25519PublicKey(address)) return null
    if (extended) {
        return fetchExplorerApi(`directory/${address}` + stringifyQuery({
            extended: true,
            s: Math.random().toString(36).substr(2)
        }))
            .catch(err => {
                console.error(err)
                return null
            })
    }
    //try to load from the shared cache
    if (forceRefresh) {
        const cachedEntry = cache.get(address)
        if (cachedEntry && !cachedEntry.isExpired) return cachedEntry.data
    }
    //load from the server
    return loader.loadEntry(address)
}

/**
 *
 * @param {String} address
 * @param {{[forceRefresh]: Boolean}} [options]
 * @return {String|null}
 */
export function useDirectory(address, options) {
    const {forceRefresh = false} = options || {}
    const [directoryInfo, setDirectoryInfo] = useState(null)
    let unloaded = false
    useEffect(function () {
        if (!address || !(StrKey.isValidEd25519PublicKey(address) || StrKey.isValidContract(address)))
            return
        if (!forceRefresh) {
            const cachedEntry = cache.get(address)
            if (cachedEntry && !cachedEntry.isStale) {
                if (!cachedEntry.isExpired)
                    return setDirectoryInfo(cachedEntry.data) //everything is up to date - no need to re-fetch
            }
        }
        //load from the server
        loader.loadEntry(address)
            .then(di => {
                if (!unloaded) {
                    setDirectoryInfo(di)
                }
            })
        return () => {
            unloaded = true
        }
    }, [address, forceRefresh])
    return directoryInfo
}

export function useDirectoryTags() {
    const [tags, setTags] = useState(() => {
        const cachedEntry = cache.get('tags')
        if (cachedEntry && !cachedEntry.isExpired) {
            return cachedEntry.data
        }
        fetchExplorerApi('directory/tags')
            .then(data => {
                cache.set('tags', data, 10 * 60) //10 minutes
                setTags(data)
            })
            .catch(err => console.error(err))
        return []
    })
    return tags
}