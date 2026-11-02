import {getCurrentStellarNetwork} from '../state/stellar-network-hooks'
import {fetchExplorerApi} from './explorer-api-call'

/**
 * Long-polling stream that notifies listeners about new ledgers
 */
class LedgerStream {
    constructor() {
        this.listeners = new Set()
    }

    /**
     * @type {boolean}
     * @private
     */
    listening = false
    /**
     * @type {Set<function>}
     * @private
     */
    listeners
    /**
     * Number of consecutive failed requests, used for the retry backoff
     * @type {number}
     * @private
     */
    failures = 0

    /**
     * @param {function} listener
     */
    on(listener) {
        this.listeners.add(listener)
        if (!this.listening) {
            this.listening = true
            setTimeout(() => this.waitForLedger(), 100)
        }
    }

    /**
     * @param {function} listener
     */
    off(listener) {
        this.listeners.delete(listener)
        if (!this.listeners.size) {
            this.listening = false
        }
    }

    /**
     * @param {number} ledger
     * @private
     */
    notify(ledger) {
        for (const listener of this.listeners) {
            listener(ledger)
        }
    }

    /**
     * @return {Promise}
     * @private
     */
    async waitForLedger() {
        const url = `${explorerApiOrigin}/explorer/${getCurrentStellarNetwork()}/ledger/stream`
        try {
            const resp = await fetch(url, {keepalive: true, cache: 'no-cache'})
            if (!resp.ok) {
                let errorExt
                try {
                    errorExt = await resp.json()
                } catch (parsingError) {
                    errorExt = {}
                }
                const err = new Error(errorExt?.error || resp.statusText || 'Failed to fetch data from the server')
                err.status = resp.status
                err.ext = errorExt
                err.retryAfter = parseInt(resp.headers.get('Retry-After'), 10)
                throw err
            }
            const {ledger} = await resp.json()
            this.failures = 0
            this.notify(ledger)
            if (this.listening) {
                setTimeout(() => this.waitForLedger(), 1000)
            }
        } catch (e) {
            console.error(e)
            if (this.listening) {
                //resume streaming after the delay requested by the server, or with an exponential backoff (2s up to 1m)
                const delay = e.retryAfter > 0 ? e.retryAfter * 1000 : Math.min(2000 * 2 ** this.failures, 60000)
                this.failures++
                setTimeout(() => this.waitForLedger(), delay)
            }
            if (e instanceof Error) {
                e = {
                    error: e.message,
                    status: e.status || 500,
                    ext: e.ext
                }
            }
            if (e.ext && e.ext.status) {
                e.status = e.ext.status
            }
            return e
        }
    }

    /**
     * Fetch the most recent ledger info from the API
     * @return {Promise<Object>}
     */
    async getLast() {
        return fetchExplorerApi(getCurrentStellarNetwork() + '/ledger/last')
    }

    /**
     * Fetch the sequence number of the most recent ledger
     * @return {Promise<number>}
     */
    async getLastSequence() {
        return (await this.getLast()).sequence
    }
}

/**
 * Singleton ledger stream instance for subscribing to new ledger notifications
 * @type {LedgerStream}
 */
export const ledgerStream = new LedgerStream()