//Low-level SVG drawing layer — the single place that touches the DOM.
//Everything above this works in abstract element wrappers.

const SVG_NS = 'http://www.w3.org/2000/svg'

export class SvgElement {
    constructor(nodeName) {
        this.element = document.createElementNS(SVG_NS, nodeName)
    }

    attr(key, value) {
        if (typeof key === 'object') {
            for (const k of Object.keys(key))
                this.attr(k, key[k])
            return this
        }
        if (value === undefined || value === null)
            return this
        //colors and fonts go through the style channel so CSS custom properties (var(--x)) resolve
        if ((key === 'fill' || key === 'stroke') && /var\(|inherit|currentColor/.test(String(value))) {
            this.element.style[key] = value
        } else {
            this.element.setAttribute(key, value)
        }
        return this
    }

    css(styles) {
        Object.assign(this.element.style, styles)
        return this
    }

    addClass(name) {
        this.element.setAttribute('class', ((this.element.getAttribute('class') || '') + ' ' + name).trim())
        return this
    }

    text(content) {
        this.element.textContent = content
        return this
    }

    html(content) {
        this.element.innerHTML = content
        return this
    }

    on(event, handler) {
        this.element.addEventListener(event, handler)
        return this
    }

    add(parent) {
        (parent ? parent.element : null)?.appendChild(this.element)
        return this
    }

    getBBox() {
        try {
            return this.element.getBBox()
        } catch (e) {
            return {x: 0, y: 0, width: 0, height: 0}
        }
    }

    destroy() {
        if (this.element.parentNode)
            this.element.parentNode.removeChild(this.element)
        this.element = null
    }
}

export class SvgRenderer {
    constructor(container, width, height) {
        this.container = container
        this.root = new SvgElement('svg')
        this.root.attr({version: '1.1', class: 'ix-chart-root'})
        this.root.css({display: 'block', overflow: 'visible'})
        this.setSize(width, height)
        container.appendChild(this.root.element)
        this.defs = this.element('defs').add(this.root)
    }

    setSize(width, height) {
        this.width = width
        this.height = height
        this.root.attr({width, height, viewBox: `0 0 ${width} ${height}`})
    }

    element(nodeName) {
        return new SvgElement(nodeName)
    }

    group(className) {
        const g = this.element('g')
        if (className)
            g.attr('class', className)
        return g
    }

    path(d, attrs) {
        const p = this.element('path').attr('d', Array.isArray(d) ? d.join(' ') : d)
        p.attr({fill: 'none', ...attrs})
        return p
    }

    rect(x, y, width, height, attrs) {
        return this.element('rect').attr({x, y, width: Math.max(0, width), height: Math.max(0, height), ...attrs})
    }

    line(x1, y1, x2, y2, attrs) {
        return this.element('line').attr({x1, y1, x2, y2, ...attrs})
    }

    circle(cx, cy, r, attrs) {
        return this.element('circle').attr({cx, cy, r, ...attrs})
    }

    label(content, x, y, attrs) {
        const t = this.element('text').attr({x, y, ...attrs})
        t.text(content)
        return t
    }

    /**
     * Create a linear gradient in <defs> and return a `url(#id)` reference.
     * @param {{x1,y1,x2,y2}} vector - direction in object bounding box units (0..1)
     * @param {[number, string][]} stops - [offset, color] pairs
     * @param {string} id
     */
    linearGradient(vector, stops, id) {
        const grad = this.element('linearGradient').attr({
            id,
            x1: vector.x1, y1: vector.y1, x2: vector.x2, y2: vector.y2
        })
        for (const [offset, col] of stops) {
            this.element('stop').attr({offset, 'stop-color': col}).add(grad)
        }
        grad.add(this.defs)
        return `url(#${id})`
    }

    clipRect(x, y, width, height, id) {
        const clip = this.element('clipPath').attr('id', id)
        this.rect(x, y, width, height).add(clip)
        clip.add(this.defs)
        return `url(#${id})`
    }

    destroy() {
        if (this.root && this.root.element && this.root.element.parentNode)
            this.root.element.parentNode.removeChild(this.root.element)
        this.root = null
    }
}
