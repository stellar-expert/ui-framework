import React, {useRef, useEffect} from 'react'
import PropTypes from 'prop-types'
import './identicon.scss'

const DEFAULT_SIZE = 7
const base32Alphabet = {};
('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567').split('').map((c, i) => base32Alphabet[c] = i)

function decodeBase32(input) {
    const buf = []
    let shift = 8,
        carry = 0

    input.toUpperCase().split('').forEach(char => {
        const symbol = base32Alphabet[char] & 0xff
        shift -= 5
        if (shift > 0) {
            carry |= symbol << shift
        } else if (shift < 0) {
            buf.push(carry | (symbol >> -shift))
            shift += 8
            carry = (symbol << shift) & 0xff
        } else {
            buf.push(carry | symbol)
            shift = 8
            carry = 0
        }
    })

    if (shift !== 8 && carry !== 0) {
        buf.push(carry)
        shift = 8
        carry = 0
    }

    return buf
}

/**
 * Draw Stellar address identicon on the given canvas
 * @param {HTMLCanvasElement|CanvasRenderingContext2D} canvas
 * @param {String} stellarAddress
 * @param {Number} [size]
 * @param {{top: Number, left: number}} [offset]
 */
export function drawIdenticon(canvas, stellarAddress, size = null, offset = null) {
    if (!canvas || !stellarAddress) return
    if (canvas?.getContext){
        canvas = canvas.getContext('2d')
    }
    if (!(canvas instanceof CanvasRenderingContext2D) || !canvas.canvas.width) return
    if (!offset) {
        offset = {top: 0, left: 0}
    }
    if (size === null) {
        size = canvas.canvas.width
    }
    //take 16 meaningful bytes from the raw pub key
    const decoded = decodeBase32(stellarAddress).slice(2, 16),
        width = DEFAULT_SIZE,
        height = DEFAULT_SIZE,
        columns = Math.ceil(width / 2),
        cellSize = size / width,
        addressBytes = decoded.slice(1)

    canvas.fillStyle = `hsl(${360 * decoded[0] / 256 | 0},58%,52%)`
    canvas.clearRect(offset.left, offset.top, size, size)
    for (let row = 0; row < height; row++) {
        for (let column = 0; column < columns; column++) {
            const position = column + row * columns,
                bitSet = (addressBytes[position / 8 | 0] & (1 << (7 - position % 8))) !== 0
            if (bitSet) {
                canvas.fillRect(offset.left + cellSize * column, offset.top + cellSize * row, cellSize, cellSize)
                canvas.fillRect(offset.left + cellSize * (width - column - 1), offset.top + cellSize * row, cellSize, cellSize)
            }
        }
    }
}

export function AccountIdenticon({address, size}) {
    const canvas = useRef(null)
    useEffect(() => drawIdenticon(canvas.current, address), [address])

    const props = {
        className: 'identicon',
        ref: canvas,
        width: 448,
        height: 448
    }
    if (size) {
        props.style = {
            width: size,
            height: size
        }
    }

    return <canvas {...props}/>
}

AccountIdenticon.propTypes = {
    address: PropTypes.string.isRequired
}