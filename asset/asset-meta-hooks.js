import apiCall from '../api/explorer-api-call'
import {BatchInfoLoader} from '../api/batch-info-loader'
import {useDependantState} from '../state/state-hooks'
import ClientCache from '../api/client-cache'
import {stringifyQuery} from '../state/navigation'
import {useEffect, useState} from 'react'
import {AssetDescriptor} from './asset-descriptor'

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

const cache = new ClientCache({prefix: 'am:'})

const loader = new BatchInfoLoader(batch => {
    return apiCall(explorerNetwork + '/asset/meta' + stringifyQuery({asset: batch}))
}, entry => {
    cache.set(entry.name, entry)
    return {key: entry.name, info: entry}
})

function retrieveFromCache(asset) {
    //try to load from the shared cache
    const cachedEntry = cache.get(asset)
    if (cachedEntry && !cachedEntry.isStale) {
        if (!cachedEntry.isExpired) return cachedEntry.data//everything is up to date - no need to re-fetch
    }
}

/**
 *
 * @param {AssetDescriptor|String} asset
 * @return {AssetMeta}
 */
export function useAssetMeta(asset) {
    if (typeof asset !== 'string') {
        asset = new AssetDescriptor(asset).toFQAN()
    }
    const [assetInfo, setAssetInfo] = useState(retrieveFromCache(asset))
    useEffect(() => {
        const cached = retrieveFromCache(asset)
        if (cached) {
            setAssetInfo(cached)
            return
        }
        //load from the server
        loader.loadEntry(asset)
            .then(setAssetInfo)
    }, [asset])

    return assetInfo
}