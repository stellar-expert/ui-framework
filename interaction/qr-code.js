import React, {useMemo, useRef} from 'react'
import {QRCodeCanvas} from 'qrcode.react'

/**
 * QrCode renderer
 * @param {string} value - Value to encode
 * @param {string} [caption] - Additional caption under QR code
 * @param {number} [size] - Width|height fo the rendered QR code image
 * @param {string} [embeddedImage] - Optional logo to render in the center of QR code
 * @param {number} [embeddedSize] - Embedded logo size (by default 10% of QR code size)
 * @return {JSX.Element}
 */
export const QrCode = React.memo(function QrCode({value, caption, size = 320, embeddedImage, embeddedSize}) {
    const foreground = useMemo(() => getComputedStyle(document.documentElement).getPropertyValue('--color-primary'))
    const containerRef = useRef()
    return <div className="text-center" ref={containerRef}>
        <QRCodeCanvas value={value} size={256} level="Q" includeMargin imageSettings={embedImage(embeddedImage, embeddedSize, size)}
            fgColor={foreground} style={{width: size + 'px', height: size + 'px', display: 'block', margin: 'auto'}}/>
        {!!caption && <div className="text-small dimmed condensed word-break">{caption}</div>}
    </div>
})

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