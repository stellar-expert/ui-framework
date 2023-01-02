import React from 'react'
import {StrKey} from 'stellar-sdk'
import {AccountAddress} from './account-address'

/**
 * @param {Signer} signer
 * @return {{key: String, weight: Number}|null}
 * @internal
 */
function decodeSigner(signer) {
    if (!signer)
        return null
    let weight
    let key
    if (typeof signer.arm === 'function') { //raw xdr
        const type = signer.arm()
        weight = signer.weight()
        switch (type) {
            case 'ed25519':
                key = StrKey.encodeEd25519PublicKey(signer.ed25519())
                break
            case 'preAuthTx':
                key = StrKey.encodePreAuthTx(signer.preAuthTx())
                break
            case 'hashX':
                key = StrKey.encodeSha256Hash(signer.hashX())
                break
            case 'ed25519SignedPayload':
                key = StrKey.encodeSignedPayload(signer.ed25519SignedPayload())
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
    }
    if (!key)
        throw new Error('Unknown signer type: ' + JSON.stringify(signer))
    return {key, weight}
}

/**
 * Account signer key description
 * @param {Signer} signer
 * @param {String} name?
 * @param {String} className?
 * @param {Boolean} showWeight?
 * @constructor
 */
export function SignerKey({signer, name, className, showWeight = true}) {
    if (!signer)
        return null
    const {key, weight} = decodeSigner(signer)
    return <span className={className}>
        <AccountAddress account={key} name={name}/>
        {!!showWeight && <span className="dimmed">&nbsp;(weight {weight})</span>}
    </span>
}