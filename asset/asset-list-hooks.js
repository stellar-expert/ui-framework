import React, {useState} from 'react'
import {throttle} from 'throttle-debounce'
import equal from 'react-fast-compare'
import apiCall from '../api/explorer-api-call'
import {useDeepEffect} from '../state/state-hooks'
import {stringifyQuery} from '../state/navigation'
import {getCurrentStellarNetwork} from '../state/stellar-network-hooks'

const defaults = {
    limit: 20,
    order: 'desc',
    sort: 'rating'
}

/**
 *
 * @param {Object} params
 * @return {{assets: Array<Object>, loadPage: Function, loading: Boolean}}
 */
export function useAssetList(params) {
    const [loading, setLoading] = useState(false),
        [cursor, setCursor] = useState(),
        [assets, setAssets] = useState({data: [], params}),
        loadPage = throttle(1000, function () {
            const endpoint = getCurrentStellarNetwork() + '/asset' + stringifyQuery({...defaults, ...params, cursor})
            setLoading(true)
            apiCall(endpoint)
                .then(({_embedded}) => {
                    const res = _embedded.records
                    if (res.length) {
                        setCursor(res[res.length - 1].paging_token)
                    }
                    setAssets(existing => {
                        let data = res
                        if (equal(params, assets.params)) {
                            data = [...existing.data, ...res]
                        } else {
                            setCursor(undefined)
                        }
                        return {data, params}
                    })
                    setLoading(false)
                })
                .catch(e => console.error(e))
                .finally(() => {
                    setLoading(false)
                })
        })
    useDeepEffect(() => {
        loadPage()
    }, [params])

    return {assets: assets.data, loadPage, loading}
}