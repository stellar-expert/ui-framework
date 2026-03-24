import React from 'react'
import TimeAgo from 'react-timeago'

const timeUnits = {
    second: 's',
    minute: 'm',
    hour: 'h',
    day: 'd',
    week: 'w',
    month: 'mo',
    year: 'y'
}

/**
 * Displays relative elapsed time since a given timestamp (e.g., "3m ago")
 * @param {Object} props
 * @param {Date|string|number} props.ts - Timestamp to measure elapsed time from
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.suffix] - Text appended after the time (e.g., " ago")
 */
export const ElapsedTime = React.memo(function ElapsedTime({ts, className, suffix}) {
    const then = Date.parse(ts)
    return <span className={className}>
        <TimeAgo date={ts} formatter={(v, unit) => `${v}${timeUnits[unit]}`} now={function () {
            const now = Date.now()
            return then > now ? then : now
        }}/>{suffix}
    </span>
})