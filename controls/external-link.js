import React from 'react'

export const ExternalLink = React.memo(function ExternalLink({href, children, ...otherProps}) {
    return <a href={href} target="_blank" rel="noreferrer noopener" {...otherProps}>{children}</a>
})