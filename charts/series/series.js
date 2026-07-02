import {pick, isNumber} from '../core/utilities'

//Catmull-Rom -> cubic bezier smoothing for spline series
function smoothSegmentPath(pts) {
    let d = `M ${pts[0].plotX} ${pts[0].plotY} `
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i]
        const p1 = pts[i]
        const p2 = pts[i + 1]
        const p3 = pts[i + 2] || pts[i + 1]
        const c1x = p1.plotX + (p2.plotX - p0.plotX) / 6
        const c1y = p1.plotY + (p2.plotY - p0.plotY) / 6
        const c2x = p2.plotX - (p3.plotX - p1.plotX) / 6
        const c2y = p2.plotY - (p3.plotY - p1.plotY) / 6
        d += `C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.plotX} ${p2.plotY} `
    }
    return d
}

export class Series {
    constructor(chart, options) {
        this.chart = chart
        this.options = options
        this.type = options.type || 'line'
        this.name = options.name
        this.visible = options.visible !== false
        this.index = 0 //creation order, assigned by chart
        //area/column rest on a zero baseline by default (the series `threshold`), pulling the axis to 0
        this.threshold = options.threshold !== undefined ? options.threshold
            : (/^(area|areaspline|column|bar)$/.test(this.type) ? 0 : null)
        this.setData(options.data || [])
    }

    setData(data) {
        this.xData = []
        this.yData = []
        this.points = []
        for (const p of data) {
            let x, y, point
            if (Array.isArray(p)) {
                if (p.length >= 5) {
                    //OHLC tuple [x, open, high, low, close]
                    x = p[0]
                    y = p[4]
                    point = {x, y, open: p[1], high: p[2], low: p[3], close: p[4]}
                } else {
                    x = p[0]
                    y = p[1]
                    point = {x, y}
                }
            } else if (p && typeof p === 'object') {
                x = pick(p.x, this.points.length)
                y = p.y
                point = {...p, x, y}
            } else {
                x = this.points.length
                y = p
                point = {x, y}
            }
            this.xData.push(x)
            this.yData.push(y)
            point.series = this
            this.points.push(point)
        }
        //points actually drawn — replaced by the grouped set when data grouping is active
        this.plotPoints = this.points
        //live data update (e.g. lazy-loaded finer candles on zoom) — repaint. Skipped during the initial
        //series construction, when the chart hasn't rendered yet.
        if (this.chart && this.chart.hasRendered)
            this.chart.redraw()
    }

    bindAxes() {
        this.xAxis = this.chart.xAxis[0]
        const yIdx = isNumber(this.options.yAxis) ? this.options.yAxis : 0
        this.yAxis = this.chart.yAxis[yIdx] || this.chart.yAxis[0]
        this.xAxis.series.push(this)
        this.yAxis.series.push(this)
    }

    get colorIndex() {
        return pick(this.options.colorIndex, this.index)
    }

    get zIndex() {
        return pick(this.options.index, this.index)
    }

    //resolve a plot option through the option cascade: per-series → plotOptions[type] → plotOptions.series
    //(e.g. `step`/`connectNulls` are commonly set once on plotOptions.series and inherited by every series)
    resolveOption(name, fallback) {
        const po = this.chart.options.plotOptions || {}
        return pick(this.options[name], (po[this.type] || {})[name], (po.series || {})[name], fallback)
    }

    getColor() {
        if (this.options.color)
            return this.options.color
        const colors = this.chart.options.colors || []
        return colors[this.colorIndex % colors.length] || '#08B5E5'
    }

    translate() {
        for (const pt of this.plotPoints) {
            pt.plotX = this.xAxis.toPixels(pt.x)
            pt.plotY = isNumber(pt.y) ? this.yAxis.toPixels(isNumber(pt.stackY) ? pt.stackY : pt.y) : null
            pt.plotBottom = isNumber(pt.stackLow) ? this.yAxis.toPixels(pt.stackLow) : null
        }
    }

    //build an SVG path "d" from plotted points (M/L), breaking on nulls unless connectNulls
    linePath(closePathToBaseline) {
        const connectNulls = this.resolveOption('connectNulls', false)
        const step = this.resolveOption('step')
        const segments = []
        let current = []
        for (const pt of this.plotPoints) {
            if (pt.plotY === null) {
                if (!connectNulls) {
                    if (current.length) segments.push(current)
                    current = []
                    continue
                }
                continue
            }
            current.push(pt)
        }
        if (current.length) segments.push(current)
        this.segments = segments

        const smooth = this.type === 'spline' || this.type === 'areaspline'
        let d = ''
        for (const seg of segments) {
            if (smooth && seg.length > 2) {
                d += smoothSegmentPath(seg)
            } else {
                seg.forEach((pt, i) => {
                    if (i === 0) {
                        d += `M ${pt.plotX} ${pt.plotY} `
                    } else if (step === 'left') {
                        d += `L ${pt.plotX} ${seg[i - 1].plotY} L ${pt.plotX} ${pt.plotY} `
                    } else if (step === 'right') {
                        d += `L ${seg[i - 1].plotX} ${pt.plotY} L ${pt.plotX} ${pt.plotY} `
                    } else {
                        d += `L ${pt.plotX} ${pt.plotY} `
                    }
                })
            }
        }
        return d.trim()
    }

    render() {
        //overridden by subclasses
    }

    destroy() {
        if (this.group)
            this.group.destroy()
    }
}
