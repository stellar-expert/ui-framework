import React, {useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'

/**
 * Animated inline progress indicator that cycles through dots
 * @param {Object} props
 * @param {number} [props.dots=5] - Maximum number of dots to display
 */
export const InlineProgress = React.memo(function InlineProgress({dots = 5}) {
    const [progress, setProgress] = useState(0),
        intervalRef = useRef(0)
    useEffect(() => {
        intervalRef.current = setInterval(() => setProgress(p => ++p), 500)
        return () => clearInterval(intervalRef.current)
    }, [])
    return <span>{'.'.repeat(progress % (dots + 1))}</span>
})

InlineProgress.propTypes = {
    dots: PropTypes.number
}