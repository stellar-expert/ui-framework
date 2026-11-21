import {findSimilarAddresses, getAddressSimilarityKey, SimilarAddressesTracker} from '../account/similar-addresses'

//different accounts with the same leading and trailing characters
const recipient = 'GAZKBZFOHIJU7O2FNUGIWDJJDKK5JB43KMCUXKQGUHQU7YR2N3EMND6Q'
const lookalike = 'GAZKBZFOM6E67J7Z5ECGADJJDKK5JB43KMCUXKQGUHQU7YR2N3EMND6Q'
const owner = 'GCYTBHE2TSTVX5LSR2PYOVOHF2YRBUAXJYTT2QRBW6IZ6RAWVKVTLYLQ'
const contract = 'CBZKN44ROE3F2P6XDIUQ675I2MTMVIQPMFKM75AZNS3MJ6VFMYVBESXW'

describe('getAddressSimilarityKey', () => {
    test('is the same for lookalike addresses', () => {
        expect(getAddressSimilarityKey(recipient)).toBe('GAZ…ND6Q')
        expect(getAddressSimilarityKey(lookalike)).toBe(getAddressSimilarityKey(recipient))
        expect(getAddressSimilarityKey(owner)).not.toBe(getAddressSimilarityKey(recipient))
    })
})

describe('findSimilarAddresses', () => {
    test('returns both addresses of a lookalike pair', () => {
        expect(findSimilarAddresses([owner, recipient, contract, lookalike])).toEqual(new Set([recipient, lookalike]))
    })

    test('ignores repeated occurrences of the same address', () => {
        expect(findSimilarAddresses([owner, recipient, owner, recipient]).size).toBe(0)
    })

    test('skips empty values', () => {
        expect(findSimilarAddresses([undefined, null, recipient]).size).toBe(0)
    })
})

describe('SimilarAddressesTracker', () => {
    test('reports lookalike addresses while both are tracked', () => {
        const tracker = new SimilarAddressesTracker()
        const untrackRecipient = tracker.track(recipient, () => {})
        tracker.track(owner, () => {})
        expect(tracker.hasSimilar(recipient)).toBe(false)
        expect(tracker.hasSimilar(lookalike)).toBe(true)

        const untrackLookalike = tracker.track(lookalike, () => {})
        expect(tracker.hasSimilar(recipient)).toBe(true)
        expect(tracker.hasSimilar(lookalike)).toBe(true)
        expect(tracker.hasSimilar(owner)).toBe(false)

        untrackLookalike()
        expect(tracker.hasSimilar(recipient)).toBe(false)
        untrackRecipient()
        expect(tracker.hasSimilar(lookalike)).toBe(false)
    })

    test('notifies the other addresses of the group about changes', () => {
        const tracker = new SimilarAddressesTracker()
        const onRecipient = jest.fn()
        const onOwner = jest.fn()
        const onLookalike = jest.fn()
        tracker.track(recipient, onRecipient)
        tracker.track(owner, onOwner)
        const untrack = tracker.track(lookalike, onLookalike)
        expect(onRecipient).toHaveBeenCalledTimes(1)
        untrack()
        expect(onRecipient).toHaveBeenCalledTimes(2)
        expect(onOwner).not.toHaveBeenCalled()
        expect(onLookalike).not.toHaveBeenCalled()
    })

    test('keeps an address tracked until every occurrence is removed', () => {
        const tracker = new SimilarAddressesTracker()
        const onRecipient = jest.fn()
        tracker.track(recipient, onRecipient)
        const first = tracker.track(lookalike, () => {})
        const second = tracker.track(lookalike, () => {})
        expect(onRecipient).toHaveBeenCalledTimes(1)
        first()
        expect(tracker.hasSimilar(recipient)).toBe(true)
        expect(onRecipient).toHaveBeenCalledTimes(1)
        second()
        expect(tracker.hasSimilar(recipient)).toBe(false)
        expect(onRecipient).toHaveBeenCalledTimes(2)
    })
})
