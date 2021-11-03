import Bignumber from 'bignumber.js'
import {stripTrailingZeros} from '../numeric/formatting-utils'

export function estimateLiquidityPoolStakeValue(shares, reserves, totalShares) {
    if (!(shares > 0) || !(totalShares > 0)) return null
    return reserves.map(reserve => {
        const amount = new Bignumber(shares)
            .mul(new Bignumber(reserve))
            .div(totalShares)
            .toFixed(7, Bignumber.ROUND_DOWN)
        return stripTrailingZeros(amount)
    })
}