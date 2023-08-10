import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {normalizeDate, formatDateUTC} from '@stellar-expert/formatter'
import {BlockSelect} from '../interaction/block-select'

export const UtcTimestamp = React.memo(function UtcTimestamp({date, dateOnly, className}) {
    date = normalizeDate(date)
    let formatted = formatDateUTC(date)
    if (dateOnly) {
        formatted = formatted.split(' ')[0]
    } else {
        formatted += ' UTC'
    }
    const localTime = date.toString().replace(/ \(.+\)/, '').replace(/\w+ /, '')
    return <BlockSelect className={cn('condensed nowrap', className)} title={localTime}>{formatted}</BlockSelect>
})

UtcTimestamp.propTypes = {
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
    dateOnly: PropTypes.bool,
    className: PropTypes.string
}