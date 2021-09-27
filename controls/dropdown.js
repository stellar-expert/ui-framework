import React, {useRef, useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {throttle} from 'throttle-debounce'
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

export function Dropdown({
                             options,
                             title,
                             value,
                             disabled,
                             className,
                             onChange,
                             hint,
                             showToggle,
                             solo,
                             hideSelected,
                             header,
                             footer,
                             onScroll,
                             onOpen,
                             onClose,
                             maxHeight = '35em'
                         }) {
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
        onOpen?.call(this, this)
    }

    function toggleList(e) {
        e && e.nativeEvent.stopImmediatePropagation()
        updateListOpen(prevState => {
            if (disabled) return false;
            (prevState ? onClose : onOpen)?.call(this, this)
            return !prevState
        })
    }

    function select(option) {
        collapseDropdown()
        if (disabled) return
        onChange && onChange(option.value || option)
        updateSelectedValue(option)
    }

    function preventClosing(e) {
        e.stopPropagation()
    }

    const scrollList = throttle(200, false, e => {
        if (onScroll) {
            const {target} = e,
                pos = {position: target.scrollTop, rel: 'middle'}
            if (target.scrollTop === 0)
                return onScroll({...pos, rel: 'top'})
            if (Math.ceil(target.scrollHeight - target.scrollTop - 8) < target.clientHeight)
                return onScroll({...pos, rel: 'bottom'})
            onScroll(pos)
        }
    })

    let {option: selectedItem, isDefault} = getSelectedOption([value, selectedValue], options),
        listStyle = {maxHeight: `min(70vh, ${maxHeight})`},
        listClass


    if (listOpen) {
        const rect = list.current.getBoundingClientRect()
        if (window.innerWidth - rect.right < 0 && rect.left - rect.width >= 0) {
            listClass = 'align-right'
        }
    }

    const ddTitle = title || selectedItem?.title || selectedItem?.value || selectedItem

    return <div className={cn('dd-wrapper', {disabled, solo}, className)} title={hint}>
        <a href="#" className="dd-header" onClick={toggleList}>
            {ddTitle}{!!showToggle && <span className={cn('dd-toggle', {visible: listOpen})}/>}
        </a>
        {!!listOpen && <div className="backdrop"/>}
        <div className={cn('dd-list', listClass, {visible: listOpen && !disabled})} ref={list}>
            {!!header && <>
                <div className="dd-list-header" onClick={preventClosing}>{header}</div>
                <hr/>
            </>}
            <ul onScroll={scrollList} style={listStyle}>
                {options.filter(opt => !opt.hidden).map((option, i) => {
                    if (option === '-') return <li className="dd-list-item" key={i + '-'}>
                        <hr className="flare"/>
                    </li>
                    const key = option.value || option.href || option,
                        isSelected = !isDefault && option === selectedItem,
                        style = isSelected && hideSelected ? {display: 'none'} : {}
                    return <DropdownOption {...{key, option, select, isSelected, style}} />
                })}
            </ul>
            {!!footer && <>
                <hr/>
                <div className="dd-list-footer" onClick={preventClosing}>{footer}</div>
            </>}
        </div>
    </div>
}

Dropdown.defaultProps = {
    showToggle: true,
    disabled: false,
    hideSelected: false,
    solo: false
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
     * Show a dropdown list in centered dialog
     */
    solo: PropTypes.bool,
    /**
     * Do not show selected item in the dropdown list
     */
    hideSelected: PropTypes.bool,
    /**
     * Optional dropdown list header
     */
    header: PropTypes.any,
    /**
     * Optional dropdown list footer
     */
    footer: PropTypes.any,
    /**
     * List scroll handler - fires only if the options list has overflow
     */
    onScroll: PropTypes.func,
    /**
     * List open handler
     */
    onOpen: PropTypes.func,
    /**
     * Lsi close handler
     */
    onClose: PropTypes.func,
    /**
     * Maximum dropdown list height
     */
    maxHeight: PropTypes.bool
}