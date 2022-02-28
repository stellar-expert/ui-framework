import React from 'react'
import PropTypes from 'prop-types'
import {AssetLink} from './asset-link'
import {AssetDescriptor, isAssetValid, isValidPoolId} from './asset-descriptor'
import {formatCurrency, formatWithAutoPrecision, stripTrailingZeros} from '../numeric/formatting-utils'

export function Amount({amount, asset, decimals, adjust, round, issuer, icon}) {
    if (amount === undefined || amount === null) return null
    if (adjust === true) {
        amount = amount / 10000000
    }
    if (round) {
        amount = Math.round(amount)
    }
    const value = decimals === 'auto' ? formatWithAutoPrecision(amount) : formatCurrency(amount, decimals)
    return <span className="amount nowrap">
        {stripTrailingZeros(value)}
        {!!asset && <>
            {' '}{isAssetValid(asset) || isValidPoolId(asset) ? <AssetLink asset={asset} icon={icon} issuer={issuer}/> : asset.toString()}
        </>}
    </span>
}

Amount.propTypes = {
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    asset: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(AssetDescriptor)]),
    decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf(['auto'])]),
    adjust: PropTypes.bool,
    round: PropTypes.bool,
    issuer: PropTypes.bool,
    icon: PropTypes.bool
}