import React, {useState} from 'react'
import {throttle} from 'throttle-debounce'
import {useDeepEffect} from '../state/state-hooks'
import apiCall from '../api/explorer-api-call'
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
        [assets, setAssets] = useState([]),
        loadPage = throttle(1000, function () {
            let endpoint = getCurrentStellarNetwork() + '/asset' + stringifyQuery({...defaults, ...params, cursor})
            setLoading(true)
            apiCall(endpoint)
                .then(({_embedded}) => {
                    const res = _embedded.records
                    if (res.length) {
                        setCursor(res[res.length - 1].paging_token)
                    }
                    setAssets(existing => [...existing, ...res])
                    setLoading(false)
                })
                .catch(e => console.error(e))
                .finally(() => {
                    setLoading(false)
                })
        })
    useDeepEffect(() => {
        setCursor(undefined)
        setAssets([])
        loadPage()
    }, [params])

    return {assets, loadPage, loading}
}