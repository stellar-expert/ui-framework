import {resolvePointerTarget} from './tooltip'

//maximum pointer travel still treated as a click
const MAX_CLICK_DRIFT = 10

//reports plot area clicks through chart.events.click
export class PointClick {
    constructor(chart) {
        this.chart = chart
    }

    get handler() {
        const events = this.chart.options.chart && this.chart.options.chart.events
        return events && typeof events.click === 'function' ? events.click : null
    }

    bind() {
        if (!this.handler)
            return
        this.svg = this.chart.renderer.root.element
        this.downHandler = e => this.onDown(e)
        this.clickHandler = e => this.onClick(e)
        this.svg.addEventListener('mousedown', this.downHandler)
        this.svg.addEventListener('click', this.clickHandler)
        this.svg.style.cursor = 'pointer'
    }

    onDown(e) {
        this.origin = e.button === 0 ? [e.clientX, e.clientY] : null
    }

    onClick(e) {
        const origin = this.origin
        this.origin = null
        if (!origin)
            return
        if (Math.abs(e.clientX - origin[0]) > MAX_CLICK_DRIFT ||
            Math.abs(e.clientY - origin[1]) > MAX_CLICK_DRIFT)
            return
        const target = resolvePointerTarget(this.chart, e)
        if (target) {
            this.handler.call(this.chart, target)
        }
    }

    destroy() {
        if (this.svg) {
            this.svg.removeEventListener('mousedown', this.downHandler)
            this.svg.removeEventListener('click', this.clickHandler)
            this.svg.style.cursor = ''
            this.svg = null
        }
        this.origin = null
    }
}
