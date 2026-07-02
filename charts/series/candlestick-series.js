import {isNumber, pick} from '../core/utilities'
import {Series} from './series'

export class CandlestickSeries extends Series {
    //candlesticks plot OHLC, not a single y; expose extremes from high/low for the axis
    yExtremes(point) {
        return [point.low, point.high]
    }

    render(group) {
        this.group = group
        const renderer = this.chart.renderer
        const xAxis = this.xAxis
        const yAxis = this.yAxis
        const theme = this.chart.options.plotOptions.candlestick || {}
        const upColor = pick(theme.upColor, 'var(--color-price-up)')
        const downColor = pick(theme.color, 'var(--color-price-down)')
        const lineColor = pick(theme.lineColor, 'var(--color-dimmed)')
        const lineWidth = pick(theme.lineWidth, 0.6)

        //local point range — smallest gap between adjacent DRAWN candles. Ignore points without a close
        //(e.g. the trailing [now, null…] marker the price view appends to extend the axis), which would
        //otherwise be a sub-day gap that shrinks the slot and renders thin candles with wide spacing.
        let pr = Infinity
        let prevX = null
        for (const pt of this.plotPoints) {
            if (!isNumber(pt.close))
                continue
            if (prevX !== null) {
                const d = pt.x - prevX
                if (d > 0 && d < pr) pr = d
            }
            prevX = pt.x
        }
        if (pr === Infinity)
            pr = (xAxis.max - xAxis.min) / 100

        for (const p of this.plotPoints) {
            if (!isNumber(p.close))
                continue
            const cx = xAxis.toPixels(p.x)
            const catW = Math.abs(xAxis.toPixels(p.x + pr) - xAxis.toPixels(p.x))
            const w = Math.max(1, catW * 0.6)
            const up = p.close >= p.open
            const color = up ? upColor : downColor
            const yHigh = yAxis.toPixels(p.high)
            const yLow = yAxis.toPixels(p.low)
            const yOpen = yAxis.toPixels(p.open)
            const yClose = yAxis.toPixels(p.close)
            //wick
            renderer.line(cx, yHigh, cx, yLow, {'stroke-width': 1}).css({stroke: lineColor}).add(group)
            //body
            const top = Math.min(yOpen, yClose)
            const h = Math.max(1, Math.abs(yClose - yOpen))
            renderer.rect(cx - w / 2, top, w, h, {'stroke-width': lineWidth})
                .css({fill: color, stroke: lineColor})
                .add(group)
        }
    }
}
