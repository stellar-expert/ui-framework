import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {formatPrice} from '@stellar-expert/formatter'
import './price-dynamic.scss'

export const PriceDynamic = React.memo(function PriceDynamic({change, current, prev, standalone, allowZero}) {
    if (change === undefined) {
        if (current === prev || !prev || !current) {
            change = 0
        } else {
            change = 100 * (current - prev) / prev
        }
    }
    if (Math.abs(change) > 10000)
        return null
    change = formatPrice(Math.abs(change), 2) + '%'
    if (change === '0%' && !allowZero)
        return null
    let direction
    if (parseInt(change) > 0) {
        direction = 'positive'
    }
    if (parseInt(change) < 0) {
        direction = 'negative'
    }
    const className = cn('price-change', getChangeDirection(change), {standalone})
    return <span className={className} aria-label={` (${change})`}>{change}</span>
})

function getChangeDirection(change) {
    change = parseInt(change, 10)
    if (change > 0)
        return 'positive'
    if (change < 0)
        return 'negative'
}

PriceDynamic.propTypes = {
    change: PropTypes.number,
    current: PropTypes.number,
    prev: PropTypes.number,
    standalone: PropTypes.bool,
    allowZero: PropTypes.bool
}