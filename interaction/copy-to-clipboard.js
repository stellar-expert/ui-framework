import React from 'react'
import PropTypes from 'prop-types'
import {CopyToClipboard as Copy} from 'react-copy-to-clipboard'

/**
 * Copy-to-clipboard wrapper; shows a default copy icon if no children are provided
 * @param {Object} props
 * @param {string} props.text - Text to copy to clipboard
 * @param {*} [props.children] - Custom trigger element (defaults to a copy icon)
 * @param {string} [props.title='Copy to clipboard'] - Tooltip text
 */
export const CopyToClipboard = React.memo(function CopyToClipboard({text, children, title}) {
    return <Copy text={text}>
        {children ? children : <a href="#" className="icon-copy active-icon" title={title}/>}
    </Copy>
})

CopyToClipboard.defaultProps = {
    title: 'Copy to clipboard'
}

CopyToClipboard.propTypes = {
    text: PropTypes.string.isRequired,
    title: PropTypes.string,
    children: PropTypes.any
}