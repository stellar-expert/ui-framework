//Pie / variable-pie rendering path (contract users chart).
//variable-pie: slice ANGLE scales with y, slice OUTER RADIUS scales with z.
import {pick, relativeLength, isNumber, addThousandsSep} from '../core/utilities'
import {animate, DEFAULT_DURATION} from '../core/animate'

const TEXT_STYLE = {
    fontSize: '12px',
    fontFamily: 'Roboto Condensed,sans-serif',
    fill: 'var(--color-text)',
    color: 'var(--color-text)'
}
const LEGEND_LINE = 18

function sectorPath(cx, cy, rInner, rOuter, a0, a1) {
    const cos0 = Math.cos(a0)
    const sin0 = Math.sin(a0)
    const cos1 = Math.cos(a1)
    const sin1 = Math.sin(a1)
    const large = (a1 - a0) > Math.PI ? 1 : 0
    const xo0 = cx + rOuter * cos0
    const yo0 = cy + rOuter * sin0
    const xo1 = cx + rOuter * cos1
    const yo1 = cy + rOuter * sin1
    const xi1 = cx + rInner * cos1
    const yi1 = cy + rInner * sin1
    const xi0 = cx + rInner * cos0
    const yi0 = cy + rInner * sin0
    return `M ${xo0} ${yo0} A ${rOuter} ${rOuter} 0 ${large} 1 ${xo1} ${yo1} ` +
        `L ${xi1} ${yi1} A ${rInner} ${rInner} 0 ${large} 0 ${xi0} ${yi0} Z`
}

//just the outer curved edge of a sector (used for the hover band — outside only, not around the slice)
function outerArcPath(cx, cy, rOuter, a0, a1) {
    const large = (a1 - a0) > Math.PI ? 1 : 0
    const xo0 = cx + rOuter * Math.cos(a0)
    const yo0 = cy + rOuter * Math.sin(a0)
    const xo1 = cx + rOuter * Math.cos(a1)
    const yo1 = cy + rOuter * Math.sin(a1)
    return `M ${xo0} ${yo0} A ${rOuter} ${rOuter} 0 ${large} 1 ${xo1} ${yo1}`
}

//reused HTML tooltip for pie slices (light, like the cartesian tooltip)
function ensurePieTooltip(chart) {
    if (chart.pieTooltipEl && chart.pieTooltipEl.parentNode)
        return chart.pieTooltipEl
    const el = document.createElement('div')
    Object.assign(el.style, {
        position: 'absolute', pointerEvents: 'none', zIndex: 20, display: 'none',
        background: 'rgba(247,247,247,0.92)', border: '1px solid var(--color-border-shadow)',
        borderRadius: '3px', padding: '5px 8px', font: '12px Roboto Condensed,sans-serif',
        color: '#15171a', whiteSpace: 'nowrap', boxShadow: '0 1px 6px rgba(0,0,0,0.3)'
    })
    chart.container.appendChild(el)
    chart.pieTooltipEl = el
    return el
}

function showPieTip(tip, chart, e, point, color, pct, isVariable) {
    const seriesName = chart.series[0].name || ''
    let html = `<div style="opacity:.7;margin-bottom:2px">${point.name || ''}</div>`
    html += `<div><span style="color:${color}">●</span> ${seriesName}</div>`
    html += `<div>Value: <b>${addThousandsSep(point.y)}</b> (${pct.toFixed(1)}%)</div>`
    if (isVariable && isNumber(point.z))
        html += `<div>Size: <b>${addThousandsSep(point.z)}</b></div>`
    tip.innerHTML = html
    tip.style.display = 'block'
    const rect = chart.renderer.root.element.getBoundingClientRect()
    const bx = tip.getBoundingClientRect()
    let left = e.clientX - rect.left + 12
    if (left + bx.width > rect.width)
        left = e.clientX - rect.left - bx.width - 12
    const top = Math.max(2, e.clientY - rect.top - bx.height - 6)
    tip.style.left = left + 'px'
    tip.style.top = top + 'px'
}

