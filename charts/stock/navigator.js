import {isNumber, clamp} from '../core/utilities'
import {animateLineDraw} from '../core/animate'
import {getDateTimeTickPositions, dateTimeLabelFormat, dateFormat} from '../core/time'

//Navigator look: a thin red overview line, the SELECTED window masked with a light fill,
//a light outline, and small grip handles centred vertically on each edge.
const NAV_LINE = '#df0000'
const MASK_FILL = 'rgba(102,133,194,0.3)'
const OUTLINE = 'rgba(204,204,204,0.6)'
const HANDLE_FILL = '#f2f2f2'
const HANDLE_STROKE = '#999'
const HANDLE_W = 8
const HANDLE_H = 15

//logical (pre display-padding) axis extremes — what the user actually selected
const viewMin = xAxis => isNumber(xAxis.logicalMin) ? xAxis.logicalMin : xAxis.min
const viewMax = xAxis => isNumber(xAxis.logicalMax) ? xAxis.logicalMax : xAxis.max

//Bottom navigator strip: a mini overview of the full series with a draggable selection window
//that drives the main x-axis extremes.
export class Navigator {
    constructor(chart) {
        this.chart = chart
    }

    render(group, top, height) {
        const chart = this.chart
        const renderer = chart.renderer
        const xAxis = chart.xAxis[0]
        const series = chart.series.find(s => s.points.length)
        if (!series)
            return
        const left = chart.plotLeft
        const width = chart.plotWidth
        this.top = top
        this.height = height
        this.left = left
        this.width = width

        const navSeries = chart.options.navigator && chart.options.navigator.series
        const pts = (navSeries && navSeries.data) ? toPoints(navSeries.data) : series.points
        const dMin = pts[0].x
        const dMax = pts[pts.length - 1].x
        this.dataMin = dMin
        this.dataMax = dMax
        const xToPx = v => left + ((v - dMin) / ((dMax - dMin) || 1)) * width

        let yMin = Infinity
        let yMax = -Infinity
        for (const p of pts) {
            const v = isNumber(p.close) ? p.close : p.y
            if (isNumber(v)) {
                if (v < yMin) yMin = v
                if (v > yMax) yMax = v
            }
        }
        const yToPx = v => top + height - ((v - yMin) / ((yMax - yMin) || 1)) * (height - 4) - 2

        //faint background
        renderer.rect(left, top, width, height, {}).css({fill: 'var(--color-border-shadow)', 'fill-opacity': 0.15}).add(group)
        //time breakpoints across the full overview range, so it's clear where the selected window sits
        this.renderTimeAxis(group, top, height, dMin, dMax, xToPx)
        //overview as a thin line (no fill)
        let d = ''
        let started = false
        for (const p of pts) {
            const v = isNumber(p.close) ? p.close : p.y
            if (isNumber(v)) {
                d += `${started ? 'L' : 'M'} ${xToPx(p.x).toFixed(1)} ${yToPx(v).toFixed(1)} `
                started = true
            }
        }
        const lineEl = renderer.path(d.trim(), {'stroke-width': 1, fill: 'none'}).css({stroke: NAV_LINE}).add(group)

        //selection window edges (clamped into the strip) — use the LOGICAL extremes (pre display-padding)
        const x0 = clamp(xToPx(viewMin(xAxis)), left, left + width)
        const x1 = clamp(xToPx(viewMax(xAxis)), left, left + width)
        //mask the SELECTED region with a light fill, leave the outside clear
        renderer.rect(x0, top, Math.max(0, x1 - x0), height, {}).css({fill: MASK_FILL, 'pointer-events': 'none'}).add(group)
        //outline around the whole strip and the selected window
        renderer.rect(left, top, width, height, {}).css({fill: 'none', stroke: OUTLINE, 'stroke-width': 1, 'pointer-events': 'none'}).add(group)
        renderer.rect(x0, top, Math.max(0, x1 - x0), height, {}).css({fill: 'none', stroke: OUTLINE, 'stroke-width': 1, 'pointer-events': 'none'}).add(group)

        //draggable selection band (pan) — drawn under the handles so edge drags still resize
        const band = renderer.rect(x0, top, Math.max(0, x1 - x0), height, {}).css({fill: 'transparent', cursor: 'grab'}).add(group)
        this.bindBand(band)
        //grip handles, centred vertically on each edge
        const hy = top + (height - HANDLE_H) / 2
        const h0 = this.drawHandle(group, x0, hy)
        const h1 = this.drawHandle(group, x1, hy)
        this.bindHandle(h0, 'min')
        this.bindHandle(h1, 'max')

        //entrance: draw the overview line left→right on the first paint
        if (chart.animateThisRender)
            animateLineDraw(lineEl)
    }

