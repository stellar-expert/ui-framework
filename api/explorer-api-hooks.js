import {useEffect, useState} from 'react'
import isEqual from 'react-fast-compare'
import apiCache from './api-cache'
import fetchExplorerApi from './explorer-api-call'
import {stringifyQuery} from '../state/navigation'
import {addVisibilityChangeListener, isDocumentVisible} from '../state/page-visibility-helpers'
import {getCurrentStellarNetwork} from '../state/stellar-network-hooks'

class APIResult {
    constructor(data, ts) {
        this.data = data
        this.fetchedAt = ts
    }

    data = null

    fetchedAt = 0

    get loaded() {
        return !!this.data
    }

    update(data) {
        this.data = data
    }
}

function buildAPIResult(data, ts) {
    return new APIResult(data, ts)
}

function setupAutoRefresh(refreshInterval, fetchData) {
    if (!refreshInterval) return () => null

    let autoRefreshTimer,
        refreshedAt = 0

    function scheduleAutoRefresh() {
        autoRefreshTimer = setInterval(() => {
            //refresh only when the tab is active
            if (isDocumentVisible()) {
                const now = new Date().getTime()
                if (refreshedAt + (refreshInterval - 1) * 1000 < now) {
                    refreshedAt = now
                    fetchData()
                }
            } else {
                stopAutoRefresh()
            }
        }, refreshInterval * 1000)
    }

    function stopAutoRefresh() {
        clearInterval(autoRefreshTimer)
        autoRefreshTimer = undefined
    }

    const stopVisibilityTracking = addVisibilityChangeListener(visible => {
        if (visible) {
            scheduleAutoRefresh()
        } else {
            stopAutoRefresh()
        }
    })
    if (isDocumentVisible()) {
        scheduleAutoRefresh()
    }
    //return finalizer
    return function () {
        refreshInterval = 0
        stopVisibilityTracking()
        stopAutoRefresh()
    }
}

const currentRequests = {}

function fetchData(url, ttl, processResult) {
    //try to retrieve data from the browser cache
    const fromCache = apiCache.get(url)
    //check if the cache is fresh enough
    if (fromCache && !fromCache.isExpired) {
        //if the cached data is up to date - just proceed with it
        return Promise.resolve({data: fromCache.data, ts: fromCache.ts})
    }
    const existingRequest = currentRequests[url]
    if (existingRequest) return existingRequest
    //fetch from the server only if there is no data or it is expired
    return currentRequests[url] = fetchExplorerApi(url)
        .then(data => {
            if (typeof processResult === 'function') {
                data = processResult(data)
            }
            //in case of error set small ttl in order to try re-fetching in 4 seconds
            const {ts} = apiCache.set(url, data, data.error ? 4 : ttl)
            delete currentRequests[url]
            return {data, ts}
        })
}

/**
 *
 * @param {String|APIEndpointParams} apiEndpoint - Server API endpoint to use as a data source.
 * @param {Number} [refreshInterval] - Auto-refresh interval in seconds for dynamic data.
 * @param {Number} [ttl] - Cache time-to-live in seconds.
 * @param {Function} [processResult] - Callback to process a fetch result.
 * @return {APIResponse}
 */
export function useAPI(apiEndpoint, {refreshInterval, ttl = 60, processResult} = {}) {
    const [apiResponseData, updateApiResponseData] = useState(() => buildAPIResult())
    useEffect(() => {
        let componentUnmounted = false

        if (!apiEndpoint) {
            updateApiResponseData({error: 'Not found', status: 404, loaded: true})
            return
        }

        if (typeof apiEndpoint !== 'string') {
            apiEndpoint = apiEndpoint.path + stringifyQuery(apiEndpoint.query)
        }

        const endpointWithQuery = `${getCurrentStellarNetwork()}/${apiEndpoint}`

        function load() {
            fetchData(endpointWithQuery, ttl, processResult)
                .then(({data, ts}) => {
                    if (componentUnmounted) return

                    const newData = buildAPIResult(data, ts)

                    if (!isEqual(newData, apiResponseData)) {
                        updateApiResponseData(newData)
                    }
                })
        }

        if (!componentUnmounted) {
            load()
        }

        //set up auto-refresh
        const stopAutoRefresh = setupAutoRefresh(refreshInterval, load)

        return () => {
            //finalize
            componentUnmounted = true
            stopAutoRefresh()
        }
    }, [apiEndpoint])

    return apiResponseData
}


/**
 * @typedef {Object} APIResponse
 * @property {Object} data
 * @property {Boolean} loaded
 * @property {Number} fetchedAt
 */

/**
 * @typedef {Object} APIEndpointParams
 * @property {String} path
 * @property {Object} query
 */