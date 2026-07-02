//Bottom-centered horizontal legend with click-to-toggle series visibility; wraps to multiple rows when narrow.
const FONT = 12
const LINE_HEIGHT = 16

export class Legend {
    constructor(chart) {
        this.chart = chart
    }

    //estimated height reserved during layout — grows when the row wraps on narrow charts
    getHeight() {
        if (!this.chart.options.legend.enabled)
            return 0
        const items = this.chart.series.filter(s => s.name)
        if (!items.length)
            return 0
        const symbolW = 12, gap = 8, itemGap = 20
        //estimate available width (plotWidth not final on first layout → fall back to chartWidth)
        const availW = (this.chart.plotWidth || (this.chart.chartWidth || 600) - 90)
        const widths = items.map(s => symbolW + gap + Math.ceil(String(s.name).length * FONT * 0.5))
        let rows = 1, curW = 0
        for (const w of widths) {
            const add = (curW ? itemGap : 0) + w
            if (curW && curW + add > availW) {
                rows++
                curW = w
            } else {
                curW += add
            }
        }
        return 24 + rows * LINE_HEIGHT
    }

    render(group) {
        const chart = this.chart
        if (!chart.options.legend.enabled)
            return
        const items = chart.series.filter(s => s.name).slice().sort((a, b) => a.zIndex - b.zIndex)
        if (!items.length)
            return
        const renderer = chart.renderer
        const symbolW = 12
        const gap = 8
        const itemGap = 20

        //pass 1 — build each item (symbol + label) at local origin (baseline y=0) and measure the REAL
        //text width via getBBox. A char-count estimate over-shoots for the condensed font.
        const built = items.map(s => {
            const color = s.getColor()
            const itemGroup = renderer.group('ix-legend-item').add(group)
            itemGroup.element.style.cursor = 'pointer'
            renderer.circle(symbolW / 2, -FONT / 2 + 1, 5, {})
                .css({fill: color, opacity: s.visible ? 1 : 0.35}).add(itemGroup)
            const label = renderer.label(s.name, symbolW + gap, 0, {'text-anchor': 'start'})
                .css({
                    fontSize: FONT + 'px',
                    fontFamily: 'Roboto Condensed,sans-serif',
                    fill: 'var(--color-text)',
                    color: 'var(--color-text)',
                    'text-decoration': s.visible ? 'none' : 'line-through',
                    opacity: s.visible ? 1 : 0.5
                }).add(itemGroup)
            let textW
            try {
                textW = label.getBBox().width
            } catch (e) {
                textW = Math.ceil(String(s.name).length * FONT * 0.5)
            }
            itemGroup.on('click', () => {
                s.visible = !s.visible
                chart.redraw()
            })
            //hover highlights this series (dims the others) and tints the hovered legend text —
            //but only for visible series: hovering a hidden item must not dim/hide the visible ones
            itemGroup.on('mouseover', () => {
                if (!s.visible)
                    return
                label.css({fill: 'var(--color-primary)', color: 'var(--color-primary)'})
                for (const other of chart.series)
                    if (other.group)
                        other.group.element.style.opacity = other === s ? '1' : '0.25'
            })
            itemGroup.on('mouseout', () => {
                if (!s.visible)
                    return
                label.css({fill: 'var(--color-text)', color: 'var(--color-text)'})
                for (const other of chart.series)
                    if (other.group)
                        other.group.element.style.opacity = '1'
            })
            return {itemGroup, w: symbolW + gap + textW}
        })

        //pass 2 — wrap items into rows that fit the plot width (flexible / responsive)
        const availW = chart.plotWidth
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

        //pass 3 — rows are LEFT-aligned to a common left edge, and the whole block is
        //centred under the plot by its widest row; rows stack upward from the bottom baseline
        const bottomBaseline = chart.chartHeight - chart.spacing[2] - 6
        const maxRowW = rows.reduce((m, r) => Math.max(m, r.w), 0)
        const blockLeft = chart.plotLeft + Math.max(0, (chart.plotWidth - maxRowW) / 2)
        rows.forEach((row, ri) => {
            const baseline = bottomBaseline - (rows.length - 1 - ri) * LINE_HEIGHT
            let x = blockLeft
            for (const b of row.items) {
                b.itemGroup.attr('transform', `translate(${x}, ${baseline})`)
                x += b.w + itemGap
            }
        })
    }
}
