import apiCall from '../api/explorer-api-call'
import {BatchInfoLoader} from '../api/batch-info-loader'
import {useDependantState} from '../state/state-hooks'
import ClientCache from '../api/client-cache'
import {stringifyQuery} from '../state/navigation'

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

/**
 *
 * @param {AssetDescriptor|String} asset
 * @return {AssetMeta}
 */
export function useAssetMeta(asset) {
    if (typeof asset !== 'string') {
        asset = asset.toFQAN()
    }
    const [assetInfo, setAssetInfo] = useDependantState(() => {
        if (!asset) return null
        let info = null
        //try to load from the shared cache
        const cachedEntry = cache.get(asset)
        if (cachedEntry && !cachedEntry.isStale) {
            info = cachedEntry.data
            if (!cachedEntry.isExpired) return info//everything is up to date - no need to re-fetch
        }
        //load from the server
        loader.loadEntry(asset)
            .then(di => setAssetInfo(di))
        return info
    }, [asset])
    return assetInfo
}