import React from 'react'
import PropTypes from 'prop-types'
import './button-group.scss'

export function ButtonGroup({inline, children}) {
    if (inline) return <span className="button-group">{children}</span>
    return <div className="button-group">{children}</div>
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