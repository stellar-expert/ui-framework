import React from 'react'
import './identicon.scss'

const RESOLUTION = 7
const SIZE = 448
const base32Alphabet = {}

//map base32 alphabet
'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.split('').map((c, i) => base32Alphabet[c] = i)

function decodeBase32(input) {
    const buf = []
    let shift = 8
    let carry = 0

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
 * @param {String} address - StrKey-encoded account address
 * @param {Number} size? - Identicon size
 * @return {String}
 */
export function drawIdenticon(address, size = SIZE) {
    //take 16 meaningful bytes from the raw pub key
    const decoded = decodeBase32(address).slice(2, 16)
    const width = RESOLUTION
    const height = RESOLUTION
    const columns = Math.ceil(width / 2)
    const cellSize = size / width
    const addressBytes = decoded.slice(1)
    const fillStyle = `hsl(${360 * decoded[0] / 256 | 0},58%,52%)`
    const dots = []
    const rsize = ` width="${cellSize}" height="${cellSize}"`
    for (let row = 0; row < height; row++) {
        for (let column = 0; column < columns; column++) {
            const position = column + row * columns
            const bitSet = (addressBytes[position / 8 | 0] & (1 << (7 - position % 8))) !== 0
            if (bitSet) {
                dots.push(`<rect x="${cellSize * column}" y="${cellSize * row}"${rsize}/>`)
                dots.push(`<rect x="${cellSize * (width - column - 1)}" y="${cellSize * row}"${rsize}/>`)
            }
        }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="${fillStyle}">${dots.join('')}</svg>`
}

/**
 * Renders account-specific identicon
 * @param {String} address - StrKey-encoded account address
 * @param {Number} size - Identicon size
 * @constructor
 */
export const AccountIdenticon = React.memo(function AccountIdenticon({address, size}) {
    const props = {
        className: 'identicon',
        src: 'data:image/svg+xml;charset=utf-8,' + drawIdenticon(address),
        width: SIZE,
        height: SIZE
    }
    if (size) {
        props.style = {
            width: size,
            height: size
        }
    }
    return <img {...props}/>
})