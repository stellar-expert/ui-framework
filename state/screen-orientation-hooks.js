import {useState, useEffect} from 'react'

/**
 * React hook that tracks and returns the current screen orientation type
 * @return {OrientationType} Screen orientation (e.g., "portrait-primary", "landscape-primary")
 */
export function useScreenOrientation() {
    const [orientation, setOrientation] = useState(window.screen.orientation.type)

    function onChange() {
        setOrientation(window.screen.orientation.type)
    }

    useEffect(() => {
        window.addEventListener('orientationchange', onChange)
        return () => window.removeEventListener('orientationchange', onChange)
    }, [])

    return orientation
}