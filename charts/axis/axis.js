import {isNumber, pick, relativeLength, defined} from '../core/utilities'
import {getDateTimeTickPositions, dateTimeLabelFormat, dateFormat} from '../core/time'
import {getLinearTickPositions, niceAlignedTicks, zeroBasedGridTicks, formatAxisNumber, axisNumberUnit} from './tick-positioner'

const LABEL_FONT = 12
const LABEL_FONT_CSS = LABEL_FONT + 'px "Roboto Condensed",sans-serif'

//accurate text width via a cached canvas context (the condensed font is much narrower than a
//char-count estimate, so estimating would rotate axis labels that actually fit horizontally)
let measureCtx = null
function measureTextWidth(text) {
    if (typeof document === 'undefined')
        return text.length * LABEL_FONT * 0.5
    if (!measureCtx)
        measureCtx = document.createElement('canvas').getContext('2d')
    measureCtx.font = LABEL_FONT_CSS
    return measureCtx.measureText(text).width
}

export class Axis {
    constructor(chart, userOptions, coll, index) {
        this.chart = chart
        this.options = userOptions || {}
        this.coll = coll
        this.index = index
        this.isXAxis = coll === 'xAxis'
        this.horiz = this.isXAxis
        //stock charts default the y-axis to the right (opposite); honour an explicit option otherwise
        this.opposite = this.options.opposite !== undefined
            ? !!this.options.opposite
            : (coll === 'yAxis' && chart.chartType === 'StockChart')
        this.reversed = !!this.options.reversed
        //stock price-style axes (a StockChart y-axis with no title) float their value labels INSIDE
        //the plot, so changing the visible range — and thus the label text width — never reflows the plot
        //horizontally. Titled dashboard axes keep their labels outside.
        this.labelsInside = coll === 'yAxis' && chart.chartType === 'StockChart' &&
            !(this.options.title && this.options.title.text)
        this.type = this.options.type || 'linear'
        this.isLog = this.type === 'logarithmic'
        this.categories = this.options.categories || null
        this.series = []
        this.userMin = this.options.min
        this.userMax = this.options.max
    }

    setExtremes(min, max) {
        this.userMin = (min === null || min === undefined) ? undefined : min
        this.userMax = (max === null || max === undefined) ? undefined : max
        this.chart.redraw()
        this.fireSetExtremes('setExtremes')
    }

    //notify an afterSetExtremes handler (if any) of the current visible window. Called after redraw so
    //this.min/this.max reflect the new extremes; views hook this to lazy-load data for the window.
    //Debounced: navigator drags fire setExtremes on every mousemove, which would hammer a data-loading
    //handler (→ HTTP 429). Rapid changes coalesce into one trailing call; the initial 'load' fires at once.
    fireSetExtremes(trigger) {
        const handler = this.options.events && this.options.events.afterSetExtremes
        if (typeof handler !== 'function')
            return
        if (this.extremesTimer) {
            clearTimeout(this.extremesTimer)
            this.extremesTimer = null
        }
        const fire = () => {
            this.extremesTimer = null
            if (!this.chart || !this.chart.container)
                return //chart destroyed before the debounce elapsed
            handler.call(this, {min: this.min, max: this.max, target: this, trigger})
        }
        if (trigger === 'load') {
            fire()
        } else {
            this.extremesTimer = setTimeout(fire, 300)
        }
    }

