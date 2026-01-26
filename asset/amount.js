import React from 'react'
import {formatWithPrecision, formatWithAutoPrecision, fromStroops} from '@stellar-expert/formatter'
import {AssetDescriptor, isAssetValid, isValidPoolId} from '@stellar-expert/asset-descriptor'
import {useAssetMeta} from './asset-meta-hooks'
import {AssetLink} from './asset-link'

/**
 * Formatted tokens amount
 * @param {String|Number} amount - Amount of tokens
 * @param {String|AssetDescriptor|Asset} asset - Asset name/descriptor
 * @param {String|Number|'auto'} decimals - Number of decimals to show for a formatted numeric value
 * @param {Boolean} [adjust] - Treat amount value as raw Int64 stroops amount
 * @param {Boolean|'floor'} [round] - Round the amount
 * @param {Boolean} [issuer] - Whether to show asset issuer
 * @param {Boolean} [icon] - Whether to show asset icon
 * @constructor
 */
export const Amount = React.memo(function Amount({amount, asset, decimals, adjust, round, issuer, icon}) {
    const meta = useAssetMeta(asset)
    if (amount === undefined || amount === null)
        return null
    if (adjust === true) {
        try {
            amount = fromStroops(amount, meta?.decimals ?? 7)
        } catch (e) {
            console.error(e)
            return null
        }
    }
    if (round) {
        let [int, fract] = (typeof amount === 'number' ? amount.toFixed(7) : amount).split('.')
        if (fract > 0) {
            int = parseFloat(int)
            fract = parseFloat('0.' + fract)
            if (amount < 0) {
                fract *= -1
            }

            const rounded = round === 'floor' ? Math.floor(fract) : Math.round(fract)
            amount = int + rounded
        }
    }
    try {
        amount = decimals === 'auto' ? formatWithAutoPrecision(amount) : formatWithPrecision(amount, decimals)
    } catch (e) {
        console.error(e)
        return null
    }
    return <span className="amount nowrap condensed">
        {amount}
        {!!asset && <>
            {' '}{isAssetValid(asset) || isValidPoolId(asset) ?
            <AssetLink asset={asset} icon={icon} issuer={issuer}/> :
            asset.toString()}
        </>}
    </span>
})