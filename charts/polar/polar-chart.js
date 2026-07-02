//Polar/radar rendering path (asset rating chart): categories around a circle, radial value axis,
//polygon gridlines (gridLineInterpolation: 'polygon').
import {pick, relativeLength} from '../core/utilities'
import {animateFromCenter} from '../core/animate'

const TEXT_STYLE = {
    fontSize: '12px',
    fontFamily: 'Roboto Condensed,sans-serif',
    fill: 'var(--color-text)',
    color: 'var(--color-text)'
}
const GRID_COLOR = 'var(--color-border-shadow)'

/**
 * Render a chart in polar coordinates.
 * @param {import('../core/chart').Chart} chart
 */
export function renderPolar(chart) {
    const renderer = chart.renderer
    const w = chart.chartWidth
    const h = chart.chartHeight
    const pane = chart.options.pane || {}
    const radius = relativeLength(pane.size || '85%', Math.min(w, h)) / 2
    const cx = w / 2
    const cy = h / 2
    const xAxis = chart.xAxis[0]
    const yAxis = chart.yAxis[0]
    const cats = xAxis.categories || []
    const series0 = chart.series[0]
    const n = cats.length || (series0 ? series0.points.length : 0)
    if (!n)
        return

    const yMin = pick(yAxis.options.min, 0)
    let yMax = pick(yAxis.options.max, undefined)
    if (yMax === undefined) {
        yMax = 1
        for (const s of chart.series)
            for (const p of s.points)
                if (p.y > yMax) yMax = p.y
    }

    const angleFor = i => -Math.PI / 2 + (i / n) * Math.PI * 2
    const pointAt = (i, value) => {
        const r = ((value - yMin) / ((yMax - yMin) || 1)) * radius
        const a = angleFor(i)
        return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
    }

    const gridGroup = renderer.group('ix-polar-grid').add(renderer.root)
    const axisGroup = renderer.group('ix-polar-axis').add(renderer.root)
    const seriesGroup = renderer.group('ix-polar-series').add(renderer.root)

    //polygon rings (gridlines only — no per-ring value labels)
    const rings = 5
    for (let k = 1; k <= rings; k++) {
        const v = yMin + (yMax - yMin) * k / rings
        let d = ''
        for (let i = 0; i < n; i++) {
            const [x, y] = pointAt(i, v)
            d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' '
        }
        renderer.path(d + 'Z', {'stroke-width': 1, fill: 'none'}).css({stroke: GRID_COLOR}).add(gridGroup)
    }
    //single "0" label at the centre (only the origin value is shown)
    renderer.label('0', cx + 4, cy + 4, {'text-anchor': 'start'}).css(TEXT_STYLE).add(axisGroup)

    //spokes + category labels
    for (let i = 0; i < n; i++) {
        const [ex, ey] = pointAt(i, yMax)
        renderer.line(cx, cy, ex, ey, {'stroke-width': 1}).css({stroke: GRID_COLOR}).add(gridGroup)
        const [lx, ly] = pointAt(i, yMax * 1.13)
        const anchor = Math.abs(lx - cx) < 6 ? 'middle' : (lx > cx ? 'start' : 'end')
        renderer.label(cats[i] || '', lx, ly + 4, {'text-anchor': anchor}).css(TEXT_STYLE).add(axisGroup)
    }

    //series — closed radar polygons
    for (const s of chart.series) {
        const color = s.getColor()
        const filled = /area/.test(s.type)
        let d = ''
        const verts = []
        s.points.forEach((p, i) => {
            const [x, y] = pointAt(i, p.y)
            verts.push([x, y])
            d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' '
        })
        renderer.path(d + 'Z', {'stroke-width': 2, fill: filled ? color : 'none'})
            .css({stroke: color, 'fill-opacity': filled ? 0.25 : 0})
            .add(seriesGroup)
        //vertex markers
        for (const [x, y] of verts)
            renderer.circle(x, y, 3, {}).css({fill: color}).add(seriesGroup)
    }

    //entrance: the data polygons grow out from the centre to their actual positions
    if (chart.animateThisRender)
        animateFromCenter(seriesGroup, cx, cy)
}
