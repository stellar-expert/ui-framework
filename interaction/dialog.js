import React from 'react'
import PropTypes from 'prop-types'
import './dialog.scss'

/**
 * Modal dialog
 * @param {boolean} dialogOpen - Whether a dialog is shown
 * @param {*} children - Dialog content
 * @return {JSX.Element|null}
 * @constructor
 */
export const Dialog = React.memo(function Dialog({dialogOpen, children}) {
    if (!dialogOpen)
        return null
    return <div className="dialog">
        <div className="dialog-backdrop"/>
        <div className="dialog-content container">
            <div className="container">
                {children}
            </div>
        </div>
    </div>
})

Dialog.propTypes = {
    dialogOpen: PropTypes.bool,
    children: PropTypes.any
}