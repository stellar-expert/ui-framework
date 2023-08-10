import React, {useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'

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