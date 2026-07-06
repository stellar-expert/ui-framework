import {isNumber} from '../core/utilities'

const DAY = 24 * 3600 * 1000

function buttonPeriodMs(b) {
    if (b.type === 'month') return (b.count || 1) * 30 * DAY
    if (b.type === 'year') return (b.count || 1) * 365 * DAY
    if (b.type === 'day') return (b.count || 1) * DAY
    return Infinity
}

//Floating range-selector buttons (1m / 3m / 6m / 1y / All) for StockChart, mirroring the explorer's config.
export class RangeSelector {
    constructor(chart) {
        this.chart = chart
        this.options = chart.options.rangeSelector
        this.selected = 'all' //default view = full range
        //if an initial xAxis.range is set, pre-select the matching button
        const initialRange = chart.xAxis[0] && chart.xAxis[0].options.range
        if (this.options && this.options.buttons && isNumber(initialRange)) {
            let bestIdx = -1
            let bestDiff = Infinity
            this.options.buttons.forEach((b, i) => {
                const diff = Math.abs(buttonPeriodMs(b) - initialRange)
                if (diff < bestDiff) {
                    bestDiff = diff
                    bestIdx = i
                }
            })
            if (bestIdx >= 0)
                this.selected = bestIdx
        }
        if (this.options && this.options.buttons)
            this.build()
    }

    build() {
        const chart = this.chart
        //overlay wrapper — visual styling lives in .chart-range-selector (chart.scss); only the dynamic
        //horizontal offset (plotLeft) is set inline in reposition()
        const el = document.createElement('div')
        el.className = 'chart-range-selector'
        this.el = el
        const zoomLabel = document.createElement('span')
        zoomLabel.className = 'zoom-label'
        zoomLabel.textContent = 'Zoom'
        el.appendChild(zoomLabel)
        this.zoomLabel = zoomLabel

        //a button is disabled when the loaded data doesn't span its period —
        //e.g. only ~1y of data → 'All' and '1y' work, but a hypothetical longer button would be greyed out
        const xa = chart.xAxis[0]
        const dataRange = (xa && isNumber(xa.dataMax) && isNumber(xa.dataMin)) ? xa.dataMax - xa.dataMin : Infinity

        //controls are rendered as plain spans (NOT <button>/.button) so they keep the charts-lib's own
        //self-contained style and never inherit the global project button look (skew/sizing/focus rules)
        this.buttons = this.options.buttons.map((b, i) => {
            const btn = document.createElement('span')
            btn.className = 'chart-zoom-btn'
            btn.setAttribute('role', 'button')
            btn.textContent = b.text
            //tolerance of one day absorbs the approximate month/year lengths
            const disabled = b.type !== 'all' && buttonPeriodMs(b) > dataRange + DAY
            if (!disabled) {
                btn.tabIndex = 0
                btn.addEventListener('click', () => this.apply(b, i))
                btn.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        this.apply(b, i)
                    }
                })
            }
            el.appendChild(btn)
            return {btn, def: b, disabled}
        })
        chart.container.appendChild(el)
        this.highlight()
        this.applyResponsiveSizing()
        this.reposition()
    }

    //drop the "Zoom" label on narrow charts so 1y/All stay fully visible on popular mobile widths
    //instead of clipping at the right edge. Re-run on every redraw via reposition().
    applyResponsiveSizing() {
        const compact = (this.chart.chartWidth || 600) < 420
        if (this.zoomLabel)
            this.zoomLabel.style.display = compact ? 'none' : ''
    }

    //full data range, unioned with the navigator's own series. Views that lazy-load data on zoom replace
    //the main series with just the visible sub-window (keeping the full lifespan only in navigator.series),
    //so the axis' dataMin/dataMax shrink to the loaded slice — anchoring the buttons on those would make
    //'All' re-select the current window instead of the whole history
    getUnionExtremes() {
        const xAxis = this.chart.xAxis[0]
        let {dataMin, dataMax} = xAxis
        const navSeries = this.chart.options.navigator && this.chart.options.navigator.series
        const navData = navSeries && navSeries.data
        if (navData && navData.length) {
            for (const p of navData) {
                const x = Array.isArray(p) ? p[0] : p && p.x
                if (!isNumber(x))
                    continue
                if (!isNumber(dataMin) || x < dataMin) dataMin = x
                if (!isNumber(dataMax) || x > dataMax) dataMax = x
            }
        }
        return {dataMin, dataMax}
    }

    apply(b, i) {
        const xAxis = this.chart.xAxis[0]
        const {dataMin, dataMax} = this.getUnionExtremes()
        if (b.type === 'all') {
            this.selected = 'all'
            //explicit full extremes so the initial xAxis.range window doesn't re-apply
            xAxis.setExtremes(dataMin, dataMax)
        } else {
            const count = b.count || 1
            //the window always ENDS at the last data point; going back a calendar
            //month/year/day for the start. Anchoring the end on dataMax keeps the right edge flush with the
            //data instead of snapping forward to the next month boundary (which left a gap on the right).
            const max = dataMax
            const d = new Date(max)
            if (b.type === 'year')
                d.setUTCFullYear(d.getUTCFullYear() - count)
            else if (b.type === 'month')
                d.setUTCMonth(d.getUTCMonth() - count)
            else
                d.setUTCDate(d.getUTCDate() - count)
            this.selected = i
            xAxis.setExtremes(d.getTime(), max)
        }
        this.highlight()
        this.reposition()
    }

    highlight() {
        if (!this.buttons)
            return
        this.buttons.forEach(({btn, def, disabled}, i) => {
            const active = (def.type === 'all' && this.selected === 'all') || this.selected === i
            //charts-lib's own state classes (styled in chart.scss)
            btn.classList.toggle('selected', active)
            btn.classList.toggle('disabled', disabled)
        })
    }

    //called after each (re)render to sit above the plot area
    reposition() {
        this.applyResponsiveSizing()
        if (this.el)
            this.el.style.left = (this.chart.plotLeft) + 'px'
    }

    destroy() {
        if (this.el && this.el.parentNode)
            this.el.parentNode.removeChild(this.el)
        this.el = null
    }
}
