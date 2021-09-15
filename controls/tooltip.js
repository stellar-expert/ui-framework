import React, {useState, useRef} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import './tooltip.scss'

/**
 * Compute tooltip position
 * @param {MouseEvent} e - Mouse event
 * @param {Element} node - Tooltip object
 * @param {'top'|'bottom'|'left'|'right'} desiredPlace - Desired tooltip place
 * @param {Object} offset
 * @return {{place: string, position: {top: number, left: number}}}
 */
function getTooltipPosition(e, node, desiredPlace, offset) {
    const target = e.currentTarget
    //dimensions of node and target
    const {width: tipWidth, height: tipHeight} = getBoundingRect(node),
        {width: targetWidth, height: targetHeight} = getBoundingRect(target)
    //mouse offset
    const {mouseX, mouseY} = getMouseOffset(target),
        {offsetX, offsetY} = parseOffset(offset),
        defaultOffset = getDefaultPosition(targetWidth, targetHeight, tipWidth, tipHeight)

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

    function isInside(p) {
        return !isOutside(p)
    }

    let place
    if (isInside(desiredPlace)) {
        place = desiredPlace
    } else {
        const possiblePlacements = (['top', 'bottom', 'left', 'right']).filter(p => isInside(p))
        if (possiblePlacements.length > 0 && isOutside(desiredPlace)) {
            place = possiblePlacements[0]
        }
    }

    const {top: parentTop, left: parentLeft} = target.getBoundingClientRect()

    return {
        place,
        position: {
            top: (getTipOffsetTop(place) - parentTop) | 0,
            left: (getTipOffsetLeft(place) - parentLeft) | 0
        }
    }
}

function getBoundingRect(node) {
    const {width, height, top, left} = node.getBoundingClientRect()
    return {
        width: width | 0,
        height: height | 0,
        top: top | 0,
        left: left | 0
    }
}

function getMouseOffset(currentTarget) {
    const {width, height, top, left} = getBoundingRect(currentTarget)
    return {
        mouseX: (left + (width / 2)) | 0,
        mouseY: (top + (height / 2)) | 0
    }
}

function getDefaultPosition(targetWidth, targetHeight, tipWidth, tipHeight) {
    const notchSize = 6
    return {
        top: {
            l: -tipWidth / 2,
            r: tipWidth / 2,
            t: -targetHeight / 2 + tipHeight + notchSize,
            b: -targetHeight / 2
        },
        bottom: {
            l: -tipWidth / 2,
            r: tipWidth / 2,
            t: targetHeight / 2 + notchSize,
            b: targetHeight / 2 + tipHeight
        },
        left: {
            l: -tipWidth + targetWidth / 2,
            r: -targetWidth / 2 + notchSize,
            t: -tipHeight / 2,
            b: tipHeight / 2
        },
        right: {
            l: targetWidth / 2 + notchSize,
            r: tipWidth + targetWidth / 2,
            t: -tipHeight / 2,
            b: tipHeight / 2
        }
    }
}

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

export function Tooltip({desiredPlace = 'top', offset = {}, trigger, children, maxWidth = '20em', ...op}) {
    const [visible, setVisible] = useState(false),
        [place, setPlace] = useState('top'),
        [position, setPosition] = useState({top: 0, left: 0}),
        content = useRef(null)

    function mouseEnter(e) {
        if (visible) return
        const {place, position} = getTooltipPosition(e, content.current, desiredPlace, offset)
        setVisible(true)
        setPosition(position)
        setPlace(place)
    }

    function mouseLeave(e) {
        if (!visible) return
        setVisible(false)
    }

    const triggerProps = {
        onMouseEnter: e => mouseEnter(e),
        onMouseLeave: e => mouseLeave(e),
        ...op
    }
    const contentStyle = {
        maxWidth,
        left: position.left + 'px',
        top: position.top + 'px'
    }
    return React.cloneElement(trigger, triggerProps, <div className="tooltip-wrapper" style={contentStyle}>
        <div ref={content} className={cn('tooltip', place)}>
            <div className="tooltip-content">{children}</div>
        </div>
    </div>)
}

Tooltip.propTypes = {
    trigger: PropTypes.element.isRequired,
    maxWidth: PropTypes.string
}