    getSeriesExtremes() {
        let dataMin = Infinity
        let dataMax = -Infinity
        //y-axes fit the currently visible x-window (StockChart auto-scaling)
        const xa = this.chart.xAxis[0]
        const winMin = (!this.isXAxis && xa) ? xa.min : undefined
        const winMax = (!this.isXAxis && xa) ? xa.max : undefined
        for (const s of this.series) {
            if (!s.visible)
                continue
            if (this.isXAxis) {
                for (const v of s.xData) {
                    if (isNumber(v)) {
                        if (v < dataMin) dataMin = v
                        if (v > dataMax) dataMax = v
                    }
                }
            } else {
                //y-extremes come from the drawn (grouped/stacked/OHLC) points within the visible window
                for (const p of s.plotPoints) {
                    if (isNumber(winMin) && (p.x < winMin || p.x > winMax))
                        continue
                    const hi = isNumber(p.stackY) ? p.stackY : (isNumber(p.high) ? p.high : p.y)
                    const lo = isNumber(p.stackLow) ? p.stackLow : (isNumber(p.low) ? p.low : hi)
                    if (isNumber(hi)) {
                        if (hi < dataMin) dataMin = hi
                        if (hi > dataMax) dataMax = hi
                    }
                    if (isNumber(lo)) {
                        if (lo < dataMin) dataMin = lo
                        if (lo > dataMax) dataMax = lo
                    }
                }
            }
        }
        //include series thresholds (area/column baseline) so the fill sits on the zero line
        if (!this.isXAxis) {
            for (const s of this.series) {
                if (s.visible && isNumber(s.threshold)) {
                    if (s.threshold < dataMin) dataMin = s.threshold
                    if (s.threshold > dataMax) dataMax = s.threshold
                }
            }
        }
        if (dataMin === Infinity) {
            //no visible series on this axis (e.g. its only series was toggled off): keep the previous
            //extremes so the labels/margins don't jump and the axis doesn't show a meaningless 0..1 scale
            if (isNumber(this.dataMin) && isNumber(this.dataMax) && this.dataMax > this.dataMin)
                return
            dataMin = 0
            dataMax = 1
        }
        this.dataMin = dataMin
        this.dataMax = dataMax
    }

    //pixels at the top of the pane that must stay clear of drawn data — the floating range-selector
    //buttons overlay the top ~26px of the plot, so the pane that starts at the plot top scales its
    //max up until the tallest point (incl. candle wicks) renders below the controls
    reservedTopPixels() {
        const c = this.chart
        if (this.isXAxis || c.chartType !== 'StockChart' || !c.options.rangeSelector)
            return 0
        if (!isNumber(this.len) || !isNumber(this.top) || !isNumber(c.plotTop))
            return 0
        //only the top pane sits under the controls; lower panes (e.g. a volume strip) are unaffected
        if (this.top > c.plotTop + 1)
            return 0
        return 26
    }

