import React, {useRef, useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {useDependantState} from '../state/state-hooks'
import './dropdown.scss'

function getSelectedOption(values, options) {
    for (let v of values) {
        if (v !== null && v !== undefined) {
            const option = options.find(item => item === v || item.value === v)
            if (option) return {option, isDefault: false}
        }
    }
    return {option: options.find(opt => typeof opt === 'string' || !opt.disabled), isDefault: true}
}

function calculateDropdownPosition(list) {
    const rect = list.getBoundingClientRect(),
        position = {x: 'left', y: 'bottom'}
    if (window.innerWidth - rect.right < 0 && rect.left - rect.width >= 0) {
        position.x = 'right'
    }
    return position
}

function DropdownOption({option, isSelected, select, style}) {
    let {value, title, href, className} = option
    if (typeof option === 'string') {
        value = title = option
    }
    if (!title) {
        title = value
    }

    function selectOption(e) {
        if (option.disabled) {
            e.stopPropagation()
            return
        }
        if (!option.href) {
            e.preventDefault()
        }
        select(option)
    }

    return <li className="dd-list-item" key={value || href} onClick={selectOption} style={style}>
        <a href={href || '#'} className={cn({className, selected: isSelected})}>{title}</a>
    </li>
}

export function Dropdown({options, title, value, disabled, className, onChange, hint, showToggle, hideSelected, maxHeight = '10em'}) {
    const [listOpen, updateListOpen] = useState(false),
        [selectedValue, updateSelectedValue] = useDependantState(() => {
            document.addEventListener('click', collapseDropdown)
            return value
        }, [value], () => {
            document.removeEventListener('click', collapseDropdown)
        }),
        list = useRef(null)

    function collapseDropdown() {
        updateListOpen(false)
    }

    function toggleList(e) {
        e && e.nativeEvent.stopImmediatePropagation()
        updateListOpen(prevState => disabled ? false : !prevState)
    }

    function select(option) {
        collapseDropdown()
        if (disabled) return
        onChange && onChange(option.value || option)
        updateSelectedValue(option)
    }

    const {option: selectedItem, isDefault} = getSelectedOption([value, selectedValue], options),
        posStyle = {}

    if (listOpen) {
        const pos = calculateDropdownPosition(list.current)
        if (pos.x === 'right') {
            posStyle.right = '-0.5em'
        }
    }

    const ddTitle = title || selectedItem.title || selectedItem.value || selectedItem

    return <div className={cn('dd-wrapper', {disabled}, className)} title={hint}>
        <a href="#" className="dd-header" onClick={toggleList}>
            {ddTitle}{!!showToggle && <span className={cn('dd-toggle', {visible: listOpen})}/>}
        </a>
        <ul className={cn('dd-list', {visible: listOpen && !disabled})} ref={list} style={posStyle}>
            {options.filter(opt => !opt.hidden).map((option, i) => {
                if (option === '-') return <li className="dd-list-item" key={i + '-'}>
                    <hr/>
                </li>
                const key = option.value || option.href || option,
                    isSelected = !isDefault && option === selectedItem,
                    style = isSelected && hideSelected ? {display: 'none'} : {}
                return <DropdownOption {...{key, option, select, isSelected, style}} />
            })}
        </ul>
    </div>
}

Dropdown.defaultProps = {
    showToggle: true,
    disabled: false,
    hideSelected: false
}

Dropdown.propTypes = {
    /**
     * Available options
     */
    options: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.shape({
        /**
         * Internal value used for the item identification
         */
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        /**
         * Link href - for dropdown menus
         */
        href: PropTypes.string,
        /**
         * Optional friendly item title
         */
        title: PropTypes.any
    }), PropTypes.string])).isRequired,
    /**
     * Selected value
     */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /**
     * Title to display instead of the selected value if needed
     */
    title: PropTypes.string,
    /**
     * OnChange handler
     */
    onChange: PropTypes.func,
    /**
     * Whether the dropdown interaction is disabled or not
     */
    disabled: PropTypes.bool,
    /**
     * HTML hover title attribute for the control
     */
    hint: PropTypes.string,
    /**
     * Additional HTML classes
     */
    className: PropTypes.string,
    /**
     * Whether to show toggle icon
     */
    showToggle: PropTypes.bool,
    /**
     * Do not show selected item in the dropdown list
     */
    hideSelected: PropTypes.bool,
    /**
     * Maximum dropdown list height
     */
    maxHeight: PropTypes.bool
}