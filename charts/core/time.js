//UTC date math, datetime tick generation and label formatting.
//The explorer theme uses time.useUTC = true, so everything here is UTC-based.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const sec = 1000
const min = 60 * sec
const hour = 60 * min
const day = 24 * hour
const week = 7 * day

function pad(n, len = 2) {
    return String(n).padStart(len, '0')
}

/**
 * Minimal time-style formatter (UTC) covering the tokens the explorer uses.
 */
export function dateFormat(format, timestamp) {
    const d = new Date(timestamp)
    const replacements = {
        Y: d.getUTCFullYear(),
        y: pad(d.getUTCFullYear() % 100),
        m: pad(d.getUTCMonth() + 1),
        b: MONTHS[d.getUTCMonth()],
        B: MONTHS_FULL[d.getUTCMonth()],
        d: pad(d.getUTCDate()),
        e: d.getUTCDate(),
        H: pad(d.getUTCHours()),
        M: pad(d.getUTCMinutes()),
        S: pad(d.getUTCSeconds())
    }
    return format.replace(/%([A-Za-z])/g, (m, t) => (replacements[t] !== undefined ? replacements[t] : m))
}

//candidate time units with their length in ms and allowed multiples
const UNITS = [
    {name: 'millisecond', ms: 1, multiples: [1, 2, 5, 10, 20, 50, 100, 200, 500]},
    {name: 'second', ms: sec, multiples: [1, 2, 5, 10, 15, 30]},
    {name: 'minute', ms: min, multiples: [1, 2, 5, 10, 15, 30]},
    {name: 'hour', ms: hour, multiples: [1, 2, 3, 4, 6, 8, 12]},
    {name: 'day', ms: day, multiples: [1, 2]},
    {name: 'week', ms: week, multiples: [1, 2]},
    {name: 'month', ms: 30 * day, multiples: [1, 2, 3, 4, 6]},
    {name: 'year', ms: 365 * day, multiples: [1, 2, 5, 10, 25, 50, 100]}
]

/**
 * Choose an appropriate datetime tick unit and produce calendar-aligned UTC tick positions.
 * @param {number} minTs
 * @param {number} maxTs
 * @param {number} targetCount - desired number of ticks
 * @return {{positions: number[], unitName: string, count: number}}
 */
export function getDateTimeTickPositions(minTs, maxTs, targetCount) {
    const range = maxTs - minTs
    const approx = range / Math.max(1, targetCount)
    //pick unit + multiple whose interval is closest to (>=) approx
    let chosen = UNITS[UNITS.length - 1]
    let chosenCount = chosen.multiples[chosen.multiples.length - 1]
    outer: for (const unit of UNITS) {
        for (const mult of unit.multiples) {
            if (unit.ms * mult >= approx) {
                chosen = unit
                chosenCount = mult
                break outer
            }
        }
    }

    const positions = []
    const unitName = chosen.name

    if (unitName === 'year') {
        const startYear = new Date(minTs).getUTCFullYear()
        const endYear = new Date(maxTs).getUTCFullYear()
        const step = chosenCount
        let y = Math.floor(startYear / step) * step
        for (; y <= endYear + step; y += step) {
            positions.push(Date.UTC(y, 0, 1))
        }
    } else if (unitName === 'month') {
        const start = new Date(minTs)
        let y = start.getUTCFullYear()
        let m = Math.floor(start.getUTCMonth() / chosenCount) * chosenCount
        let ts = Date.UTC(y, m, 1)
        while (ts <= maxTs + chosen.ms * chosenCount) {
            positions.push(ts)
            m += chosenCount
            ts = Date.UTC(y, m, 1)
        }
    } else {
        const interval = chosen.ms * chosenCount
        //align to the unit boundary (start of day for day/week, etc.)
        let start = Math.floor(minTs / interval) * interval
        if (unitName === 'week') {
            //align to Monday
            const d = new Date(start)
            const dow = (d.getUTCDay() + 6) % 7
            start -= dow * day
        }
        for (let ts = start; ts <= maxTs + interval; ts += interval) {
            positions.push(ts)
        }
    }

    return {positions, unitName, count: chosenCount}
}

//default label format per unit
export function dateTimeLabelFormat(unitName) {
    switch (unitName) {
        case 'year':
            return '%Y'
        case 'month':
            return "%b '%y"
        case 'week':
        case 'day':
            return '%e %b'
        case 'hour':
        case 'minute':
            return '%H:%M'
        case 'second':
            return '%H:%M:%S'
        default:
            return '%H:%M:%S'
    }
}
