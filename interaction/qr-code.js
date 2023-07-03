import React, {useMemo, useRef} from 'react'
import QR from 'qrcode.react'

/**
 * QrCode renderer
 * @param {String} value - Value to encode
 * @param {String} [caption] - Additional caption under QR code
 * @param {Number} [size] - Width|height fo the rendered QR code image
 * @param {String} [embeddedImage] - Optional logo to render in the center of QR code
 * @param {Number} [embeddedSize] - Embeded logo size (by default 10% of QR code size)
 * @return {JSX.Element}
 */
export function QrCode({value, caption, size = 320, embeddedImage, embeddedSize}) {
    const foreground = useMemo(() => getComputedStyle(document.documentElement).getPropertyValue('--color-primary'))
    const containerRef = useRef()
    return <div className="text-center" ref={containerRef}>
        <QR value={value} size={256} level="Q" includeMargin imageSettings={embedImage(embeddedImage, embeddedSize, size)}
            fgColor={foreground} style={{width: size + 'px', height: size + 'px', display: 'block', margin: 'auto'}}/>
        {!!caption && <div className="text-small dimmed condensed word-break">{caption}</div>}
    </div>
}

function embedImage(src, size, qrSize) {
    if (!src)
        return undefined
    if (!size) {
        size = qrSize * 0.1
    }
    return {
        src,
        height: size,
        width: size,
        excavate: true
    }
}

function download(container, caption) {
    const canvas = container.querySelector('canvas')
    const link = document.createElement('a')
    link.href = canvas.toDataURL()
    link.download = caption ? caption.replace(/\W+/g, '-') + '-qr.png' : `qr${new Date().getTime()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}