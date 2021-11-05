import React, {useState} from 'react'
import {debounce} from 'throttle-debounce'
import './slider.scss'

const throttledUpdateSlippage = debounce(400, (callback, value) => callback(value))

export function Slider({title, value, max, step = 1, onChange, ...otherProps}) {
    const [innerValue, setInnerValue] = useState(value)
    function change(e) {
        let v = e.target.value
        if (typeof v === 'string') {
            v = parseFloat(v.replace(/[^\d.]/g, '')) || 0
            if (v >= 99) {
                v = 99
            }
        }
        setInnerValue(v)
        throttledUpdateSlippage(onChange, v)
    }

    return <div className="slider dual-layout dimmed text-small" {...otherProps}>
        <div>{title}</div>
        <div>
            <input type="range" min={0} max={max} step={step} value={innerValue} onChange={change} data-lpignore="true"/>
        </div>
        <div>
            <input type="text" value={innerValue} onChange={change}/>%
        </div>
    </div>
}