import React from 'react'
import PropTypes from 'prop-types'
import {CopyToClipboard as Copy} from 'react-copy-to-clipboard'

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