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
            if (timespanCallback([this.interval[i], this.interval[i + 1]])) return true
        }
        return false
    }

    getStatus() {
        const now = parseTime(new Date())
        if (this.iterate(interval => interval[0] <= now && interval[1] >= now)) return 'available'
        if (this.iterate(interval => interval[0] > now)) return 'pending'
        if (this.iterate(interval => interval[0] < now)) return 'expired'
        return 'unfeasible'
    }
}

class ClaimableIntervalIntersection {

    static and(intervals) {
        if (intervals.length < 2) return intervals[0] || []

        const merged = []
        for (let {interval} of intervals)
            if (interval.length) {
                merged.unshift({start: interval[0]})
                merged.push({end: interval[1]})
            }
        merged.sort((a, b) => a.hasOwnProperty('start') && b.hasOwnProperty('end') ? -1 : a.start - b.start || a.end - b.end)

        let depth = 0,
            intervalStart,
            result = []
        for (let x of merged) {
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
        if (intervals.length < 2) return intervals

        intervals.sort((a, b) => a[0] - b[0])

        let result = [],
            previous
        for (let {interval} of intervals) {
            if (!interval.length) continue
            if (!previous) {
                previous = interval
                continue
            }
            if (previous[1] >= interval[0]) {
                previous = [previous[0], Math.max(previous[1], interval[1])]
            } else {
                result.push(previous)
                previous = interval
            }
        }

        result.push(previous)

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
            return ClaimableIntervalIntersection.or(predicate.or.map(predicate => this.parse(predicate)))
        if (predicate.and)
            return ClaimableIntervalIntersection.and(predicate.and.map(predicate => this.parse(predicate)))
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
    return new Date(time).getTime() / 1000 | 0
}

/**
 *
 * @param {Claimant[]} claimants
 * @param {String} account
 * @param {String|Date} [pointInTime]
 * @return {'available'|'pending'|'expired'|'unfeasible'|'unavailable'}
 */
export function getClaimableBalanceClaimStatus(claimants, account, pointInTime) {
    const claimant = claimants.find(c => c.destination === account)
    if (!claimant) return 'unavailable'
    if (!pointInTime) {
        pointInTime = new Date()
    }
    return new ClaimableBalancePredicateOverlapParser(pointInTime).parse(claimant.predicate).getStatus()
}