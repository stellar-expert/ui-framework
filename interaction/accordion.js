import React, {useCallback, useEffect, useState} from 'react'
import cn from 'classnames'
import './accordion.scss'

/**
 * @typedef {Object} AccordionOption
 * @property {string} [key] - Unique key for the panel (falls back to title)
 * @property {string|JSX.Element} title - Panel header content
 * @property {*} content - Panel body content
 */

/**
 * Group of collapsible panels where only one panel is expanded at a time
 * @param {Object} props
 * @param {AccordionOption[]} props.options - Accordion panel definitions
 * @param {string} [props.collapsedSymbol='+'] - Prefix shown for collapsed panels
 * @param {string} [props.expandedSymbol='-'] - Prefix shown for the expanded panel
 */
export function Accordion({options, collapsedSymbol = '+', expandedSymbol = '-', ...otherProps}) {
    const [selectedOption, setSelectedOption] = useState()
    useEffect(() => {
        const firstOption = options[0]
        setSelectedOption(firstOption.key || firstOption.title)
    }, [options])
    const changeSelected = useCallback(e => setSelectedOption(e.currentTarget.dataset.key), [options])
    return <div className="accordion" {...otherProps}>
        {options.map(({key, title, content}) => {
            const expanded = key ?
                selectedOption === key :
                selectedOption === title
            return <div key={key || title} className={cn('option', {expanded})}>
                <div className="accordion-header" data-collapsed={collapsedSymbol} data-expanded={expandedSymbol} data-key={key || title}
                     onClick={changeSelected}>
                    {title || key}
                </div>
                <div className="accordion-collapse">
                    <div className="accordion-body">
                        {content}
                    </div>
                </div>
            </div>
        })}
    </div>
}