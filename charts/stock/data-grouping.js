//Downsample raw series points into calendar-aligned time buckets (stock data grouping).
import {isNumber} from '../core/utilities'

/**
 * Default bucket pixel size per series type: columns/candles need room for a
 * readable bar, lines/areas keep near-raw resolution
 * @param {string} type - series type
 * @return {number}
 */
export function defaultGroupPixelWidth(type) {
    if (/^(column|bar|candlestick)$/.test(type))
        return 10
    if (/^(ohlc|hlc)$/.test(type))
        return 5
    return 2
}

const day = 24 * 3600 * 1000
const week = 7 * day

const UNIT_MS = {
    millisecond: 1,
    second: 1000,
    minute: 60000,
    hour: 3600000,
    day,
    week,
    month: 30 * day,
    year: 365 * day
}

function chooseInterval(units, approxInterval) {
    //flatten the unit/multiple options into ascending candidate intervals
    const candidates = []
    for (const [unitName, multiples] of units)
        for (const mult of multiples)
            candidates.push({unitName, mult, ms: UNIT_MS[unitName] * mult})
    candidates.sort((a, b) => a.ms - b.ms)
    if (!candidates.length)
        return {unitName: 'day', mult: 1, ms: day}
    //pick the candidate NEAREST to the target (midpoint threshold) — not the first one >= target,
    //which over-coarsens (e.g. picks a 6-month bucket where 2-month fits better)
    for (let i = 0; i < candidates.length; i++) {
        const next = candidates[i + 1]
        if (!next || approxInterval <= (candidates[i].ms + next.ms) / 2)
            return candidates[i]
    }
    return candidates[candidates.length - 1]
}

function bucketStart(x, unitName, mult) {
    if (unitName === 'month') {
        const d = new Date(x)
        const m = Math.floor(d.getUTCMonth() / mult) * mult
        return Date.UTC(d.getUTCFullYear(), m, 1)
    }
    if (unitName === 'year') {
        const d = new Date(x)
        const y = Math.floor(d.getUTCFullYear() / mult) * mult
        return Date.UTC(y, 0, 1)
    }
    const ms = UNIT_MS[unitName] * mult
    if (unitName === 'week') {
        //epoch (1970-01-01) is a Thursday, so a plain floor would start weeks on Thursday. Weeks start
        //on Monday — anchor to 1970-01-05 (the first Monday) so buckets align to week boundaries.
        const MONDAY_ANCHOR = 4 * day
        return Math.floor((x - MONDAY_ANCHOR) / ms) * ms + MONDAY_ANCHOR
    }
    return Math.floor(x / ms) * ms
}

function aggregate(values, approximation) {
    if (!values.length)
        return null
    switch (approximation) {
        case 'sum':
            return values.reduce((a, b) => a + b, 0)
        case 'high':
            return Math.max(...values)
        case 'low':
            return Math.min(...values)
        case 'open':
            return values[0]
        case 'close':
            return values[values.length - 1]
        case 'average':
        default:
            return values.reduce((a, b) => a + b, 0) / values.length
    }
}

/**
 * @param {{x:number,y:number}[]} rawPoints - chronological raw points
 * @param {{units:Array, groupPixelWidth:number, approximation:string}} grouping
 * @param {number} xMin
 * @param {number} xMax
 * @param {number} plotWidth
 * @param {string} defaultApproximation
 * @return {{x:number,y:number}[]}
 */
export function groupSeriesData(rawPoints, grouping, xMin, xMax, plotWidth, defaultApproximation) {
    if (!rawPoints.length)
        return rawPoints
    const groupPixelWidth = grouping.groupPixelWidth || 16
    const groupCount = Math.max(1, Math.floor(plotWidth / groupPixelWidth))
    const approxInterval = (xMax - xMin) / groupCount
    const units = grouping.units || [['millisecond', [1]], ['second', [1]], ['minute', [1]], ['hour', [1]], ['day', [1]], ['week', [1]], ['month', [1]], ['year', [1]]]
    const {unitName, mult} = chooseInterval(units, approxInterval)
    const approximation = grouping.approximation || defaultApproximation || 'average'

    //OHLC series (candlestick/ohlc) aggregate open=first, high=max, low=min, close=last per bucket
    //instead of a single value — detect it from the point shape
    const isOHLC = rawPoints.some(p => isNumber(p.open) && isNumber(p.close))

    const grouped = []
    let curStart = null
    let bucketPts = []
    let bucketFirst = null

    const flush = () => {
        if (!bucketPts.length)
            return
        //carry the bucket unit/multiple so the tooltip can show the group range (e.g. "September-October 2021")
        const meta = {x: curStart, series: bucketFirst.series, groupUnit: unitName, groupMult: mult}
        if (isOHLC) {
            const open = bucketPts[0].open
            const close = bucketPts[bucketPts.length - 1].close
            grouped.push({
                ...meta,
                open,
                high: Math.max(...bucketPts.map(p => p.high)),
                low: Math.min(...bucketPts.map(p => p.low)),
                close,
                y: close
            })
        } else {
            grouped.push({...meta, y: aggregate(bucketPts.map(p => p.y), approximation)})
        }
    }

    for (const p of rawPoints) {
        if (isOHLC ? !isNumber(p.close) : !isNumber(p.y))
            continue
        const start = bucketStart(p.x, unitName, mult)
        if (curStart === null || start !== curStart) {
            flush()
            curStart = start
            bucketPts = []
            bucketFirst = p
        }
        bucketPts.push(p)
    }
    flush()
    return grouped
}
