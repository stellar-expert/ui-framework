import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {Tooltip} from './tooltip'
import './info-tooltip.scss'

/**
 * Help icon that shows a tooltip with explanatory text on hover
 * @param {Object} props
 * @param {*} props.children - Tooltip content
 * @param {string} [props.link] - Optional "Read more" URL
 * @param {string} [props.icon='icon-help'] - Icon CSS class
 */
export const InfoTooltip = React.memo(function InfoTooltip({children, link, icon = 'icon-help', ...otherProps}) {
    return <Tooltip trigger={<i className={cn('trigger icon info-tooltip text-small text-justify', icon)} {...otherProps}/>} maxWidth="30em">
        {children}
        {!!link && <a href={link} className="info-tooltip-link" target="_blank">Read more&hellip;</a>}
    </Tooltip>
})

InfoTooltip.propTypes = {
    children: PropTypes.any.isRequired,
    link: PropTypes.string
}