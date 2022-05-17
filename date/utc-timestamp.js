import React from 'react'
import cn from 'classnames'
import {formatDateUTC} from '@stellar-expert/formatter'
import {BlockSelect} from '../interaction/block-select'

export function UtcTimestamp({date, dateOnly, className}) {
    let formatted = formatDateUTC(date)
    if (dateOnly) {
        formatted = formatted.split(' ')[0]
    } else {
        formatted += ' UTC'
    }
    return <BlockSelect className={cn('condensed nowrap', className)}>{formatted}</BlockSelect>
}

UtcTimestamp.propTypes = {
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
    dateOnly: PropTypes.bool,
    className: PropTypes.string
}