import React, {useState, useRef} from 'react'
import cn from 'classnames'
import './tooltip.scss'

/**
 * Compute tooltip position
 * @param {EventTarget} target - Mouse hover target
 * @param {Element} node - Tooltip object
 * @param {'top'|'bottom'|'left'|'right'} desiredPlace - Desired tooltip place
 * @param {Object} offset
 * @return {{place: String, position: {top: Number, left: Number}}}
 */
function calculateTooltipPosition(target, node, desiredPlace, offset) {
    //dimensions of node and target
    const {width: tipWidth, height: tipHeight} = getBoundingRect(node)
    const {width: targetWidth, height: targetHeight} = getBoundingRect(target)
    //mouse offset
    const {mouseX, mouseY} = getMouseOffset(target)
    const {offsetX, offsetY} = parseOffset(offset)
    const defaultOffset = getDefaultPosition(targetWidth, targetHeight, tipWidth, tipHeight)

    // Get the edge offset of the tooltip
    function getTipOffsetLeft(place) {
        return mouseX + defaultOffset[place].l + offsetX
    }

    function getTipOffsetRight(place) {
        return mouseX + defaultOffset[place].r + offsetX
    }

    function getTipOffsetTop(place) {
        return mouseY + defaultOffset[place].t + offsetY
    }

    function getTipOffsetBottom(place) {
        return mouseY + defaultOffset[place].b + offsetY
    }

    function isOutside(p) {
        return getTipOffsetLeft(p) < 0 || //outside left
            getTipOffsetRight(p) > window.innerWidth || //outside right
            getTipOffsetTop(p) < 0 || //outside top
            getTipOffsetBottom(p) > window.innerHeight //outside bottom
    }

    let place = 'top'
    if (!isOutside(desiredPlace)) {
        place = desiredPlace || 'top'
    } else {
        const possiblePlacements = (['top', 'bottom', 'left', 'right']).filter(p => !isOutside(p))
        if (possiblePlacements.length > 0 && isOutside(desiredPlace)) {
            place = possiblePlacements[0] || 'top'
        }
    }

    return {
        place,
        position: {
            top: (getTipOffsetTop(place) + window.scrollY) | 0,
            left: tipWidth >= window.innerWidth ? 0 : ((getTipOffsetLeft(place) + window.scrollX) | 0)
        }
    }
}

/**
 * @param {Element} node
 * @return {PositionRect}
 */
function getBoundingRect(node) {
    const {width, height, top, left} = node.getBoundingClientRect()
    return {
        width: width | 0,
        height: height | 0,
        top: top | 0,
        left: left | 0
    }
}

/**
 * @param {Element} element
 * @return {{mouseX: Number, mouseY: Number}}
 */
function getMouseOffset(element) {
    const {width, height, top, left} = getBoundingRect(element)
    return {
        mouseX: (left + (width / 2)) | 0,
        mouseY: (top + (height / 2)) | 0
    }
}

/**
 * @param {Number} targetWidth
 * @param {Number} targetHeight
 * @param {Number} tipWidth
 * @param {Number} tipHeight
 *  */
function getDefaultPosition(targetWidth, targetHeight, tipWidth, tipHeight) {
    const notchSize = 4
    return {
        top: {
            l: -tipWidth / 2,
            r: tipWidth / 2,
            t: -targetHeight / 2 - tipHeight + notchSize,
            b: -targetHeight / 2
        },
        bottom: {
            l: -tipWidth / 2,
            r: tipWidth / 2,
            t: targetHeight / 2 - notchSize,
            b: targetHeight / 2 + tipHeight
        },
        left: {
            l: -tipWidth - targetWidth / 2 + notchSize,
            r: -targetWidth / 2 + notchSize,
            t: -tipHeight / 2,
            b: tipHeight / 2
        },
        right: {
            l: targetWidth / 2 - notchSize / 2,
            r: tipWidth + targetWidth / 2,
            t: -tipHeight / 2,
            b: tipHeight / 2
        }
    }
}

/**
 * @param {PositionOffset} offset
 * @return {{offsetX: Number, offsetY: Number}}
 */
function parseOffset(offset) {
    let offsetX = 0,
        offsetY = 0

    for (let key in Object.keys(offset)) {
        const value = parseInt(offset[key])
        if (key === 'top') {
            offsetY -= value
        } else if (key === 'bottom') {
            offsetY += value
        } else if (key === 'left') {
            offsetX -= value
        } else if (key === 'right') {
            offsetX += value
        }
    }

    return {offsetX, offsetY}
}

/**
 * Tooltip component
 * @param {HTMLElement} trigger
 * @param {PositionDescriptor} desiredPlace
 * @param {PositionOffset} [offset]
 * @param {'hover'|'click'} [activation]
 * @param {String} [maxWidth]
 * @param {*} [children]
 * @constructor
 */
export const Tooltip = React.memo(function Tooltip({
                                                       trigger,
                                                       desiredPlace = 'top',
                                                       offset = {},
                                                       activation = 'hover',
                                                       children,
                                                       maxWidth,
                                                       ...op
                                                   }) {
    const [visible, setVisible] = useState(false)
    const [rendered, setRendered] = useState(false)
    const [place, setPlace] = useState('top')
    const [position, setPosition] = useState({top: 0, left: 0})
    const content = useRef(null)

    function activate(e) {
        if (visible)
            return
        const {currentTarget} = e
        setRendered(true)
        content.current.showPopover()
        setTimeout(() => {
            if (visible)
                return
            const {place, position} = calculateTooltipPosition(currentTarget, content.current, desiredPlace, offset)
            setVisible(true)
            setPosition(position)
            setPlace(place)
        }, 400)
    }

    function onMouseLeave(e) {
        if (!visible)
            return
        content.current.hidePopover()
        setVisible(false)
        setRendered(false)
    }

    const triggerProps = {
        onMouseLeave,
        ...op
    }
    if (activation === 'hover') {
        triggerProps.onMouseEnter = activate
    } else {
        triggerProps.onClick = activate
    }
    const containerStyle = {
        left: position.left + 'px',
        top: position.top + 'px'
    }
    if (maxWidth) {
        containerStyle.width = '100vw'
        containerStyle.maxWidth = maxWidth
    }

    return React.cloneElement(trigger, triggerProps, <div ref={content} className="tooltip-wrapper" style={containerStyle} popover="auto">
        <div className={cn('tooltip', place, {visible})}>
            <div className="tooltip-content">{rendered ? children : null}</div>
        </div>
    </div>)
})

/**
 * @typedef {'top'|'bottom'|'left'|'right'} PositionDescriptor
 */
/**
 * @typedef {Object} PositionRect
 * @property {Number} top - Top offset
 * @property {Number} left - Left offset
 * @property {Number} width - Element width
 * @property {Number} height - Element height
 */
/**
 * @typedef {Object} PositionOffset
 * @property {Number} [top] - Top offset
 * @property {Number} [bottom] - Bottom offset
 * @property {Number} [left] - Left offset
 * @property {Number} [right] - Right offset
 */