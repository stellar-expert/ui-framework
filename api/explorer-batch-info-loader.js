import {throttle} from 'throttle-debounce'

/**
 * Batches multiple individual load requests into single API calls for efficiency.
 * Accumulates requests over a short window and sends them together.
 */
export class ExplorerBatchInfoLoader {
    /**
     * @param {function(string[]): Promise<{_embedded: {records: Object[]}}>} fetchCallback - Fetches a batch of entries by their keys
     * @param {function(Object): {key?: string, keys?: string[], info: *}} processResponseCallback - Extracts the key (or all
     * keys the record answers to, e.g. an asset name and its contract address) and info from each response record
     * @param {function(string)} [processMissingCallback] - Invoked for requested keys absent from a successful response
     */
    constructor(fetchCallback, processResponseCallback, processMissingCallback) {
        this.pendingRequests = {}
        this.requestsQueue = []
        this.fetchDataFromServer = throttle(500, this.fetchDataFromServer, {noLeading: true})
        this.fetchCallback = fetchCallback
        this.processResponseCallback = processResponseCallback
        this.processMissingCallback = processMissingCallback
    }

    /**
     * @type {{}}
     * @private
     */
    pendingRequests
    /**
     * @type {[]}
     * @private
     */
    requestsQueue = []
    /**
     * @type {function}
     * @private
     */
    fetchCallback
    /**
     * @type {function}
     * @private
     */
    processResponseCallback
    /**
     * @type {function|undefined}
     * @private
     */
    processMissingCallback

    /**
     * Load a single entry by key, batching the request with other pending loads
     * @param {string} key - Entry identifier
     * @return {Promise<*>} Resolves with the entry data or null if not found
     */
    loadEntry(key) {
        //check whether the same address is being fetched right now
        const pending = this.pendingRequests[key]
        if (pending) return pending
        const promise = new Promise(resolve => {
            this.requestsQueue.push({
                key,
                finished: data => {
                    delete this.pendingRequests[key]
                    resolve(data)
                }
            })
            this.fetchDataFromServer()
        })
        this.pendingRequests[key] = promise
        return promise
    }

    fetchDataFromServer() {
        if (!this.requestsQueue.length) return
        const batch = this.requestsQueue.splice(0, 50)
        if (!batch.length) return
        return this.fetchCallback(batch.map(e => e.key))
            .then(data => {
                if (data.error)
                    return //TODO: handle errors in a more elegant way, with retries
                //reschedule another batch fetch if the queue is not empty
                if (this.requestsQueue.length) {
                    setTimeout(() => this.fetchDataFromServer(), 400)
                }
                //remap batch array to an object for the faster elements access
                const batchMap = {}
                for (const {key, finished} of batch) {
                    batchMap[key] = finished
                }
                for (const entry of data._embedded.records) {
                    const {key, keys = [key]} = this.processResponseCallback(entry)
                    //a single record may answer several requested keys
                    for (const k of keys) {
                        const finalizeRequest = batchMap[k]
                        if (finalizeRequest) {
                            finalizeRequest(entry)
                        }
                        //cleanup promise reference
                        delete batchMap[k]
                        delete this.pendingRequests[k]
                    }
                }
                //return null for all keys that have not been found
                for (const key of Object.keys(batchMap)) {
                    this.processMissingCallback?.(key)
                    const finalizeRequest = batchMap[key]
                    if (finalizeRequest) {
                        finalizeRequest(null)
                    }
                    //cleanup promise reference
                    delete this.pendingRequests[key]
                }
            })
            .catch(err => {
                console.error(err)
                //finalize all pending promises with nulls
                for (const {key, finished} of batch) {
                    finished(null)
                    //cleanup promise reference
                    delete this.pendingRequests[key]
                }
            })
    }
}
