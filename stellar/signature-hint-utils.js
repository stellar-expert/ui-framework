import {Keypair} from 'stellar-base'

/**
 * Convert the signature hint to the StrKey mask
 * @param {Buffer} hint - Hint to convert
 * @return {String}
 */
export function signatureHintToMask(hint) {
    const partialPublicKey = Buffer.concat([new Buffer(28).fill(0), hint]),
        hintKeypair = new Keypair({type: 'ed25519', publicKey: partialPublicKey}),
        pk = hintKeypair.publicKey()
    return pk.substring(0, 1) + '_'.repeat(46) + pk.substring(47, 52) + '_'.repeat(4)
}

/**
 * Format the signature hint to the friendly form for UI
 * @param {Buffer} hint - Hint to convert
 * @return {string}
 */
export function formatSignatureHint(hint) {
    const mask = signatureHintToMask(hint)
    return mask.substring(0, 2) + '…' + mask.substring(46)
}

/**
 * Check if the hint matches the specific key
 * @param {Buffer} hint - Hint to check
 * @param {String} key - Key to compare
 * @return {Boolean}
 */
export function singatureHintMatchesKey(hint, key) {
    return signatureHintToMask(hint).substring(47, 52) === key.substring(47, 52)
}

/**
 * Find a key by the signature hint
 * @param {Buffer} hint - Hint to look for
 * @param {Array<String>} allKeys - Array of potentially matching keys
 * @return {String|null}
 */
export function findKeyBySignatureHint(hint, allKeys) {
    return allKeys.find(key => singatureHintMatchesKey(hint, key))
}

/**
 * Find tx signature for a given signer key
 * @param {String} key
 * @param {Singature} allSignatures
 * @returns {Signature}
 */
export function findSignatureByKey(key, allSignatures = []) {
    return allSignatures.find(sig => singatureHintMatchesKey(sig.hint(), key))
}

/**
 * Check if the hint matches any of the provided keys
 * @param {Buffer} signature - Tx signature
 * @param {Array<String>} publicKeys - Array of available public keys
 * @returns {Array<String>}
 */
export function findKeysBySignatureHint(signature, keys) {
    const mask = signatureHintToMask(signature.hint())
    return keys.filter(address => mask[0] === address[0] &&
        mask.substr(47, 5) === address.substr(47, 5))
}
