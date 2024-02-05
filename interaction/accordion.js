import React, {useCallback, useEffect, useState} from 'react'
import cn from 'classnames'
import './accordion.scss'

/**
 * @param {{title, content}[]} options
 */
export function Accordion({options}) {
    const [selectedOption, setSelectedOption] = useState()
    useEffect(() => {
        setSelectedOption(options[0].title)
    }, [options])
    const changeSelected = useCallback(e => {
        const {title} = e.currentTarget.dataset
        setSelectedOption(title)
    }, [options])
    return <div className="accordion">
        {options.map(({title, content}) => <div key={title} className={cn('option', {open: selectedOption === title})}>
            <div className="accordion-header" data-title={title} onClick={changeSelected}>
                {title}
            </div>
            <div className="accordion-collapse">
                <div className="accordion-body">
                    {content}
                </div>
            </div>
        </div>)}
    </div>
}