//estimated vertical space the bottom legend needs (so the pie shrinks to make room)
function pieLegendHeight(points, chartWidth) {
    const availW = chartWidth - 20
    let rows = 1, curW = 0
    for (const p of points) {
        const w = 10 + 6 + Math.ceil(String(p.name || '').length * 12 * 0.5)
        const add = (curW ? 16 : 0) + w
        if (curW && curW + add > availW) {
            rows++
            curW = w
        } else {
            curW += add
        }
    }
    return 12 + rows * LEGEND_LINE
}

//per-point legend (color circle + name) under the pie — wrapped, left-aligned within a centred block
function renderPieLegend(chart, renderer, points, colorFor) {
    const w = chart.chartWidth
    const symbolW = 10, gap = 6, itemGap = 16
    const group = renderer.group('ix-pie-legend').add(renderer.root)
    const built = points.map((p, i) => {
        const itemGroup = renderer.group('ix-legend-item').add(group)
        renderer.circle(symbolW / 2, -4, 4, {}).css({fill: colorFor(i)}).add(itemGroup)
        const label = renderer.label(p.name || '', symbolW + gap, 0, {'text-anchor': 'start'}).css(TEXT_STYLE).add(itemGroup)
        let tw
        try {
            tw = label.getBBox().width
        } catch (e) {
            tw = Math.ceil(String(p.name || '').length * 12 * 0.5)
        }
        return {itemGroup, w: symbolW + gap + tw}
    })
    //wrap into rows that fit the chart width
    const availW = w - 20
    const rows = []
    let cur = [], curW = 0
    for (const b of built) {
        const add = (cur.length ? itemGap : 0) + b.w
        if (cur.length && curW + add > availW) {
            rows.push({items: cur, w: curW})
            cur = []
            curW = 0
        }
        curW += (cur.length ? itemGap : 0) + b.w
        cur.push(b)
    }
    if (cur.length)
        rows.push({items: cur, w: curW})
    //left-align rows to a common left edge, block centred, stacked upward from the bottom
    const maxRowW = rows.reduce((m, r) => Math.max(m, r.w), 0)
    const blockLeft = Math.max(10, (w - maxRowW) / 2)
    const bottomBaseline = chart.chartHeight - 8
    rows.forEach((row, ri) => {
        const baseline = bottomBaseline - (rows.length - 1 - ri) * LEGEND_LINE
        let x = blockLeft
        for (const b of row.items) {
            b.itemGroup.attr('transform', `translate(${x}, ${baseline})`)
            x += b.w + itemGap
        }
    })
}

/**
 * Render a pie/variable-pie chart.
 * @param {import('../core/chart').Chart} chart
 */
