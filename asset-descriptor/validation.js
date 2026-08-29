import {StrKey} from '@stellar/stellar-sdk'

/**
 * Asset code validation
 * @param {String} code
 * @return {Boolean}
 */
export function isValidAssetCode(code) {
    return typeof code === 'string' && /^[a-zA-Z0-9]{1,12}$/.test(code)
}

/**
 * Check whether a pool identifier is valid
 * @param {String|Uint8Array} poolId - Pool id to check
 * @return {Boolean}
 */
export function isValidPoolId(poolId) {
    if (typeof poolId === 'string')
        return /^\w{64}$/.test(poolId) || StrKey.isValidLiquidityPool(poolId)
    if (poolId instanceof Uint8Array)
        return poolId.length === 32
    return false
}

/**
 * Lazy contract address format check
 * @param {String} address
 * @return {Boolean}
 */
export function isValidContract(address) {
    return typeof address === 'string' && address.length === 56 && address[0] === 'C'
}
