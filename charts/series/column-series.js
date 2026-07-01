import {Series} from './series'
import {pick, isNumber, clamp} from '../core/utilities'
import {animateColumns} from '../core/animate'

export class ColumnSeries extends Series {
    render(group) {
        this.group = group
        const bars = []
        const renderer = this.chart.renderer
        const color = this.getColor()
        const xAxis = this.xAxis
        const yAxis = this.yAxis
        const colOpts = this.chart.options.plotOptions.column || {}
        const groupPadding = pick(colOpts.groupPadding, this.chart.options.plotOptions.series.groupPadding, 0.1)
        const pointPadding = pick(colOpts.pointPadding, this.chart.options.plotOptions.series.pointPadding, 0.1)
        const count = this.columnCount || 1
        const idx = this.columnIndex || 0
        const pointRange = this.chart.pointRange || ((xAxis.max - xAxis.min) / 50)

        //baseline (threshold) pixel for un-stacked columns
        const tVal = isNumber(this.threshold) ? this.threshold : yAxis.min
        const baselineY = yAxis.toPixels(clamp(tVal, yAxis.min, yAxis.max))

        const onCategory = !!xAxis.categories
        for (const p of this.plotPoints) {
            if (!isNumber(p.y))
                continue
            //column centered on the point x (slot spans [x-pointRange/2, x+pointRange/2]) so columns
            //line up with the line/area plotted at x and with the axis tick at x
            const center = xAxis.toPixels(p.x)
            const categoryWidth = Math.abs(xAxis.toPixels(p.x + (onCategory ? 1 : pointRange)) - xAxis.toPixels(p.x))
            const groupWidth = categoryWidth * (1 - 2 * groupPadding)
            const offsetWidth = groupWidth / count
            const colWidth = Math.max(1, offsetWidth * (1 - 2 * pointPadding))
            const groupLeft = center - groupWidth / 2
            const colX = groupLeft + idx * offsetWidth + (offsetWidth - colWidth) / 2

            const top = isNumber(p.stackY) ? yAxis.toPixels(p.stackY) : yAxis.toPixels(p.y)
            const bottom = isNumber(p.stackLow) ? yAxis.toPixels(p.stackLow) : baselineY
            const y = Math.min(top, bottom)
            const h = Math.max(0, Math.abs(bottom - top))
            const rect = renderer.rect(colX, y, colWidth, h, {})
                .css({fill: color})
                .add(group)
            //colTopY = pixel of the WHOLE column's top (stack total) so a stacked column fills as one unit.
            //toPixels already applies the (log) transform — don't clamp the data value against the axis'
            //internal min/max, which are in transformed space on a log axis
            const total = isNumber(p.stackTotal) ? p.stackTotal : p.y
            const colTopY = yAxis.toPixels(total)
            bars.push({el: rect, topY: y, botY: y + h, baselineY, colTopY})
        }
        if (this.chart.animateThisRender)
            animateColumns(bars)
    }
}
