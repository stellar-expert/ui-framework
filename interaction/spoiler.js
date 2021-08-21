import React from 'react'
import PropTypes from 'prop-types'
import './spoiler.scss'

export function Spoiler({expanded = false, showMore = 'Show more', showLess = 'Show less', micro, onChange, style, active}) {
    const text = expanded ? showLess : showMore
    return <span className="spoiler">
        <a href="#" className={!active ? 'dimmed' : undefined} title={micro ? text : undefined} style={style}
           onClick={e => onChange({expanded: !expanded})}>
            {!micro && <span className="spoiler-text">{text}</span>}
            <i className={`vtop icon ${expanded ? 'icon-less' : 'icon-more'}`}/>
        </a>
    </span>
}

Spoiler.propTypes = {
    expanded: PropTypes.bool,
    micro: PropTypes.bool,
    onChange: PropTypes.func,
    showMore: PropTypes.string,
    showLess: PropTypes.string,
    active: PropTypes.bool,
    style: PropTypes.object
}