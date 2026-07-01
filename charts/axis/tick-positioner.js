//Linear "nice number" tick interval + positions.
import {addThousandsSep} from '../core/utilities'

/**
 * Round an interval to a human-friendly value (1, 2, 2.5, 5, 10 * 10^n).
 */
export function normalizeTickInterval(interval) {
    const magnitude = Math.pow(10, Math.floor(Math.log(interval) / Math.LN10))
    const normalized = interval / magnitude
    let multiple
    if (normalized < 1.5) multiple = 1
    else if (normalized < 3) multiple = 2
    else if (normalized < 7) multiple = 5
    else multiple = 10
    return multiple * magnitude
}

/**
 * Compute linear tick positions for [min, max].
 * @return {{positions: number[], interval: number, min: number, max: number}}
 */
export function getLinearTickPositions(min, max, targetCount, startOnTick, endOnTick) {
    if (max <= min) {
        max = min + 1
    }
    const rough = (max - min) / Math.max(1, targetCount)
    const interval = normalizeTickInterval(rough)

    let tickMin = startOnTick ? Math.floor(min / interval) * interval : min
    let tickMax = endOnTick ? Math.ceil(max / interval) * interval : max

    const positions = []
    //guard against floating point drift
    const decimals = interval < 1 ? Math.ceil(-Math.log(interval) / Math.LN10) + 1 : 0
    for (let pos = tickMin; pos <= tickMax + interval / 1e6; pos += interval) {
        positions.push(decimals ? parseFloat(pos.toFixed(decimals)) : pos)
    }
    return {positions, interval, min: tickMin, max: tickMax}
}

//nice tick mantissas for range-fitted axes — lets them land on 3/4/6/8 to fit an exact gridline count.
//1.5 is excluded HERE (the in-range band search) because in a band like (128,154] it would grab 150 —
//yielding cluttered 150/450/750 labels; those ranges fall through to the ceil fallback below and land on
//a cleaner 2×10ⁿ (→200/800) instead.
const ALIGNED_NICE = [1, 2, 2.5, 3, 4, 5, 6, 8, 10]

//the ceil fallback DOES allow 1.5, so a tight small range (e.g. data ~6.2, interval ~1.24) lands on
//0,1.5,3,4.5,6 instead of the looser 0,2,4,6,8. This is safe: niceCeilAligned returns the smallest value
//>= v, so 1.5×10ⁿ is only ever chosen when v itself sits in (1×10ⁿ, 1.5×10ⁿ] — never for a band like 154
//(→200), so it can't reintroduce 150/750 on a large axis.
const ALIGNED_NICE_CEIL = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]

//smallest ALIGNED_NICE_CEIL value >= v
function niceCeilAligned(v) {
    if (!(v > 0))
        return 1
    const base = Math.floor(Math.log(v) / Math.LN10)
    for (let mag = base - 1; mag <= base + 2; mag++) {
        const scale = Math.pow(10, mag)
        for (const n of ALIGNED_NICE_CEIL)
            if (n * scale >= v * (1 - 1e-9))
                return n * scale
    }
    return Math.pow(10, base + 2)
}

//smallest "nice" value strictly above lo and at most hi, or null if the band contains none
function niceInRange(lo, hi) {
    if (!(hi > 0))
        return null
    const candidates = []
    const top = Math.floor(Math.log(hi) / Math.LN10) + 1
    for (let mag = top; mag >= top - 3; mag--) {
        const scale = Math.pow(10, mag)
        for (const n of ALIGNED_NICE)
            candidates.push(n * scale)
    }
    candidates.sort((a, b) => a - b)
    for (const v of candidates)
        if (v > lo * (1 + 1e-9) && v <= hi * (1 + 1e-9))
            return v
    return null
}

/**
 * Range-fitted nice ticks for a non-zero-based axis (e.g. a zoomed price pane). Picks a nice interval that
 * yields about `count` ticks: the band (range/count, range/(count-1)] holds the interval that places
 * `count-1` intervals at or below the data, so the top tick can sit just under the data with a little
 * headroom above it. When several axes share a pane they pass the same `count`, so their gridlines line up.
 * @return {{min:number, max:number, interval:number, positions:number[]}}
 */
