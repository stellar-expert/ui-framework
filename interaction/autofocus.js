import {useEffect, useRef} from 'react'

export function useAutoFocusRef() {
    const inputRef = useRef(null)
    useEffect(() => {
        const {current} = inputRef
        if (current) {
            setTimeout(() => current.focus(), 200)
        }
    }, [])
    return inputRef
}