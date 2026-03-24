import React from 'react'
import PropTypes from 'prop-types'
import './button-group.scss'

/**
 * Groups multiple buttons together with consistent spacing
 * @param {Object} props
 * @param {boolean} [props.inline] - Render as inline element (`<span>`) instead of block (`<div>`)
 * @param {*} props.children - Nested buttons
 */
export const ButtonGroup = React.memo(function ButtonGroup({inline, children, ...otherProps}) {
    if (inline)
        return <span className="button-group" {...otherProps}>{children}</span>
    return <div className="button-group" {...otherProps}>{children}</div>
})

ButtonGroup.propTypes = {
    /**
     * Nested buttons
     */
    children: PropTypes.any.isRequired,
    /**
     * Whether to render the group as inline element (span)
     */
    inline: PropTypes.bool
}