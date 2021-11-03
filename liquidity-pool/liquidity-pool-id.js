import {getLiquidityPoolId, LiquidityPoolAsset, LiquidityPoolFeeV18} from 'stellar-sdk'
import {AssetDescriptor} from '../asset/asset-descriptor'

/**
 * Generate constant product liquidity pool id from provided assets
 * @param {Array<String>|LiquidityPoolAsset} assets
 * @return {String}
 */
export function generateLiquidityPoolId(assets) {
    const lp = assets instanceof LiquidityPoolAsset ? assets : getLiquidityPoolAsset(assets)
    if (lp === null) return null //invalid pool)
    const id = getLiquidityPoolId('constant_product', lp.getLiquidityPoolParameters())
    return id.toString('hex')
}

/**
 * Generate Stellar LiquidityPoolAsset for a given asset pair
 * @param {Array<String>} assets
 * @return {LiquidityPoolAsset|null}
 */
export function getLiquidityPoolAsset(assets) {
    if (assets[0] === assets[1]) return null //invalid pool
    const wrappedAssets = assets.map(a => AssetDescriptor.parse(a).toAsset())
    wrappedAssets.sort((a, b) => {
        if (!a.issuer) return -1
        if (!b.issuer) return 1
        if (a.code < b.code) return -1
        if (a.code > b.code) return -1
        if (a.issuer < b.issuer) return -1
        if (a.issuer > b.issuer) return 1
        return 0
    })
    return new LiquidityPoolAsset(wrappedAssets[0], wrappedAssets[1], LiquidityPoolFeeV18)
}