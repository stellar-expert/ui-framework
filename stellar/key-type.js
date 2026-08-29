import {StrKey, xdr} from '@stellar/stellar-sdk'

/**
 * Decode StrKey-encoded Stellar key and determine its type
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
                const payloadLength = readUint32BE(spayload, 32)
                return {
                    type: 'signedPayload',
                    address: key,
                    publicKey: StrKey.encodeEd25519PublicKey(spayload.subarray(0, 32)),
                    payload: xdr.encodeBytes(spayload.subarray(36, 36 + payloadLength), 'hex')
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
        address: StrKey.encodeEd25519PublicKey(muxed.subarray(0, 32)),
        muxedId: asDataView(muxed).getBigInt64(32)
    }
}

/**
 * Encode address and identifier into a multiplexed address
 * @param {string} address - StrKey-encode Stellar account address
 * @param {bigint} muxedId - Multiplexed int64 id
 * @return {string}
 */
export function encodeMuxedAccount(address, muxedId) {
    const raw = new Uint8Array(40)
    //write 32 bytes of ed25519 pubkey
    raw.set(StrKey.decodeEd25519PublicKey(address))
    //write 8 id bytes
    asDataView(raw).setBigInt64(32, muxedId)
    return StrKey.encodeMed25519PublicKey(raw)
}

function asDataView(bytes) {
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}

function readUint32BE(bytes, offset) {
    return asDataView(bytes).getUint32(offset)
}