    //faint calendar gridlines spanning the full overview, with dimmed labels below the strip — the same
    //datetime tick logic as the main x-axis, so the navigator reads as a miniature timeline
    renderTimeAxis(group, top, height, dMin, dMax, xToPx) {
        const renderer = this.chart.renderer
        const targetCount = Math.max(2, Math.round(this.width / 90))
        const {positions, unitName} = getDateTimeTickPositions(dMin, dMax, targetCount)
        const fmt = dateTimeLabelFormat(unitName)
        const gridColor = 'var(--color-border-shadow)'
        const labelStyle = {
            fontSize: '11px',
            fontFamily: 'Roboto Condensed,sans-serif',
            fill: 'var(--color-dimmed)',
            color: 'var(--color-dimmed)'
        }
        for (const pos of positions) {
            if (pos < dMin - 1e-6 || pos > dMax + 1e-6)
                continue
            const x = xToPx(pos)
            renderer.line(x, top, x, top + height, {'stroke-width': 1}).css({stroke: gridColor, 'pointer-events': 'none'}).add(group)
            renderer.label(dateFormat(fmt, pos), x, top + height + 13, {'text-anchor': 'middle'}).css(labelStyle).add(group)
        }
    }

    //a grip handle: rounded rect with two vertical grip lines
    drawHandle(group, cx, hy) {
        const renderer = this.chart.renderer
        const rect = renderer.rect(cx - HANDLE_W / 2, hy, HANDLE_W, HANDLE_H, {rx: 2})
            .css({fill: HANDLE_FILL, stroke: HANDLE_STROKE, 'stroke-width': 1, cursor: 'ew-resize'}).add(group)
        renderer.line(cx - 1.5, hy + 4, cx - 1.5, hy + HANDLE_H - 4, {'stroke-width': 1})
            .css({stroke: HANDLE_STROKE, 'pointer-events': 'none'}).add(group)
        renderer.line(cx + 1.5, hy + 4, cx + 1.5, hy + HANDLE_H - 4, {'stroke-width': 1})
            .css({stroke: HANDLE_STROKE, 'pointer-events': 'none'}).add(group)
        return rect
    }

    bindBand(band) {
        const chart = this.chart
        const xAxis = chart.xAxis[0]
        band.on('mousedown', e => {
            e.preventDefault()
            const svg = chart.renderer.root.element
            const rect = svg.getBoundingClientRect()
            const scaleX = chart.chartWidth / rect.width
            const startPx = (e.clientX - rect.left) * scaleX
            const startMin = viewMin(xAxis)
            const startMax = viewMax(xAxis)
            const span = startMax - startMin
            const dataSpan = this.dataMax - this.dataMin
            const move = ev => {
                const px = (ev.clientX - rect.left) * scaleX
                const delta = ((px - startPx) / this.width) * dataSpan
                let min = startMin + delta
                let max = startMax + delta
                if (min < this.dataMin) {
                    min = this.dataMin
                    max = min + span
                }
                if (max > this.dataMax) {
                    max = this.dataMax
                    min = max - span
                }
                xAxis.setExtremes(min, max)
            }
            const up = () => {
                document.removeEventListener('mousemove', move)
                document.removeEventListener('mouseup', up)
            }
            document.addEventListener('mousemove', move)
            document.addEventListener('mouseup', up)
        })
    }

    bindHandle(handle, which) {
        const chart = this.chart
        const xAxis = chart.xAxis[0]
        handle.on('mousedown', e => {
            e.preventDefault()
            const svg = chart.renderer.root.element
            const rect = svg.getBoundingClientRect()
            const scaleX = chart.chartWidth / rect.width
            const move = ev => {
                const px = (ev.clientX - rect.left) * scaleX
                const v = this.dataMin + ((px - this.left) / this.width) * (this.dataMax - this.dataMin)
                let min = viewMin(xAxis)
                let max = viewMax(xAxis)
                const minSpan = (this.dataMax - this.dataMin) / 500
                if (which === 'min')
                    min = Math.max(this.dataMin, Math.min(v, max - minSpan))
                else
                    max = Math.min(this.dataMax, Math.max(v, min + minSpan))
                xAxis.setExtremes(min, max)
            }
            const up = () => {
                document.removeEventListener('mousemove', move)
                document.removeEventListener('mouseup', up)
            }
            document.addEventListener('mousemove', move)
            document.addEventListener('mouseup', up)
        })
    }
}

function toPoints(data) {
    return data.map(p => Array.isArray(p)
        ? {x: p[0], y: p[p.length >= 5 ? 4 : 1], close: p.length >= 5 ? p[4] : undefined}
        : p)
}
