import React, {useState} from 'react'
import {useDependantState} from '../state/state-hooks'
import apiCall from '../api/explorer-api-call'
import {stringifyQuery} from '../state/navigation'

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
        [assets, setAssets] = useDependantState(() => {
            setCursor(undefined)
            loadPage()
            return []
        }, [params])


    function loadPage() {
        let endpoint = explorerNetwork + '/asset' + stringifyQuery({...defaults, ...params, cursor})
        setLoading(true)
        apiCall(endpoint)
            .then(({_embedded}) => {
                const res = _embedded.records
                if (res.length) {
                    setAssets(assets => [...assets, ...res])
                    setCursor(res[res.length - 1].paging_token)
                }
            })
            .catch(e => console.error(e))
            .finally(() => {
                setLoading(false)
            })
    }

    return {assets, loadPage, loading}
}