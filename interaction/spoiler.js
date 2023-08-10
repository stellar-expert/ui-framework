import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import './spoiler.scss'

export const Spoiler = React.memo(function Spoiler({expanded, showMore = 'Show more', showLess = 'Show less', onChange, className, micro, style, active, children}) {
    const [expandedState, setExpandedState] = useState(expanded || false)
    useEffect(() => {
        setExpandedState(expanded)
    }, [expanded])

    function toggle() {
        setExpandedState(prevState => {
            const newState = !prevState
            setExpandedState(newState)
            onChange && onChange({expanded: newState})
        })
    }

    const text = expandedState ? showLess : showMore
    return <>
        <span className={cn('spoiler', className)}>
            <a href="#" className={!active ? 'dimmed' : undefined} title={micro ? text : undefined} style={style} onClick={toggle}>
                {!micro && <span className="spoiler-text">{text}</span>}
                <i className={`icon ${expandedState ? 'icon-less' : 'icon-more'}`}/>
            </a>
        </span>
        {expandedState ? children : null}
    </>
})

Spoiler.propTypes = {
    expanded: PropTypes.bool,
    micro: PropTypes.bool,
    onChange: PropTypes.func,
    showMore: PropTypes.string,
    showLess: PropTypes.string,
    active: PropTypes.bool,
    style: PropTypes.object
}