    setScale() {
        this.getSeriesExtremes()
        let min = pick(this.userMin, this.dataMin)
        let max = pick(this.userMax, this.dataMax)
        //initial visible window for StockChart (xAxis.range) — active until the user sets extremes
        if (this.isXAxis && isNumber(this.options.range) &&
            this.userMin === undefined && this.userMax === undefined) {
            max = this.dataMax
            min = max - this.options.range
        }
        if (isNumber(this.options.floor))
            min = Math.max(min, this.options.floor)
        if (isNumber(this.options.ceiling))
            max = Math.min(max, this.options.ceiling)

        //tick density: x adapts to width (denser, ~one per 42px → more labels when there's room),
        //y ~one gridline per 72px
        const targetCount = this.horiz ? Math.max(2, Math.round(this.lenForTicks() / 42))
            : Math.max(3, Math.round(this.lenForTicks() / 72))

        if (this.isLog) {
            //work in log-transformed space; ticks at integer exponents
            const lMin = this.transform(Math.max(min, 0))
            const lMax = this.transform(Math.max(max, 0))
            const start = Math.floor(lMin)
            const end = Math.max(start + 1, Math.ceil(lMax))
            this.min = start
            this.max = end
            this.tickPositions = []
            for (let i = start; i <= end; i++)
                this.tickPositions.push(i)
        } else if (this.type === 'datetime') {
            if (min === max) {
                min -= 0.5
                max += 0.5
            }
            this.min = min
            this.max = max
            const {positions, unitName} = getDateTimeTickPositions(min, max, targetCount)
            this.dateUnit = unitName
            //thin labels so wide date strings (e.g. "27 May") don't overlap, instead of rotating them
            let pos = positions
            if (isNumber(this.len) && pos.length > 2) {
                const sampleW = (String(this.labelText(pos[0])).length + 1) * LABEL_FONT * 0.55
                const maxFit = Math.max(2, Math.floor(this.len / (sampleW + 6)))
                if (pos.length > maxFit) {
                    const step = Math.ceil(pos.length / maxFit)
                    pos = pos.filter((unused, i) => i % step === 0)
                }
            }
            this.tickPositions = pos
        } else if (this.categories) {
            //half-padding on each side so columns sit between gridlines
            this.min = -0.5
            this.max = this.categories.length - 0.5
            this.tickPositions = this.categories.map((unused, i) => i)
        } else if (this.isXAxis) {
            if (min === max) {
                min -= 0.5
                max += 0.5
            }
            const startOnTick = pick(this.options.startOnTick, false)
            const endOnTick = pick(this.options.endOnTick, false)
            const {positions, min: tMin, max: tMax} = getLinearTickPositions(min, max, targetCount, startOnTick, endOnTick)
            this.min = startOnTick ? tMin : min
            this.max = endOnTick ? tMax : max
            this.tickPositions = positions
        } else {
            if (min === max) {
                min -= 0.5
                max += 0.5
            }
            const smallPane = isNumber(this.len) && this.len < 90
            const padded = this.options.minPadding || this.options.maxPadding
            //dashboard axes start at 0 → fixed 5-section grid (0/20/…/100%) with the data filling ≤90% of the
            //height, so the top value never reaches the zoom controls. Skipped for padded/inline sparkline
            //axes (their line should fill the height, not sit at 80%) and tiny panes (e.g. a volume strip).
            if (!padded && !smallPane && min <= 1e-9 && max > 0) {
                const r = zeroBasedGridTicks(max)
                this.tickInterval = r.interval
                this.tickPositions = r.positions
                this.labelledPositions = r.labelled
                this.min = r.min
                this.max = r.max
                this.zeroBased = true
            } else {
                //non-zero / padded / small axis (e.g. a zoomed price pane): nice round ticks over the visible
                //range, hiding a pure-headroom top tick and reserving ~0.7 of a step above so it isn't flush
                const count = Math.max(3, Math.round(this.lenForTicks() / 72)) + 1
                const r = niceAlignedTicks(min, max, count)
                let drawn = r.positions
                if (drawn[drawn.length - 1] > max * (1 + 1e-9))
                    drawn = drawn.slice(0, -1)
                const nIntervals = drawn.length - 1
                const dataSteps = r.interval > 0 ? (max - r.min) / r.interval : nIntervals
                let M = Math.max(nIntervals + 0.7, dataSteps + 0.15)
                //widen the headroom so the data top maps below the reserved zoom-controls band:
                //(M - dataSteps)/M of the pane height must be at least reserve/len
                const reserve = this.reservedTopPixels()
                if (reserve && this.len > reserve * 2)
                    M = Math.max(M, dataSteps / (1 - reserve / this.len))
                this.tickInterval = r.interval
                this.tickPositions = drawn
                this.labelledPositions = null
                this.min = r.min
                this.max = r.min + M * r.interval
                this.zeroBased = false
            }
        }
        //optional fractional padding on either axis — insets the data from the plot edges. Used by inline
        //sparklines so the line stroke doesn't clip vertically and isn't flush against the surrounding
        //text/edges horizontally. Default 0, so regular charts are unaffected.
        const minPad = pick(this.options.minPadding, 0)
        const maxPad = pick(this.options.maxPadding, 0)
        if (minPad || maxPad) {
            const span = (this.max - this.min) || 1
            this.min -= span * minPad
            this.max += span * maxPad
        }
        //explicit tick positions (e.g. [] to suppress axis decorations on sparklines)
        if (Array.isArray(this.options.tickPositions))
            this.tickPositions = this.options.tickPositions
    }

    /**
     * Map a data value into the axis' internal (possibly log-transformed) space.
     * @param {number} value
     * @return {number}
     */
    transform(value) {
        if (!this.isLog)
            return value
        if (typeof this.log2lin === 'function')
            return this.log2lin(value)
        return Math.log(Math.max(value, 1e-9)) / Math.LN10
    }

    /**
     * Inverse of {@link transform} — internal space back to a data value.
     * @param {number} linVal
     * @return {number}
     */
    invTransform(linVal) {
        if (!this.isLog)
            return linVal
        if (typeof this.lin2log === 'function')
            return this.lin2log(linVal)
        return Math.pow(10, linVal)
    }

    //axis length for tick-count targeting — prefer the actual pane length once it's been sized
    lenForTicks() {
        if (isNumber(this.len))
            return this.len
        const c = this.chart
        return this.horiz ? (c.plotWidth || c.chartWidth) : (c.plotHeight || c.chartHeight)
    }

