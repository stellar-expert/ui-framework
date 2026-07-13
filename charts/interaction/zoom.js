import {isNumber} from '../core/utilities'

//same tint as the navigator selection window, so both "selected range" visuals read as one
const SELECTION_FILL = 'rgba(102,133,194,0.25)'
//clicks and sub-threshold jitters don't zoom
const MIN_SELECTION_PX = 10

//Drag-to-zoom over the plot area: press → drag to highlight an x-range →
//release to zoom into it. Enabled on stock charts and any chart with chart.zoomType === 'x'.
export class ZoomSelection {
    constructor(chart) {
        this.chart = chart
    }

    get enabled() {
        const c = this.chart
        const zoomType = c.options.chart && c.options.chart.zoomType
        return zoomType === 'x' || c.chartType === 'StockChart'
    }

    bind() {
        if (!this.enabled)
            return
        this.svg = this.chart.renderer.root.element
        this.downHandler = e => this.onDown(e)
        this.svg.addEventListener('mousedown', this.downHandler)
        //charts without the range-selector button row get a floating "Reset zoom" control while
        //a drag-selected range is active (the control survives redraws since bind() re-runs on each)
        if (this.isZoomed())
            this.showResetButton()
    }

    //user-driven extremes are active and there is no range selector to reset them with
    isZoomed() {
        const chart = this.chart
        const xa = chart.xAxis && chart.xAxis[0]
        return !chart.rangeSelector && !!xa && (xa.userMin !== undefined || xa.userMax !== undefined)
    }

    showResetButton() {
        if (this.resetBtn)
            return
        const chart = this.chart
        const btn = document.createElement('span')
        btn.className = 'chart-reset-zoom'
        btn.setAttribute('role', 'button')
        btn.tabIndex = 0
        btn.textContent = 'Reset zoom'
        btn.style.top = (chart.plotTop + 6) + 'px'
        btn.style.right = (Math.max(0, chart.chartWidth - chart.plotLeft - chart.plotWidth) + 6) + 'px'
        const reset = () => chart.xAxis[0].setExtremes(null, null)
        btn.addEventListener('click', reset)
        btn.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                reset()
            }
        })
        chart.container.appendChild(btn)
        this.resetBtn = btn
    }

    removeResetButton() {
        if (this.resetBtn && this.resetBtn.parentNode)
            this.resetBtn.parentNode.removeChild(this.resetBtn)
        this.resetBtn = null
    }

    toChartX(e) {
        const rect = this.svg.getBoundingClientRect()
        return (e.clientX - rect.left) * (this.chart.chartWidth / rect.width)
    }

    onDown(e) {
        if (e.button !== 0)
            return
        const chart = this.chart
        const rect = this.svg.getBoundingClientRect()
        const mx = (e.clientX - rect.left) * (chart.chartWidth / rect.width)
        const my = (e.clientY - rect.top) * (chart.chartHeight / rect.height)
        //react only on the plot area itself — the navigator strip and axis labels live outside it
        //and keep their own interactions
        if (mx < chart.plotLeft || mx > chart.plotLeft + chart.plotWidth ||
            my < chart.plotTop || my > chart.plotTop + chart.plotHeight)
            return
        e.preventDefault()
        this.startX = mx
        this.overlay = chart.renderer.rect(mx, chart.plotTop, 0, chart.plotHeight, {})
            .css({fill: SELECTION_FILL, 'pointer-events': 'none'})
            .add(chart.renderer.root)
        this.moveHandler = ev => this.onMove(ev)
        this.upHandler = ev => this.onUp(ev)
        document.addEventListener('mousemove', this.moveHandler)
        document.addEventListener('mouseup', this.upHandler)
    }

    selectionBounds(ev) {
        const chart = this.chart
        const x = Math.max(chart.plotLeft, Math.min(this.toChartX(ev), chart.plotLeft + chart.plotWidth))
        return [Math.min(this.startX, x), Math.max(this.startX, x)]
    }

    onMove(ev) {
        const [x0, x1] = this.selectionBounds(ev)
        if (this.overlay)
            this.overlay.attr({x: x0, width: x1 - x0})
        //the tooltip's svg-level listener fired before this document-level one — hide what it drew,
        //so the selection band isn't obscured while dragging
        if (this.chart.tooltip)
            this.chart.tooltip.hide()
    }

    onUp(ev) {
        const chart = this.chart
        const [x0, x1] = this.selectionBounds(ev)
        this.cancel()
        if (x1 - x0 < MIN_SELECTION_PX)
            return
        const xAxis = chart.xAxis[0]
        const span = (xAxis.max - xAxis.min) || 1
        const toValue = px => xAxis.min + ((px - xAxis.left) / xAxis.len) * span
        let vMin = toValue(x0)
        let vMax = toValue(x1)
        //respect the axis' minimum zoom window (e.g. 1h on the price chart): widen around the center
        const minRange = xAxis.options.minRange
        if (isNumber(minRange) && vMax - vMin < minRange) {
            const mid = (vMin + vMax) / 2
            vMin = mid - minRange / 2
            vMax = mid + minRange / 2
        }
        //a manually selected range doesn't correspond to any period button
        if (chart.rangeSelector)
            chart.rangeSelector.clearSelection()
        xAxis.setExtremes(vMin, vMax)
    }

    //abort an in-flight drag and remove the selection band
    cancel() {
        if (this.moveHandler) {
            document.removeEventListener('mousemove', this.moveHandler)
            document.removeEventListener('mouseup', this.upHandler)
            this.moveHandler = this.upHandler = null
        }
        if (this.overlay) {
            this.overlay.destroy()
            this.overlay = null
        }
    }

    destroy() {
        this.cancel()
        this.removeResetButton()
        if (this.svg && this.downHandler)
            this.svg.removeEventListener('mousedown', this.downHandler)
        this.svg = null
    }
}
