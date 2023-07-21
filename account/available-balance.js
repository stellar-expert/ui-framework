import {toStroops, fromStroops} from '@stellar-expert/formatter'

/**
 * Calculate available balance for a given account balance trustline
 * @param {AccountResponse} account
 * @param {Horizon.BalanceLine} balance
 * @param {Number} [additionalReserves]
 * @return {String}
 */
export function calculateAvailableBalance(account, balance, additionalReserves = null) {
    let available = toStroops(balance.balance) - toStroops(balance.selling_liabilities || 0)
    if (balance.asset_type === 'native') {
        const reserves = 2 + account.subentry_count + account.num_sponsoring - account.num_sponsored
        available = available - (BigInt(reserves) * 5000000n)
        //TODO: fetch base_reserve from the Horizon
    }
    if (additionalReserves !== null) {
        available = available - toStroops(additionalReserves)
    }
    return fromStroops(available)
}