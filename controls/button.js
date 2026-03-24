import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import './button.scss'

/**
 * Versatile button component rendered as `<button>` or `<a>` tag
 * @param {Object} props
 * @param {string} [props.href] - Link URL; renders as `<a>` tag when set
 * @param {function} [props.onClick] - Click handler
 * @param {boolean} [props.block] - Render as a block-level element
 * @param {boolean} [props.outline] - Render with outline style instead of filled
 * @param {boolean} [props.clear] - Render with no outline, text only
 * @param {boolean} [props.stackable] - Stack buttons on mobile devices
 * @param {boolean} [props.small] - Render a smaller button
 * @param {boolean} [props.disabled] - Disable the button
 * @param {boolean} [props.loading] - Show loading animation
 * @param {string} [props.className] - Additional CSS classes
 * @param {*} props.children - Button content
 */
export const Button = React.memo(function Button({href, onClick, block, outline, clear, stackable, small, disabled, loading, className, children, ...op}) {
    const c = cn('button', {
        small,
        disabled,
        loading,
        'button-block': block,
        'button-outline': outline,
        'button-clear': clear,
        stackable
    }, className)
    const props = {className: c, onClick, ...op}
    if (href) {
        props.onClick = function (e) {
            e.preventDefault()
            return false
        }
        return <a href={href} {...props}>{children}</a>
    }
    if (disabled) {
        props.disabled = true
    }
    return <button {...props}>{children}</button>
})

Button.propTypes = {
    /**
     * Button link - renders the button as A tag; if not set, BUTTON tag is rendered instead
     */
    href: PropTypes.string,
    /**
     * Click handler
     */
    onClick: PropTypes.func,
    /**
     * Whether to render the button as block element
     */
    block: PropTypes.bool,
    /**
     * Render only a thin outline instead of the color-filled button
     */
    outline: PropTypes.bool,
    /**
     * Do not render an outline - just the text
     */
    clear: PropTypes.bool,
    /**
     * Whether buttons should look stackable on mobile devices
     */
    stackable: PropTypes.bool,
    /**
     * Renders a small button
     */
    small: PropTypes.bool,
    /**
     * Whether the button is currently disabled
     */
    disabled: PropTypes.bool,
    /**
     * Show loading animation on the button
     */
    loading: PropTypes.bool,
    /**
     * Externally provided CSS classes
     */
    className: PropTypes.string,
    /**
     * Tooltip text
     */
    title: PropTypes.string,
    /**
     * Text inside the button
     */
    children: PropTypes.any.isRequired
}