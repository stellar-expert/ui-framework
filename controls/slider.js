import React, {useCallback, useMemo, useState} from 'react'
import {throttle} from 'throttle-debounce'
import './slider.scss'

export function Slider({value, categroies, onChange, min = 0, max = 100, step = 1, ...otherProps}) {
    const [inputValue, setInputValue] = useState(value || min)
    const change = useMemo(() => throttle(300, onChange), [onChange])
    const onSlide = useCallback(function (e) {
        const value = parseFloat(e.target.value)
        setInputValue(value)
        change(value)
    }, [change])

    return <div className="slider dimmed text-small" {...otherProps}>
        <div>
            <input type="range" min={min} max={max} step={step} value={inputValue} onChange={onSlide}/>
            {categroies && <datalist className="categories">
                {categroies.map((category, index) =>
                    <option key={category} value={index + category} label={category} className="dimmed condensed text-tiny"/>
                )}
            </datalist>}
        </div>
    </div>
}