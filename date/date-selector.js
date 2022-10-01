import React, {useEffect, useState} from 'react'
import {debounce} from 'throttle-debounce'
import {normalizeDate, toUnixTimestamp} from '@stellar-expert/formatter'

function trimIsoDateSeconds(date) {
    if (typeof date === 'number') {
        date = new Date(date)
    }
    return date.toISOString().replace(/:\d{2}\.\d*Z/, '')
}

const minSelectableValue = trimIsoDateSeconds(new Date('2015-09-30T16:46:00Z'))

/**
 * @param {String} value
 * @param {Function} onChange
 * @constructor
 */
export default function DateSelector({value, onChange}) {
    const [date, setDate] = useState(value ? trimIsoDateSeconds(normalizeDate(value)) : '')
    useEffect(() => {
        if (value) {
            setDate(trimIsoDateSeconds(normalizeDate(value)))
        } else {
            setDate('')
        }
    }, [value])

    const selectDate = debounce(400, function (newDate) {
        if (value !== newDate) {
            setDate(newDate)
            onChange && onChange(toUnixTimestamp(normalizeDate(newDate)))
        }
    })

    const max = trimIsoDateSeconds(new Date(new Date().getTime() + 24 * 60 * 60 * 1000))
    return <input type="datetime-local" value={date} className="date-selector" step={60}
                  min={minSelectableValue} max={max} onChange={e => selectDate(e.target.value)}/>
}