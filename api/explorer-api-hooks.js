import {useEffect, useState} from 'react'
import isEqual from 'react-fast-compare'
import {stringifyQuery} from '@stellar-expert/navigation'
import {addVisibilityChangeListener, isDocumentVisible} from '../state/page-visibility-helpers'
import {useStellarNetwork} from '../state/stellar-network-hooks'
import {fetchExplorerApi} from './explorer-api-call'
import apiCache from './api-cache'

export class ExplorerApiResult {
    constructor(apiEndpoint, data, ts) {
        this.apiEndpoint = apiEndpoint
        this.data = data
        this.fetchedAt = ts
    }

    /**
     * Relative API URL
     * @type {String}
     */
    apiEndpoint

    /**
     * API response data
     * @type {Object}
     */
    data = null

    /**
     * Response error if any
     * @type {String}
     */
    error

    /**
     * @type {Number}
     */
    status = 200

    /**
     * Response timestamp
     * @type {Number}
     */
    fetchedAt = 0

    /**
     * Response result
     * @return {Boolean}
     */
    get loaded() {
        return !!this.data || !!this.error
    }

    /**
     * @private
     */
    update(data) {
        this.data = data
    }
}

function buildApiResult(apiEndpoint, data, ts) {
    return new ExplorerApiResult(apiEndpoint, data, ts)
}

function buildApiError(apiEndpoint, error, status) {
    const res = new ExplorerApiResult(apiEndpoint, null, Math.round(new Date().getTime() / 1000))
    res.error = error
    res.status = status
    return res
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

export function fetchData(url, ttl, processResult) {
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
 * @param {Boolean} [allowStaleDataTransition] - Allow stale data to be returned when the url changed and the new data has not been loaded yet.
 * @return {ExplorerApiResult}
 */
export function useExplorerApi(apiEndpoint, {refreshInterval, ttl = 60, processResult, allowStaleDataTransition = false} = {}) {
    const network = useStellarNetwork()
    const endpointWithQuery = `${network}/${apiEndpoint}`
    const [apiResponseData, updateApiResponseData] = useState(buildApiResult(endpointWithQuery))
    useEffect(() => {
        let componentUnmounted = false
        updateApiResponseData(buildApiResult(endpointWithQuery))

        if (!apiEndpoint) {
            updateApiResponseData(buildApiError(endpointWithQuery, 'Not found', 404))
            return
        }

        if (typeof apiEndpoint !== 'string') {
            apiEndpoint = apiEndpoint.path + stringifyQuery(apiEndpoint.query)
        }

        function load() {
            fetchData(endpointWithQuery, ttl, processResult)
                .then(({data, ts}) => {
                    if (componentUnmounted) return

                    const newData = buildApiResult(endpointWithQuery, data, ts)

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
    if (apiResponseData.apiEndpoint !== endpointWithQuery && !allowStaleDataTransition)
        return buildApiResult(endpointWithQuery) //return empty result on URL transition if allowStaleDataTransition not set

    return apiResponseData
}

/**
 * @typedef {Object} APIEndpointParams
 * @property {String} path
 * @property {Object} query
 */