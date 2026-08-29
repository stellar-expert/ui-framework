import {Keypair, StrKey, xdr} from '@stellar/stellar-sdk'
import {decodeKeyType, parseMuxedAccount, encodeMuxedAccount} from '../stellar/key-type.js'
import {
    findKeyBySignatureHint,
    findKeysBySignatureHint,
    findSignatureByKey,
    formatSignatureHint,
    signatureHintMatchesKey,
    signatureHintToMask
} from '../stellar/signature-hint-utils.js'
import {retrieveLedgerInfo} from '../ledger/ledger-info-parser.js'

const kp = Keypair.random()
const address = kp.publicKey()

describe('decodeKeyType', () => {
    test('classifies an ed25519 address', () => {
        expect(decodeKeyType(address)).toEqual({type: 'ed25519', address})
    })

    test('classifies a contract address', () => {
        const contract = StrKey.encodeContract(new Uint8Array(32))
        expect(decodeKeyType(contract)).toEqual({type: 'contract', address: contract})
    })

    test('classifies hash and preauth keys', () => {
        expect(decodeKeyType(StrKey.encodeSha256Hash(new Uint8Array(32))).type).toBe('hash')
        expect(decodeKeyType(StrKey.encodePreAuthTx(new Uint8Array(32))).type).toBe('tx')
    })

    test('returns null for non-strings and unknown prefixes', () => {
        const logged = jest.spyOn(console, 'error').mockImplementation(() => {})
        try {
            expect(decodeKeyType(null)).toBeNull()
            expect(decodeKeyType(42)).toBeNull()
            expect(decodeKeyType('ZZZ')).toBeNull()
        } finally {
            logged.mockRestore()
        }
    })

    test('returns null rather than throwing on a malformed key', () => {
                const logged = jest.spyOn(console, 'error').mockImplementation(() => {})
        try {
            expect(decodeKeyType('G' + 'A'.repeat(20))).toBeNull()
            expect(logged).toHaveBeenCalled()
        } finally {
            logged.mockRestore()
        }
    })

    test('decodes a signed payload into hex, not comma-joined decimals', () => {
        const payload = new Uint8Array([0xde, 0xad, 0xbe, 0xef])
        const body = new Uint8Array(40)
        body.set(kp.rawPublicKey())
        new DataView(body.buffer).setUint32(32, payload.length)
        body.set(payload, 36)
        const decoded = decodeKeyType(StrKey.encodeSignedPayload(body))
        expect(decoded.type).toBe('signedPayload')
        expect(decoded.publicKey).toBe(address)
        expect(decoded.payload).toBe('deadbeef')
        expect(decoded.payload).not.toContain(',')
    })
})

describe('muxed accounts', () => {
    test('encode/parse round-trip preserves address and id', () => {
        const muxedId = 12345678901234n
        const muxed = encodeMuxedAccount(address, muxedId)
        expect(muxed[0]).toBe('M')
        expect(parseMuxedAccount(muxed)).toEqual({address, muxedId})
    })

    test('handles a zero id', () => {
        expect(parseMuxedAccount(encodeMuxedAccount(address, 0n)).muxedId).toBe(0n)
    })

    test('handles the maximum signed int64 id', () => {
        const muxedId = 2n ** 63n - 1n
        expect(parseMuxedAccount(encodeMuxedAccount(address, muxedId)).muxedId).toBe(muxedId)
    })

    test('decodeKeyType surfaces the muxed id', () => {
        const muxed = encodeMuxedAccount(address, 99n)
        expect(decodeKeyType(muxed)).toEqual({type: 'muxed', address, muxedId: 99n})
    })
})

describe('signature hints', () => {
    test('builds a mask from a raw Uint8Array hint', () => {
        const mask = signatureHintToMask(kp.signatureHint())
        expect(mask).toHaveLength(56)
        expect(mask[0]).toBe(address[0])
        expect(mask.substring(47, 52)).toBe(address.substring(47, 52))
    })

    test('matches its own key and rejects another', () => {
        expect(signatureHintMatchesKey(kp.signatureHint(), address)).toBe(true)
        expect(signatureHintMatchesKey(kp.signatureHint(), Keypair.random().publicKey())).toBe(false)
    })

    test('formats a shortened hint', () => {
        expect(formatSignatureHint(kp.signatureHint())).toMatch(/^.{2}…/)
    })

    test('finds a key among candidates', () => {
        const keys = [Keypair.random().publicKey(), address, Keypair.random().publicKey()]
        expect(findKeyBySignatureHint(kp.signatureHint(), keys)).toBe(address)
    })

    test('accepts a wrapped xdr.SignatureHint from a decorated signature', () => {
        const decorated = new xdr.DecoratedSignature({hint: kp.signatureHint(), signature: new Uint8Array(64)})
        expect(decorated.hint).not.toBeInstanceOf(Uint8Array)
        expect(signatureHintToMask(decorated.hint)).toBe(signatureHintToMask(kp.signatureHint()))
        expect(findSignatureByKey(address, [decorated])).toBe(decorated)
        expect(findKeysBySignatureHint(decorated, [address])).toEqual([address])
    })
})

describe('retrieveLedgerInfo', () => {
    const z32 = new Uint8Array(32)

    function buildHeader(overrides = {}) {
        return new xdr.LedgerHeader({
            ledgerVersion: 21,
            previousLedgerHash: z32,
            scpValue: new xdr.StellarValue({
                txSetHash: z32,
                closeTime: 100n,
                upgrades: [],
                ext: xdr.StellarValueExt.stellarValueBasic()
            }),
            txSetResultHash: z32,
            bucketListHash: z32,
            ledgerSeq: 55,
            totalCoins: 1000000000000000n,
            feePool: 12345678n,
            inflationSeq: 0,
            idPool: 0n,
            baseFee: 100,
            baseReserve: 5000000,
            maxTxSetSize: 1000,
            skipList: [z32, z32, z32, z32],
            ext: xdr.LedgerHeaderExt.v0(),
            ...overrides
        })
    }

    test('reads int64 header fields as native bigints', () => {
        const info = retrieveLedgerInfo({
            xdr: buildHeader().toXdr('base64'),
            sequence: 55,
            ts: 100,
            protocol: 21,
            successful_operations: 3,
            successful_transactions: 2,
            failed_transactions: 1
        })
        expect(info.xlm).toBe(1000000000000000n)
        expect(info.feePool).toBe(12345678n)
        expect(info.baseFee).toBe(100)
        expect(info.baseReserve).toBe(5000000)
        expect(info.operations).toBe(3)
        expect(info.txSuccess).toBe(2)
        expect(info.txFailed).toBe(1)
    })

    test('defaults missing operation counters to zero', () => {
        const info = retrieveLedgerInfo({xdr: buildHeader().toXdr('base64'), sequence: 55, ts: 100, protocol: 21})
        expect(info.operations).toBe(0)
        expect(info.failedOperations).toBe(0)
    })
})
