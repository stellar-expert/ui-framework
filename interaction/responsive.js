import {useState, useEffect} from 'react'
import {throttle} from 'throttle-debounce'

/**
 * Measures window client width
 * @return {Number}
 */
export function useWindowWidth() {
    const [width, setWidth] = useState(window.innerWidth)

    const onResize = throttle(100, function () {
        setWidth(window.innerWidth)
    })

    useEffect(() => {
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    return width
}