    setAxisSize() {
        const {plotLeft, plotTop, plotWidth, plotHeight} = this.chart
        if (this.horiz) {
            this.left = plotLeft
            this.len = plotWidth
            this.axisPos = plotTop + plotHeight //bottom line
        } else {
            const total = plotHeight
            const h = defined(this.options.height) ? relativeLength(this.options.height, total) : total
            const t = defined(this.options.top) ? relativeLength(this.options.top, total) : 0
            this.top = plotTop + t
            this.len = h
            this.offset = this.options.offset || 0
            this.axisPos = this.opposite ? (plotLeft + plotWidth + this.offset) : (plotLeft - this.offset)
        }
    }

    //map a value already in internal (transformed) space to a pixel coordinate
    linToPixels(linVal) {
        const span = (this.max - this.min) || 1
        const frac = (linVal - this.min) / span
        if (this.horiz)
            return this.left + (this.reversed ? 1 - frac : frac) * this.len
        return this.top + (this.reversed ? frac : 1 - frac) * this.len
    }

    //map a data value to a pixel coordinate (applies log transform when needed)
    toPixels(value) {
        return this.linToPixels(this.transform(value))
    }

    labelText(value) {
        if (this.categories)
            return this.categories[value] !== undefined ? this.categories[value] : ''
        if (this.type === 'datetime')
            return dateFormat(dateTimeLabelFormat(this.dateUnit), value)
        if (this.isLog)
            return formatAxisNumber(this.invTransform(value), this.labelUnit)
        return formatAxisNumber(value, this.labelUnit)
    }

    //single unit (k/M) shared by all numeric labels on this axis, from the largest tick value.
    //log axes span many magnitudes, so each tick is formatted with its OWN unit (10 / 1k / 1M) instead
    //of a shared one (which would render small ticks as "0.00001M")
    computeLabelUnit() {
        if (this.categories || this.type === 'datetime' || this.isLog || !this.tickPositions)
            return undefined
        let maxAbs = 0
        for (const p of this.tickPositions) {
            const dv = (this.isLog && this.invTransform) ? this.invTransform(p) : p
            maxAbs = Math.max(maxAbs, Math.abs(dv))
        }
        return axisNumberUnit(maxAbs)
    }

    estimateLabelWidth() {
        let maxLen = 0
        for (const pos of this.tickPositions || []) {
            const t = String(this.labelText(pos))
            if (t.length > maxLen) maxLen = t.length
        }
        return Math.ceil(maxLen * LABEL_FONT * 0.55) + 6
    }

    //horizontal labels overlap when their combined width exceeds the axis → rotate them
    //(datetime labels are thinned instead of rotated, so they never rotate here)
    needsRotation() {
        if (!this.horiz || this.type === 'datetime' || !this.tickPositions || !isNumber(this.len))
            return false
        let maxW = 0
        for (const pos of this.tickPositions) {
            const w = measureTextWidth(String(this.labelText(pos)))
            if (w > maxW) maxW = w
        }
        //rotate only when the widest label can't fit its category slot (kept horizontal whenever
        //there's room) — 6px of breathing space between neighbours
        const slot = this.len / this.tickPositions.length
        return maxW + 6 > slot
    }

