import {useState} from 'react'
import {StrKey} from 'stellar-sdk'
import ClientCache from '../api/client-cache'
import {useDependantState} from '../state/state-hooks'
import apiCall from '../api/explorer-api-call'
import {BatchInfoLoader} from '../api/batch-info-loader'
import {stringifyQuery} from '../state/navigation'

const cache = new ClientCache({prefix: 'dm:'})

const loader = new BatchInfoLoader(batch => {
    return apiCall('directory' + stringifyQuery({address: batch}))
}, entry => {
    cache.set(entry.address, entry)
    return {key: entry.address, info: entry}
})

export async function getDirectoryEntry(address, options) {
    const {forceRefresh = false, extended = false} = options || {}
    //ignore invalid addresses
    if (!address || !StrKey.isValidEd25519PublicKey(address)) return null
    if (extended) {
        return apiCall(`directory/${address}` + stringifyQuery({
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
    let unloaded = false
    const [directoryInfo, setDirectoryInfo] = useDependantState(() => {
        if (!address || !StrKey.isValidEd25519PublicKey(address)) return null
        let info = null
        //try to load from the shared cache
        if (!forceRefresh) {
            const cachedEntry = cache.get(address)
            if (cachedEntry && !cachedEntry.isStale) {
                info = cachedEntry.data
                if (!cachedEntry.isExpired) return info//everything is up to date - no need to re-fetch
            }
        }
        //load from the server
        loader.loadEntry(address)
            .then(di => unloaded && setDirectoryInfo(di))
        return info
    }, [address, options], () => {
        unloaded = true
    })
    return directoryInfo
}

export function useDirectoryTags() {
    const [tags, setTags] = useState(() => {
        const cachedEntry = cache.get('tags')
        if (cachedEntry && !cachedEntry.isExpired) {
            return cachedEntry.data
        }
        apiCall('directory/tags')
            .then(data => {
                cache.set('tags', data, 10 * 60) //10 minutes
                setTags(data)
            })
            .catch(err => console.error(err))
        return []
    })
    return tags
}