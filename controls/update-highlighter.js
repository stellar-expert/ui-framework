import React, {useRef} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {useDependantState} from '../state/state-hooks'
import './update-highlighter.scss'

export function UpdateHighlighter({children}) {
    const timerRef = useRef(0)
    const [active, setActiveState] = useDependantState(() => {
        //reset the timer in case if previous animation wasn't finished yet
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            useRef.current = 0
        }
        //schedule class reset
        timerRef.current = setTimeout(function () {
            timerRef.current = 0
            setActiveState(false)
        }, 600)
        return true
    }, [children])

    return <span className={cn({highlighter: active})}>{children}</span>
}

UpdateHighlighter.propTypes = {
    children: PropTypes.any.isRequired
}