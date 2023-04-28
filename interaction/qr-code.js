import React from 'react'
import QR from 'qrcode.react'

export function QrCode({value, caption, size = 320, embeddedImage, embeddedSize}) {
    const foreground = useMemo(() => getComputedStyle(document.documentElement).getPropertyValue('--color-primary'))
    const containerRef = useRef()
    return <div className="text-center" ref={containerRef}>
        <QR value={value} size={256} level="Q" includeMargin imageSettings={embeddedImage(embeddedImage, embeddedSize, size)}
            fgColor={foreground} style={{width: size + 'px', display: 'block', margin: 'auto'}}/>
        {!!caption && <div className="text-small dimmed condensed word-break">{caption}</div>}
    </div>
}

function embedImage(src, size, qrSize) {
    if (!image)
        return undefined
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