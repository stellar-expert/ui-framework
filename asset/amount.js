import React from 'react'
import {formatWithPrecision, formatWithAutoPrecision, stripTrailingZeros, denominate} from '@stellar-expert/formatter'
import {AssetDescriptor, isAssetValid, isValidPoolId} from '@stellar-expert/asset-descriptor'
import {AssetLink} from './asset-link'
import Bignumber from 'bignumber.js'

/**
 * Formatted tokens amount
 * @param {String|Number} amount - Amount of tokens
 * @param {String|AssetDescriptor|Asset} asset - Asset name/descriptor
 * @param {String|Number|'auto'} decimals? - Formatted number decimals to show
 * @param {Boolean} adjust? - Denominate raw Int64 stroops to string format
 * @param {Boolean|'floor'} round? - Round or trim the number
 * @param {Boolean} issuer? - Whether to show asset issuer
 * @param {Boolean} icon? - Wheter to show asset icon
 * @constructor
 */
export function Amount({amount, asset, decimals, adjust, round, issuer, icon}) {
    if (amount === undefined || amount === null) return null
    if (adjust === true) {
        try {
            amount = denominate(amount)
        } catch (e) {
            console.error(e)
            return null
        }
    }
    if (round) {
        const v = new Bignumber(amount.toString())
        amount = (round === 'floor' ? v.round() : v.floor()).toString()
    }
    try {
        amount = stripTrailingZeros(decimals === 'auto' ? formatWithAutoPrecision(amount) : formatWithPrecision(amount, decimals))
    } catch (e) {
        console.error(e)
        return null
    }
    return <span className="amount nowrap condensed">
        {amount}
        {!!asset && <>
            {' '}{isAssetValid(asset) || isValidPoolId(asset) ? <AssetLink asset={asset} icon={icon} issuer={issuer}/> : asset.toString()}
        </>}
    </span>
}