export function renderPie(chart) {
    const renderer = chart.renderer
    const series = chart.series[0]
    if (!series || !series.points.length)
        return
    const w = chart.chartWidth
    const h = chart.chartHeight
    const opts = series.options
    const isVariable = series.type === 'variablepie'
    //slice labels off by default → use the bottom legend instead; both are config-toggleable
    const dataLabelsEnabled = !!(opts.dataLabels && opts.dataLabels.enabled)
    //legend off by default for pie/variable-pie — opt in with series.showInLegend: true
    const legendEnabled = opts.showInLegend === true

    const points = series.points.filter(p => isNumber(p.y) && p.y > 0)
    const total = points.reduce((sum, p) => sum + p.y, 0) || 1
    const colors = chart.options.colors || []
    const colorFor = i => colors[i % colors.length] || '#08B5E5'

    const legendH = legendEnabled ? pieLegendHeight(points, w) : 0
    const cx = w / 2
    const cy = (h - legendH) / 2
    const labelPad = dataLabelsEnabled ? 34 : 10 //room for outside labels only when shown
    const maxRadius = Math.min(w, h - legendH) / 2 - labelPad
    const innerSize = relativeLength(pick(opts.innerSize, 0), maxRadius * 2) / 2

    //z-range for variable radius
    let zMin = pick(opts.zMin, Infinity)
    let zMax = pick(opts.zMax, -Infinity)
    if (isVariable) {
        for (const p of points) {
            if (isNumber(p.z)) {
                if (p.z < zMin) zMin = p.z
                if (p.z > zMax) zMax = p.z
            }
        }
        if (!isNumber(zMin)) zMin = 0
        if (!isNumber(zMax) || zMax === zMin) zMax = zMin + 1
    }
    const minPointSize = relativeLength(pick(opts.minPointSize, 10), maxRadius * 2) / 2

    const tip = ensurePieTooltip(chart)
    const group = renderer.group('ix-pie').add(renderer.root)
    const labelGroup = renderer.group('ix-pie-labels').add(renderer.root)

    //overlay (drawn on top) holds the hover highlight: a solid same-colour band only OUTSIDE the
    //segment (a wide stroke whose inner half is covered by a redrawn copy of the slice).
    const SHADOW_W = 10
    const slicePaths = []
    const sliceDefs = []
    const sweepSlices = [] //geometry for the angular entrance sweep
    const overlay = renderer.group('ix-pie-hover').add(renderer.root)
    let hoverEls = []
    const clearHover = () => {
        hoverEls.forEach(el => el.destroy())
        hoverEls = []
    }
    let angle = -Math.PI / 2
    points.forEach((p, i) => {
        const slice = (p.y / total) * Math.PI * 2
        const a0 = angle
        const a1 = angle + slice
        let rOuter = maxRadius
        if (isVariable) {
            const zFrac = (pick(p.z, zMin) - zMin) / (zMax - zMin || 1)
            rOuter = innerSize + minPointSize + (maxRadius - innerSize - minPointSize) * zFrac
        }
        const color = colorFor(i)
        const pct = p.y / total * 100
        const d = sectorPath(cx, cy, innerSize, rOuter, a0, a1)
        const arc = outerArcPath(cx, cy, rOuter, a0, a1)
        sliceDefs.push({d, arc, color})
        const path = renderer.path(d, {'stroke-width': 1.5})
            .css({fill: color, stroke: '#fff', cursor: 'pointer', opacity: 1})
            .add(group)
        slicePaths.push(path)
        sweepSlices.push({el: path, a0, a1, rOuter})
        //hover: dim the others, draw a solid outer band + white outline over this slice
        path.on('mouseover', () => {
            slicePaths.forEach((sp, j) => sp.css({opacity: j === i ? 1 : 0.35}))
            clearHover()
            //wide solid band along the OUTER edge only, centred on the arc → outer half stays visible,
            //inner half is overdrawn by the redrawn slice (so the band hugs only the outside curve)
            const band = renderer.path(arc, {'stroke-width': SHADOW_W * 2, fill: 'none'})
                .css({stroke: color, 'stroke-opacity': 0.5, 'stroke-linecap': 'butt', 'pointer-events': 'none'}).add(overlay)
            //redraw the slice on top so the band shows only outside, plus the white outline
            const top = renderer.path(d, {'stroke-width': 1.5})
                .css({fill: color, stroke: '#fff', 'pointer-events': 'none'}).add(overlay)
            hoverEls.push(band, top)
        })
        path.on('mousemove', e => showPieTip(tip, chart, e, p, color, pct, isVariable))
        path.on('mouseout', () => {
            slicePaths.forEach(sp => sp.css({opacity: 1}))
            clearHover()
            tip.style.display = 'none'
        })
        //optional data label (name) outside the slice
        if (dataLabelsEnabled) {
            const mid = (a0 + a1) / 2
            const lx = cx + (maxRadius + 10) * Math.cos(mid)
            const ly = cy + (maxRadius + 10) * Math.sin(mid)
            const anchor = Math.cos(mid) < -0.2 ? 'end' : (Math.cos(mid) > 0.2 ? 'start' : 'middle')
            renderer.label(p.name || '', lx, ly + 4, {'text-anchor': anchor}).css(TEXT_STYLE).add(labelGroup)
        }
        angle = a1
    })

    if (legendEnabled)
        renderPieLegend(chart, renderer, points, colorFor)

    //entrance: every sector grows its angular width at the same time, each from its own start edge,
    //all reaching full width together to close the circle (no rotation, full radius throughout)
    if (chart.animateThisRender && sweepSlices.length) {
        const fullDraw = s => sectorPath(cx, cy, innerSize, s.rOuter, s.a0, s.a1)
        animate(DEFAULT_DURATION, k => {
            for (const s of sweepSlices) {
                const end = s.a0 + k * (s.a1 - s.a0)
                s.el.attr('d', end > s.a0 ? sectorPath(cx, cy, innerSize, s.rOuter, s.a0, end) : '')
            }
        }, () => {
            for (const s of sweepSlices)
                s.el.attr('d', fullDraw(s))
        })
    }
}
