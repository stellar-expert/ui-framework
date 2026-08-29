class ClaimableInterval {
    constructor(interval) {
        this.interval = interval
    }

    interval

    static before(time) {
        return new ClaimableInterval([Number.NEGATIVE_INFINITY, time])
    }

    static after(time) {
        return new ClaimableInterval([time, Number.POSITIVE_INFINITY])
    }

    static unconditional() {
        return new ClaimableInterval([Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY])
    }

    inverse() {
        const {interval} = this
        if (interval[interval.length - 1] === Number.POSITIVE_INFINITY) {
            interval.pop()
        } else {
            interval.push(Number.POSITIVE_INFINITY)
        }
        if (interval[0] === Number.NEGATIVE_INFINITY) {
            interval.shift()
        } else {
            interval.unshift(Number.NEGATIVE_INFINITY)
        }
        return this
    }

    iterate(timespanCallback) {
        for (let i = 0; i < this.interval.length; i += 2) {
            if (timespanCallback([this.interval[i], this.interval[i + 1]]))
                return true
        }
        return false
    }

    getStatus() {
        const now = parseTime(new Date())
        if (this.iterate(interval => interval[0] <= now && interval[1] >= now))
            return 'available'
        if (this.iterate(interval => interval[0] > now))
            return 'pending'
        if (this.iterate(interval => interval[0] < now))
            return 'expired'
        return 'unfeasible'
    }
}

class ClaimableIntervalIntersection {
    static and(intervals) {
        if (intervals.length < 2)
            return intervals[0] || new ClaimableInterval([])

        const merged = []
        for (const {interval} of intervals)
            if (interval.length) {
                merged.unshift({start: interval[0]})
                merged.push({end: interval[1]})
            }
        merged.sort((a, b) => a.hasOwnProperty('start') && b.hasOwnProperty('end') ? -1 : a.start - b.start || a.end - b.end)

        let depth = 0
        let intervalStart
        const result = []
        for (const x of merged) {
            if (x.hasOwnProperty('start')) {
                depth++
                if (depth === intervals.length) {
                    intervalStart = x.start
                }
            } else {
                if (depth === intervals.length && typeof intervalStart !== 'undefined' && intervalStart < x.end) {
                    result.push(intervalStart)
                    result.push(x.end)
                    intervalStart = undefined
                }
                depth--
            }
        }

        return new ClaimableInterval(result)
    }

    static or(intervals) {
        if (intervals.length < 2)
            return intervals[0] || new ClaimableInterval([])

        intervals.sort((a, b) => a.interval[0] - b.interval[0])

        const result = []
        let previous
        for (const {interval} of intervals) {
            if (!interval.length)
                continue
            if (!previous) {
                previous = interval
                continue
            }
            if (previous[1] >= interval[0]) {
                previous = [previous[0], Math.max(previous[1], interval[1])]
            } else {
                result.push(...previous)
                previous = interval
            }
        }
        if (previous) {
            result.push(...previous)
        }

        return new ClaimableInterval(result)
    }
}

class ClaimableBalancePredicateOverlapParser {
    constructor(pointInTime) {
        this.pointInTime = parseTime(pointInTime)
    }

    pointInTime

    parse(predicate) {
        if (predicate.not)
            return this.parse(predicate.not).inverse()
        if (predicate.or)
            return ClaimableIntervalIntersection.or(predicate.or.map(p => this.parse(p)))
        if (predicate.and)
            return ClaimableIntervalIntersection.and(predicate.and.map(p => this.parse(p)))
        if (predicate.abs_before)
            return ClaimableInterval.before(parseTime(predicate.abs_before))
        if (predicate.abs_after)
            return ClaimableInterval.after(parseTime(predicate.abs_after))
        if (predicate.rel_before)
            return ClaimableInterval.before(this.pointInTime + parseTime(predicate.rel_before))
        if (predicate.rel_after)
            return ClaimableInterval.after(this.pointInTime + parseTime(predicate.rel_after))
        if (predicate.unconditional)
            return ClaimableInterval.unconditional()

        throw new Error(`Failed to parse claimable balance predicate: ${JSON.stringify(predicate)}`)
    }
}

function parseTime(time) {
    return Math.floor(new Date(time).getTime() / 1000)
}

/**
 * Detect the status of a claimable balance at any given point in time based on claim conditions
 * @param {Claimant} claimant - Claimant condition with destination and predicate
 * @param {String|Date} [pointInTime] - Specific point in time (now by default)
 * @return {'available'|'pending'|'expired'|'unfeasible'}
 */
export function getClaimableBalanceClaimStatus(claimant, pointInTime) {
    return new ClaimableBalancePredicateOverlapParser(pointInTime || new Date())
        .parse(claimant.predicate)
        .getStatus()
}
