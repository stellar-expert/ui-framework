import {StrKey} from 'stellar-sdk'

/**
 * Parse multiplexed account address
 * @param {String} muxedAddress - Multiplexed Stellar address
 * @return {{address: String, muxedId: BigIint}}
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
 * @param {String} address - StrKey-encode Stellar account address
 * @param {BigInt} muxedId - Multiplexed int64 id
 * @return {String}
 */
export function encodeMuxedAccount(address, muxedId) {
    const raw = Buffer.allocUnsafe(40)
    //write 32 bytes of ed25519 pubkey
    StrKey.decodeEd25519PublicKey(address).copy(raw)
    //write 8 id bytes
    raw.writeBigInt64BE(muxedId, 32)
    return StrKey.encodeMed25519PublicKey(raw)
}