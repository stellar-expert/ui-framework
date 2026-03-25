import {StrKey} from '@stellar/stellar-base'

/**
 * @param {string} key
 * @return {{address: string, type: ('muxed'|'ed25519'|'hash'|'tx'|'contract'), [muxedId]: bigint}|null}
 * @internal
 */
export function decodeKeyType(key) {
    if (typeof key !== 'string')
        return null
    const prefix = key[0]
    try {
        switch (prefix) {
            case 'G':
                checkLength(key)
                return {
                    type: 'ed25519',
                    address: key
                }
            case 'C':
                checkLength(key)
                return {
                    type: 'contract',
                    address: key
                }
            case 'M':
                return {
                    type: 'muxed',
                    ...parseMuxedAccount(key)
                }
            case 'X':
                checkLength(key)
                return {
                    type: 'hash',
                    address: key
                }
            case 'T':
                checkLength(key)
                return {
                    type: 'tx',
                    address: key
                }
            case 'P':
                const spayload = StrKey.decodeSignedPayload(key)
                return {
                    type: 'signedPayload',
                    address: key,
                    publicKey: StrKey.encodeEd25519PublicKey(spayload.slice(0, 32)),
                    payload: spayload.slice(36, 36 + spayload.readUIntBE(32, 4)).toString('hex')
                }
            default:
                console.error(new Error('Unknown key prefix: ' + typeof key))
                return null
        }
    } catch (e) {
        console.error(e)
        return null
    }
}

function checkLength(key, length = 56) {
    if (key.length !== length)
        throw new Error('Invalid key length: ' + key)
}

/**
 * Parse multiplexed account address
 * @param {string} muxedAddress - Multiplexed Stellar address
 * @return {{address: string, muxedId: bigint}}
 */
export function parseMuxedAccount(muxedAddress) {
    const muxed = StrKey.decodeMed25519PublicKey(muxedAddress)
    return {
        address: StrKey.encodeEd25519PublicKey(muxed.slice(0, 32)),
        muxedId: muxed.readBigInt64BE(32)
    }
}

/**
 * Encode address and identifier into a multiplexed address
 * @param {string} address - StrKey-encode Stellar account address
 * @param {bigint} muxedId - Multiplexed int64 id
 * @return {string}
 */
export function encodeMuxedAccount(address, muxedId) {
    const raw = Buffer.allocUnsafe(40)
    //write 32 bytes of ed25519 pubkey
    StrKey.decodeEd25519PublicKey(address).copy(raw)
    //write 8 id bytes
    raw.writeBigInt64BE(muxedId, 32)
    return StrKey.encodeMed25519PublicKey(raw)
}