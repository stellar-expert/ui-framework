import React from 'react'
import {createPortal} from 'react-dom'
import PropTypes from 'prop-types'
import cn from 'classnames'
import './dialog.scss'

/**
 * Modal dialog
 * @param {boolean} dialogOpen - Whether a dialog is shown
 * @param {boolean} [big] - Increases dialog max-width to 42em
 * @param {string} [className] - Extra CSS classes for the dialog container
 * @param {*} children - Dialog content
 * @return {JSX.Element|null}
 * @constructor
 */
export const Dialog = React.memo(function Dialog({dialogOpen, big, className, children}) {
    if (!dialogOpen)
        return null
    return createPortal(<div className="dialog">
        <div className="dialog-backdrop"/>
        <div className="dialog-content container">
            <div className={cn('container', {big}, className)}>
                {children}
            </div>
        </div>
    </div>, document.body)
})

Dialog.propTypes = {
    dialogOpen: PropTypes.bool,
    big: PropTypes.bool,
    className: PropTypes.string,
    children: PropTypes.any
}