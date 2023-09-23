import {useEffect, useState} from 'react'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {stringifyQuery} from '@stellar-expert/navigation'
import {InMemoryClientCache} from '@stellar-expert/client-cache'
import apiCall from '../api/explorer-api-call'
import {ExplorerBatchInfoLoader} from '../api/explorer-batch-info-loader'
import {getCurrentStellarNetwork} from '../state/stellar-network-hooks'

/**
 * @typedef AssetBasicTomlInfo
 * @property {String} name
 * @property {String} orgName
 * @property {String} image
 * @property {Number} decimals
 */

/**
 * @typedef AssetMeta
 * @property {String} name
 * @property {String} domain
 * @property {AssetBasicTomlInfo} toml_info
 */

const cache = new InMemoryClientCache()

const loader = new ExplorerBatchInfoLoader(batch => {
    return apiCall(getCurrentStellarNetwork() + '/asset/meta' + stringifyQuery({asset: batch, origin: window.location.origin}))
}, entry => {
    cache.set(entry.name, entry)
    return {
        key: entry.name,
        info: entry
    }
})

function retrieveFromCache(asset) {
    //try to load from the shared cache
    const cachedEntry = cache.get(asset)
    if (cachedEntry && !cachedEntry.isStale) {
        if (!cachedEntry.isExpired)
            return cachedEntry.data//everything is up to date - no need to re-fetch
    }
}

function normalizeAssetName(asset) {
    if (!asset)
        return null
    if (typeof asset === 'string' && asset.length === 56)
        return asset //contract id
    return AssetDescriptor.parse(asset).toFQAN()
}

/**
 *
 * @param {AssetDescriptor|String} asset
 * @return {AssetMeta}
 */
export function useAssetMeta(asset) {
    asset = normalizeAssetName(asset)
    const [assetInfo, setAssetInfo] = useState(retrieveFromCache(asset))
    useEffect(() => {
        if (!asset)
            return
        const cached = retrieveFromCache(asset)
        setAssetInfo(cached)
        if (cached)
            return
        let unloaded = false
        //load from the server
        loader.loadEntry(asset)
            .then(a => !unloaded && setAssetInfo(a))
        return () => {
            unloaded = true
        }
    }, [asset])

    return assetInfo
}