import React from 'react'
import {StrKey} from '@stellar/stellar-sdk'
import {AccountAddress} from './account-address'

/**
 * Decode a Stellar signer object (XDR or parsed) into a StrKey-encoded key and weight
 * @param {Signer} signer
 * @return {{key: string, weight: number}|null}
 * @internal
 */
function decodeSigner(signer) {
    if (!signer)
        return null
    let weight
    let key
    const signerKey = signer.key !== null && typeof signer.key === 'object' ? signer.key : signer
    if (typeof signerKey.type === 'string' && signerKey.type.startsWith('signerKeyType')) {
        weight = signer.weight
        switch (signerKey.type) {
            case 'signerKeyTypeEd25519':
                key = StrKey.encodeEd25519PublicKey(toBytes(signerKey.ed25519))
                break
            case 'signerKeyTypePreAuthTx':
                key = StrKey.encodePreAuthTx(toBytes(signerKey.preAuthTx))
                break
            case 'signerKeyTypeHashX':
                key = StrKey.encodeSha256Hash(toBytes(signerKey.hashX))
                break
            case 'signerKeyTypeEd25519SignedPayload':
                key = StrKey.encodeSignedPayload(encodeSignedPayloadBytes(signerKey.ed25519SignedPayload))
                break
        }
    } else { //parsed
        if (signer.ed25519PublicKey) {
            key = signer.ed25519PublicKey
        } else if (signer.sha256Hash) {
            key = StrKey.encodeSha256Hash(signer.sha256Hash)
        } else if (signer.preAuthTx) {
            key = StrKey.encodePreAuthTx(signer.preAuthTx)
        } else if (signer.ed25519SignedPayload) {
            key = StrKey.encodeSignedPayload(signer.ed25519SignedPayload)
        }
        weight = signer.weight
    }
    if (!key)
        throw new Error('Unknown signer type: ' + JSON.stringify(signer))
    return {key, weight}
}

/**
 * @param {Uint8Array|{toBytes: function}} value
 * @return {Uint8Array}
 * @private
 */
function toBytes(value) {
    return value instanceof Uint8Array ? value : value.toBytes()
}

/**
 * @param {xdr.SignerKeyEd25519SignedPayload} signedPayload
 * @return {Uint8Array}
 * @private
 */
function encodeSignedPayloadBytes(signedPayload) {
    const payload = toBytes(signedPayload.payload)
    const raw = new Uint8Array(36 + Math.ceil(payload.length / 4) * 4)
    raw.set(toBytes(signedPayload.ed25519))
    new DataView(raw.buffer).setUint32(32, payload.length)
    raw.set(payload, 36)
    return raw
}

/**
 * Account signer key description
 * @param {Signer} signer - StrKey-encoded Account/MuxedAccount/Sha256Hash/PreAuthTx/SignedPayload
 * @param {string} [name] - Explicit account name that overrides the name from Directory; if false, friendly name is ignored
 * @param {string} [className] - Optional CSS class attribute
 * @param {boolean} [showWeight] - Whether to display weight attribute
 * @constructor
 */
export const SignerKey = React.memo(function SignerKey({signer, name, className, showWeight = true}) {
    if (!signer)
        return null
    const {key, weight} = decodeSigner(signer)
    return <span className={className}>
        <AccountAddress account={key} name={name}/>
        {!!showWeight && <span className="dimmed text-tiny">&nbsp;(weight={weight})</span>}
    </span>
})