import React, {useCallback, useEffect, useState} from 'react'
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
export function DateSelector({value, onChange, ref, ...otherProps}) {
    const [date, setDate] = useState(value ? trimIsoDateSeconds(normalizeDate(value)) : '')
    useEffect(() => {
        if (value) {
            setDate(trimIsoDateSeconds(normalizeDate(value)))
        } else {
            setDate('')
        }
    }, [value])

    const selectDate = useCallback(debounce(400, function (newDate) {
        if (value !== newDate) {
            setDate(newDate)
            if (onChange) {
                onChange(toUnixTimestamp(normalizeDate(newDate)))
            }
        }
    }), [onChange, value])

    const max = trimIsoDateSeconds(new Date(new Date().getTime() + 24 * 60 * 60 * 1000))
    return <input type="datetime-local" value={date} className="date-selector condensed" step={60} ref={ref}
                  min={minSelectableValue} max={max} onChange={e => selectDate(e.target.value)}
                  style={{width: '11em', overflow: 'hidden'}} {...otherProps}/>
}