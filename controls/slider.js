import React, {useMemo} from 'react'
import {throttle} from 'throttle-debounce'
import './slider.scss'

export function Slider({value, max = 100, step = 1, categroies, onChange, ...otherProps}) {
    const change = useMemo(() => throttle(400, e => onChange(parseFloat(e.target.value))), [onChange])

    return <div className="slider dimmed text-small" {...otherProps}>
        <div>
            <input type="range" min={0} max={max} step={step} value={value} onChange={change}/>
            {categroies && <datalist className="categories">
                {categroies.map((category, index) =>
                    <option key={category} value={index + category} label={category} className="dimmed condensed text-tiny"/>
                )}
            </datalist>}
        </div>
    </div>
}