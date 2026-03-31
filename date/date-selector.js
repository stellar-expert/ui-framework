import React, {forwardRef, useCallback, useEffect, useState} from 'react'
import {debounce} from 'throttle-debounce'
import {normalizeDate, toUnixTimestamp} from '@stellar-expert/formatter'

/**
 * Date-time picker input
 * @param {string} value - Current input value
 * @param {DateSelector~OnChange} onChange - Onchange event handler
 * @param {string} [min] - Minimum allowed date
 * @param {string} [max] - Maximum allowed date
 * @param {*} [ref]
 */
export const DateSelector = forwardRef(({value, onChange, min, max, ...otherProps}, ref) => {
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
                onChange(newDate ? toUnixTimestamp(normalizeDate(newDate)) : null)
            }
        }
    }), [onChange, value])

    if (max === undefined) {
        max = trimIsoDateSeconds(new Date(new Date().getTime() + 24 * 60 * 60 * 1000))
    }
    return <input type="datetime-local" value={date} className="date-selector condensed" step={60} ref={ref}
                  min={min || minSelectableValue} max={max} onChange={e => selectDate(e.target.value)}
                  style={{width: '11em', overflow: 'hidden'}} {...otherProps}/>
})

/**
 * Trim seconds and milliseconds for basic ISO date format representation
 * @param {Date|number} date
 * @return {string}
 */
export function trimIsoDateSeconds(date) {
    if (typeof date === 'number') {
        date = new Date(date)
    }
    return date.toISOString().replace(/:\d{2}\.\d*Z/, '')
}

const minSelectableValue = trimIsoDateSeconds(new Date('2015-09-30T16:46:00Z'))

/**
 * @callback DateSelector~OnChange
 * @param {number|null} value - Selected value represented as a Unix timestamp or null for invalid date value
 */