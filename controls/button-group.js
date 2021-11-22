import React from 'react'
import PropTypes from 'prop-types'
import './button-group.scss'

export function ButtonGroup({inline, children, ...otherProps}) {
    if (inline) return <span className="button-group" {...otherProps}>{children}</span>
    return <div className="button-group" {...otherProps}>{children}</div>
}

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