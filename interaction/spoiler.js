import React, {useCallback, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import './spoiler.scss'

/**
 * Expandable/collapsible content toggle
 * @param {Object} props
 * @param {boolean} [props.expanded] - Whether the content is initially expanded
 * @param {string} [props.showMore='Show more'] - Label for the expand action
 * @param {string} [props.showLess='Show less'] - Label for the collapse action
 * @param {function({expanded: boolean}): void} [props.onChange] - Callback invoked on toggle
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.micro] - Show only an icon without text label
 * @param {Object} [props.style] - Inline styles
 * @param {boolean} [props.active] - Highlight the toggle link
 * @param {*} [props.children] - Content revealed when expanded
 */
export const Spoiler = React.memo(function Spoiler({expanded, showMore = 'Show more', showLess = 'Show less', onChange, className, micro, style, active, children}) {
    const [expandedState, setExpandedState] = useState(expanded || false)
    useEffect(() => {
        setExpandedState(expanded)
    }, [expanded])

    const toggle = useCallback(() => {
        setExpandedState(prevState => {
            const newState = !prevState
            setExpandedState(newState)
            onChange && onChange({expanded: newState})
        })
    }, [onChange])

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