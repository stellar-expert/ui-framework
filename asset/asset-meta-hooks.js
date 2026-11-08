import {useEffect, useState} from 'react'
import {AssetDescriptor} from '../asset-descriptor/index.js'
import {InMemoryClientCache} from '../client-cache/index.js'
import {stringifyQuery} from '../navigation/query'
import {fetchExplorerApi} from '../api/explorer-api-call'
import {ExplorerBatchInfoLoader} from '../api/explorer-batch-info-loader'
import {getCurrentStellarNetwork} from '../state/stellar-network-hooks'

/**
 * @typedef AssetBasicTomlInfo
 * @property {string} name
 * @property {string} orgName
 * @property {string} image
 * @property {number} decimals
 */

/**
 * @typedef AssetMeta
 * @property {string} name
 * @property {string} domain
 * @property {AssetBasicTomlInfo} toml_info
 */

const cache = new InMemoryClientCache()

const loader = new ExplorerBatchInfoLoader(batch => {
    return fetchExplorerApi(getCurrentStellarNetwork() + '/asset/meta' + stringifyQuery({asset: batch}))
}, entry => {
    //SAC addresses resolve to the wrapped classic asset record, which carries the requested address in `contract`
    const keys = [entry.name]
    if (entry.contract && entry.contract !== entry.name) {
        keys.push(entry.contract)
    }
    for (const key of keys) {
        cache.set(key, entry)
    }
    return {keys, info: entry}
}, key => {
    //remember assets and contracts without metadata to avoid repeated lookups
    cache.set(key, null)
})

/**
 * @param {string} asset
 * @return {AssetMeta|null|undefined} - Cached metadata, null if the asset has no metadata, undefined if not cached
 */
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
 * @param {AssetDescriptor|string} asset
 * @return {AssetMeta}
 */
export function useAssetMeta(asset) {
    try {
        asset = normalizeAssetName(asset)
    } catch (e) {
        asset = null
    }
    const [assetInfo, setAssetInfo] = useState(retrieveFromCache(asset))
    useEffect(() => {
        if (!asset)
            return
        const cached = retrieveFromCache(asset)
        setAssetInfo(cached)
        if (cached !== undefined)
            return
        let unloaded = false
        //load from the server
        loader.loadEntry(asset)
            .then(a => {
                if (unloaded)
                    return
                setAssetInfo(a)
            })
        return () => {
            unloaded = true
        }
    }, [asset])

    return assetInfo
}