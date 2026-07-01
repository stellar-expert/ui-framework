import {LineSeries} from './line-series'
import {AreaSeries} from './area-series'
import {ColumnSeries} from './column-series'
import {CandlestickSeries} from './candlestick-series'

//series type registry — extended in later phases (spline-smoothing, candlestick, variablepie, ...)
export const seriesTypes = {
    line: LineSeries,
    spline: LineSeries,
    area: AreaSeries,
    areaspline: AreaSeries,
    column: ColumnSeries,
    bar: ColumnSeries,
    candlestick: CandlestickSeries,
    ohlc: CandlestickSeries
}

export function createSeries(chart, options) {
    const Ctor = seriesTypes[options.type] || LineSeries
    return new Ctor(chart, options)
}
