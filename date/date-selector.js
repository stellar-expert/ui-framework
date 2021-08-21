import React from 'react'
import PropTypes from 'prop-types'
import DatePicker from 'react-datepicker'
import './date-selector.scss'

export function DateSelector({value, onChange, minDate, placeholder}) {
    function selectDate(newDate) {
        const d = newDate / 1000
        if (value !== d && onChange) {
            onChange(d)
        }
    }

    return <span>
            <DatePicker onChange={selectDate}
                        showTimeSelect
                        selected={value && new Date(value * 1000) || null}
                        closeOnScroll
                        dateFormat="yyyy/MM/dd - HH:mm:ss"
                        utcOffset={0}
                        minDate={minDate}
                        maxDate={new Date()}
                        placeholderText={placeholder}/>
        </span>
}

DateSelector.propTypes = {
    /**
     * Unix timestamp
     */
    value: PropTypes.number.isRequired,
    /**
     * Value change handler
     */
    onChange: PropTypes.func.isRequired,
    /**
     * Input placeholder
     */
    placeholder: PropTypes.string,
    /**
     * Minimum selectable value
     */
    minDate: PropTypes.instanceOf(Date)
}