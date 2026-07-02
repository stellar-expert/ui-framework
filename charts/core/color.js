//Minimal color parser supporting the formats the explorer theme actually uses:
//hex (#rgb / #rrggbb), rgb()/rgba(), hsl()/hsla().
//CSS custom properties (var(--x)) are NOT parsed here — they're applied as raw style strings by the renderer.

function parse(input) {
    if (input instanceof Color)
        return {rgba: input.rgba.slice()}
    if (typeof input !== 'string')
        return {rgba: [0, 0, 0, 1]}
    const str = input.trim()
    //hex
    let m = /^#([0-9a-f]{3,8})$/i.exec(str)
    if (m) {
        let hex = m[1]
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('')
        }
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)
        const a = hex.length >= 8 ? parseInt(hex.substr(6, 2), 16) / 255 : 1
        return {rgba: [r, g, b, a]}
    }
    //rgb/rgba
    m = /^rgba?\(([^)]+)\)$/i.exec(str)
    if (m) {
        const parts = m[1].split(',').map(s => parseFloat(s))
        return {rgba: [parts[0] || 0, parts[1] || 0, parts[2] || 0, parts[3] === undefined ? 1 : parts[3]]}
    }
    //hsl/hsla
    m = /^hsla?\(([^)]+)\)$/i.exec(str)
    if (m) {
        const parts = m[1].split(',')
        const h = parseFloat(parts[0])
        const s = parseFloat(parts[1]) / 100
        const l = parseFloat(parts[2]) / 100
        const a = parts[3] === undefined ? 1 : parseFloat(parts[3])
        return {rgba: [...hslToRgb(h, s, l), a]}
    }
    return {rgba: [0, 0, 0, 1], raw: str}
}

function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360
    let r, g, b
    if (s === 0) {
        r = g = b = l
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

export class Color {
    constructor(input) {
        this.rgba = parse(input).rgba
    }

    setOpacity(alpha) {
        this.rgba[3] = alpha
        return this
    }

    get(format = 'rgba') {
        const [r, g, b, a] = this.rgba
        if (format === 'rgb')
            return `rgb(${r},${g},${b})`
        return `rgba(${r},${g},${b},${a})`
    }

    brighten(amount) {
        for (let i = 0; i < 3; i++) {
            this.rgba[i] = Math.max(0, Math.min(255, Math.round(this.rgba[i] + 255 * amount)))
        }
        return this
    }
}
