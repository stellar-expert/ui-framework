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

export const ElapsedTime = React.memo(function ElapsedTime({ts, className, suffix}) {
    const then = Date.parse(ts)
    return <span className={className}>
        <TimeAgo date={ts} formatter={(v, unit) => `${v}${timeUnits[unit]}`} now={function () {
            const now = Date.now()
            return then > now ? then : now
        }}/>{suffix}
    </span>
})