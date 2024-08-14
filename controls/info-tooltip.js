import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {Tooltip} from './tooltip'
import './info-tooltip.scss'

export const InfoTooltip = React.memo(function InfoTooltip({children, link, icon = 'icon-help', ...otherProps}) {
    return <Tooltip trigger={<i className={cn('trigger icon info-tooltip small', icon)} {...otherProps}/>} maxWidth="30em">
        {children}
        {!!link && <a href={link} className="info-tooltip-link" target="_blank">Read more&hellip;</a>}
    </Tooltip>
})

InfoTooltip.propTypes = {
    children: PropTypes.any.isRequired,
    link: PropTypes.string
}