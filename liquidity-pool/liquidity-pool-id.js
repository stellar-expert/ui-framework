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
        //one of assets is XLM
        if (!a.issuer) return -1
        if (!b.issuer) return 1
        //alphanum4 + alphanum12
        if (a.code.length <= 4 && b.code.length > 4) return -1
        if (b.code.length <= 4 && a.code.length > 4) return 1
        //asset codes comparison
        if (a.code < b.code) return -1
        if (a.code > b.code) return 1
        //issuers comparison when a.code == b.code
        if (a.issuer < b.issuer) return -1
        if (a.issuer > b.issuer) return 1
        //identical
        return 0
    })
    return new LiquidityPoolAsset(wrappedAssets[0], wrappedAssets[1], LiquidityPoolFeeV18)
}