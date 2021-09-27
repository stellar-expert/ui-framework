import {useState, useEffect} from 'react'

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