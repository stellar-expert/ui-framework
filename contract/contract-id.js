import {StrKey, hash, xdr} from '@stellar/stellar-sdk'

/**
 * Network id hashes keyed by network passphrase
 * @type {Map<string, Uint8Array>}
 */
const networkIdCache = new Map()

/**
 * Resolve network id hash from a passphrase (with caching)
 * @param {string} networkPassphrase
 * @return {Uint8Array}
 */
function getNetworkIdHash(networkPassphrase) {
    let networkId = networkIdCache.get(networkPassphrase)
    if (!networkId) {
        networkId = hash(new TextEncoder().encode(networkPassphrase))
        networkIdCache.set(networkPassphrase, networkId)
    }
    return networkId
}

/**
 * Derive contract address from its id preimage (same algorithm as `Asset.contractId()` in stellar-sdk)
 * @param {xdr.ContractIdPreimage} contractIdPreimage - Preimage from the contract creation host function
 * @param {string} networkPassphrase - Network passphrase
 * @return {string}
 */
export function contractIdFromPreimage(contractIdPreimage, networkPassphrase) {
    const preimage = xdr.HashIdPreimage.envelopeTypeContractId(new xdr.HashIdPreimageContractId({
        networkId: getNetworkIdHash(networkPassphrase),
        contractIdPreimage
    }))
    return StrKey.encodeContract(hash(preimage.toXdr()))
}
