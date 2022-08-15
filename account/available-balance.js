import Bignumber from 'bignumber.js'

/**
 * Calculate available balance for a given account balance trustline
 * @param {AccountResponse} account
 * @param {Horizon.BalanceLine} balance
 * @param {Number} [additionalReserves]
 * @return {String}
 */
export function calculateAvailableBalance(account, balance, additionalReserves = null) {
    let available = new Bignumber(balance.balance).minus(new Bignumber(balance.selling_liabilities))
    if (balance.asset_type === 'native') {
        const reserves = 2 + account.subentry_count + account.num_sponsoring - account.num_sponsored
        available = available.minus(new Bignumber(reserves).times(new Bignumber(0.5)))
        //TODO: fetch base_reserve from the Horizon
    }
    if (additionalReserves !== null) {
        available = available.minus(new Bignumber(additionalReserves))
    }
    return available.toString()
}