import {StrKey} from 'stellar-sdk'

export function parseMuxedAccount(muxedAddress) {
    const muxed = StrKey.decodeMed25519PublicKey(muxedAddress)
    return {
        address: StrKey.encodeEd25519PublicKey(muxed.slice(0, 32)),
        muxedId: BigInt(muxed.readUInt32BE(32)) * 4294967296n + BigInt(muxed.readUInt32BE(36))
    }
}