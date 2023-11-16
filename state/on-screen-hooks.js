import {useEffect, useState} from 'react'

/**
 * Hook for determining the visibility of the element inside the scroll context using the Intersection Observer API
 * @param {MutableRefObject<Element>} root - Scroll parent ref
 * @param {String} [rootMargin] - Visibility margin, in pixels or percents (default 0)
 * @returns {Boolean} - Whether an element is visible or not
 */
export function useOnScreen(root, rootMargin) {
    const [isVisible, setVisibility] = useState(false)

    useEffect(() => {
        if (!root.current)
            return
        const observer = new IntersectionObserver(([entry]) => setVisibility(entry.isIntersecting), {rootMargin})
        observer.observe(root.current)
        return () => observer.unobserve(root.current)
    }, [root.current])

    return isVisible
}