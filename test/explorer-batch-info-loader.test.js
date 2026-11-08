import {ExplorerBatchInfoLoader} from '../api/explorer-batch-info-loader'

describe('ExplorerBatchInfoLoader', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    /**
     * Queue entry requests and flush the throttled batch fetch
     * @param {ExplorerBatchInfoLoader} loader
     * @param {string[]} keys
     * @return {Promise<*[]>}
     */
    function load(loader, keys) {
        const requests = keys.map(key => loader.loadEntry(key))
        jest.advanceTimersByTime(600)
        return Promise.all(requests)
    }

    test('resolves every key a record answers to and reports missing keys', async () => {
        const record = {name: 'XLM', contract: 'CSAC'}
        const fetchBatch = jest.fn(async () => ({_embedded: {records: [record]}}))
        const missing = jest.fn()
        const loader = new ExplorerBatchInfoLoader(fetchBatch, entry => ({keys: [entry.name, entry.contract], info: entry}), missing)
        const [xlm, sac, router] = await load(loader, ['XLM', 'CSAC', 'CROUTER'])
        expect(fetchBatch).toHaveBeenCalledWith(['XLM', 'CSAC', 'CROUTER'])
        expect(xlm).toBe(record)
        expect(sac).toBe(record)
        expect(router).toBeNull()
        expect(missing.mock.calls).toEqual([['CROUTER']])
    })

    test('supports single-key records', async () => {
        const loader = new ExplorerBatchInfoLoader(async () => ({_embedded: {records: [{address: 'GA'}]}}), entry => ({key: entry.address, info: entry}))
        const [found, notFound] = await load(loader, ['GA', 'GB'])
        expect(found).toEqual({address: 'GA'})
        expect(notFound).toBeNull()
    })

    test('does not report keys as missing when the request fails', async () => {
        const missing = jest.fn()
        const error = jest.spyOn(console, 'error').mockImplementation(() => {})
        const loader = new ExplorerBatchInfoLoader(() => Promise.reject(new Error('Network error')), entry => ({key: entry.name, info: entry}), missing)
        expect(await load(loader, ['XLM'])).toEqual([null])
        expect(missing).not.toHaveBeenCalled()
        error.mockRestore()
    })
})
