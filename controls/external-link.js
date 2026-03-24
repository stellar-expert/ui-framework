import React from 'react'

/**
 * Link that opens in a new tab with `rel="noreferrer noopener"` for security
 * @param {Object} props
 * @param {string} props.href - Link URL
 * @param {*} [props.children] - Link content
 */
export const ExternalLink = React.memo(function ExternalLink({href, children, ...otherProps}) {
    return <a href={href} target="_blank" rel="noreferrer noopener" {...otherProps}>{children}</a>
})