    render(gridGroup, axisGroup) {
        const {chart} = this
        const renderer = chart.renderer
        this.labelUnit = this.computeLabelUnit()
        const {plotLeft, plotTop, plotWidth, plotHeight} = chart
        const gridColor = 'var(--color-border-shadow)'
        const textStyle = {
            fontSize: LABEL_FONT + 'px',
            fontFamily: 'Roboto Condensed,sans-serif',
            color: 'var(--color-text)',
            fill: 'var(--color-text)'
        }

        if (this.horiz) {
            const y = plotTop + plotHeight
            const rotate = this.needsRotation()
            for (const pos of this.tickPositions) {
                if (pos < this.min - 1e-6 || pos > this.max + 1e-6)
                    continue
                const x = this.linToPixels(pos)
                //gridline
                if (this.options.gridLineWidth !== 0 && pick(this.options.gridLineWidth, 1)) {
                    renderer.line(x, plotTop, x, y, {'stroke-width': 1}).css({stroke: gridColor}).add(gridGroup)
                }
                //tick mark
                renderer.line(x, y, x, y + 5, {'stroke-width': 1}).css({stroke: gridColor}).add(axisGroup)
                //label (rotated -45° when labels would otherwise overlap)
                if (rotate) {
                    renderer.label(this.labelText(pos), x, y + 14, {'text-anchor': 'end', transform: `rotate(-45 ${x} ${y + 14})`})
                        .css(textStyle).add(axisGroup)
                } else {
                    renderer.label(this.labelText(pos), x, y + 18, {'text-anchor': 'middle'}).css(textStyle).add(axisGroup)
                }
            }
            //axis line (respect lineWidth: 0 — e.g. sparklines draw no baseline)
            if (pick(this.options.lineWidth, 1))
                renderer.line(plotLeft, y, plotLeft + plotWidth, y, {'stroke-width': 1}).css({stroke: gridColor}).add(axisGroup)
        } else {
            const axisX = this.axisPos
            const offset = this.offset || 0
            const inside = this.labelsInside
            //inside labels: right-align just within the right edge (or left-align within the left edge),
            //floating over the plot. Outside labels: hug the plot edge from the outside.
            const labelAnchor = inside
                ? (this.opposite ? 'end' : 'start')
                : (this.opposite ? 'start' : 'end')
            //numbers sit close to the plot edge regardless of the axis offset (offset pushes the title out,
            //so multiple offset panes keep their value labels near the chart)
            const labelX = inside
                ? (this.opposite ? plotLeft + plotWidth - 4 : plotLeft + 4)
                : (this.opposite ? plotLeft + plotWidth + 8 : plotLeft - 8)
            //inside labels sit just above their gridline; outside labels are vertically centred
            const labelDy = inside ? -3 : 4
            //short panes (e.g. a 14%-height volume strip) only show the 0 label and skip minor gridlines
            const smallPane = isNumber(this.len) && this.len < 90
            //draw minor gridlines only for the first y-axis sharing this pane, so aligned dual axes
            //(left+right on the same pane) don't double them up — regardless of which side it's on
            const paneKey = Math.round(this.top) + '|' + Math.round(this.len)
            const firstInPane = this.chart.yAxis.find(a =>
                Math.round(a.top) + '|' + Math.round(a.len) === paneKey) === this
            //minor gridlines: 4 faint lines between each major (gap = 20% of the step)
            if (!smallPane && firstInPane && !this.isLog && !this.categories &&
                pick(this.options.gridLineWidth, 1) && this.tickPositions.length >= 2) {
                const step = this.tickPositions[1] - this.tickPositions[0]
                if (step > 0) {
                    const minorStep = step / 5
                    for (let v = this.tickPositions[0] + minorStep; v <= this.max + 1e-6; v += minorStep) {
                        const rel = (v - this.tickPositions[0]) / step
                        if (Math.abs(rel - Math.round(rel)) < 1e-6)
                            continue //skip positions that coincide with a major tick
                        const my = this.linToPixels(v)
                        renderer.line(plotLeft, my, plotLeft + plotWidth, my, {'stroke-width': 1})
                            .css({stroke: gridColor, 'stroke-opacity': 0.35}).add(gridGroup)
                    }
                }
            }
            for (const pos of this.tickPositions) {
                if (pos < this.min - 1e-6 || pos > this.max + 1e-6)
                    continue
                const py = this.linToPixels(pos)
                if (pick(this.options.gridLineWidth, 1)) {
                    renderer.line(plotLeft, py, plotLeft + plotWidth, py, {'stroke-width': 1}).css({stroke: gridColor}).add(gridGroup)
                }
                //labelledPositions (zero-based grid) hides the top 100% line's value; a short pane labels only 0
                const labelled = !this.labelledPositions ||
                    this.labelledPositions.some(p => Math.abs(p - pos) < 1e-9)
                if (labelled && (!smallPane || Math.abs(pos) < 1e-9))
                    renderer.label(this.labelText(pos), labelX, py + labelDy, {'text-anchor': labelAnchor}).css(textStyle).add(axisGroup)
            }
            //title
            const titleText = this.options.title && this.options.title.text
            if (titleText) {
                //with an offset, align titles across panes at the offset distance; otherwise clear the labels
                const cx = offset > 0
                    ? (this.opposite ? axisX + 8 : axisX - 8)
                    : (this.opposite ? axisX + this.estimateLabelWidth() + 14 : axisX - this.estimateLabelWidth() - 14)
                const cy = this.top + this.len / 2
                const rot = this.opposite ? 90 : -90
                renderer.label(titleText, cx, cy, {'text-anchor': 'middle', transform: `rotate(${rot} ${cx} ${cy})`})
                    .css({...textStyle}).add(axisGroup)
            }
        }
    }
}