export function niceAlignedTicks(dataMin, dataMax, count) {
    let dmin = dataMin
    let dmax = dataMax
    if (dmin === dmax) {
        dmin -= 0.5
        dmax += 0.5
    }
    const intervals = Math.max(1, count - 1)
    const span = (dmax - dmin) || Math.abs(dmax) || 1
    let interval = niceInRange(span / count, span / intervals)
    if (!interval)
        interval = niceCeilAligned(span / intervals)
    const min = Math.floor(dmin / interval) * interval
    const decimals = interval < 1 ? Math.ceil(-Math.log(interval) / Math.LN10) + 1 : 2
    const positions = []
    for (let i = 0; i < count; i++)
        positions.push(parseFloat((min + interval * i).toFixed(decimals)))
    const top = positions[positions.length - 1]
    //small headroom so the series doesn't sit flush against the top edge; never below the last tick
    return {min, max: Math.max(dmax + span * 0.04, top), interval, positions}
}

/**
 * Zero-based dashboard grid: ALWAYS 5 equal sections (6 gridlines at 0/20/40/60/80/100% of the height).
 * The interval is the smallest nice value (incl. 1.5×10ⁿ) ≥ dataMax/4.5, so the data max reaches at most
 * 90% of the top (≈80% typically) and never touches the top edge / zoom controls:
 *   38 → 10 (0,10,20,30,40,·50),  45 → 10,  46 → 15 (0,15,30,45,60,·75),  775M → 200M (…,800M,·1G).
 * Because every axis spans 0..5·interval, two axes sharing a pane land on the SAME six pixel lines
 * automatically — no cross-axis reconciliation needed. The top (100%) line is drawn but not labelled.
 * @return {{min:number, max:number, interval:number, positions:number[], labelled:number[]}}
 */
export function zeroBasedGridTicks(dataMax) {
    const SECTIONS = 5
    //data max may reach at most 90% of the top section line → interval ≥ dataMax / (5 * 0.9) = dataMax / 4.5
    const interval = niceCeilAligned((dataMax > 0 ? dataMax : 1) / 4.5)
    const decimals = interval < 1 ? Math.ceil(-Math.log(interval) / Math.LN10) + 1 : 2
    const positions = []
    for (let i = 0; i <= SECTIONS; i++)
        positions.push(parseFloat((interval * i).toFixed(decimals)))
    return {
        min: 0,
        max: interval * SECTIONS,
        interval,
        positions,
        labelled: positions.slice(0, SECTIONS) //topmost (100%) line is drawn but its value isn't shown
    }
}

/**
 * Pick a single unit for a whole axis from its largest absolute value, so every label uses the same
 * scale (e.g. 500M / 1,000M / 1,500M / 2,000M rather than 500M / 1B / 1.5B).
 * @return {{divisor:number, suffix:string}}
 */
export function axisNumberUnit(maxAbs) {
    //SI-style numeric symbols: k (1e3), M (1e6), G (1e9), T (1e12) — so 10,000M renders as 10G
    if (maxAbs >= 1e12) return {divisor: 1e12, suffix: 'T'}
    if (maxAbs >= 1e9) return {divisor: 1e9, suffix: 'G'}
    if (maxAbs >= 1e6) return {divisor: 1e6, suffix: 'M'}
    if (maxAbs >= 1e3) return {divisor: 1e3, suffix: 'k'}
    return {divisor: 1, suffix: ''}
}

/**
 * Format an axis numeric label with thousands separators, using a fixed unit when provided.
 * @param {number} value
 * @param {{divisor:number, suffix:string}} [unit] - shared axis unit; derived per-value if omitted
 */
export function formatAxisNumber(value, unit) {
    if (value === 0)
        return '0'
    const {divisor, suffix} = unit || axisNumberUnit(Math.abs(value))
    const v = value / divisor
    const a = Math.abs(v)
    if (a > 0 && a < 1)
        return parseFloat(v.toPrecision(4)) + suffix
    return addThousandsSep(trimZeros(v)) + suffix
}

function trimZeros(v) {
    return String(parseFloat(v.toFixed(2)))
}
