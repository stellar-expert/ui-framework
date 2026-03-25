import {useState, useEffect} from 'react'
import {isDocumentVisible, addVisibilityChangeListener, isDocumentVisibilitySupported} from './page-visibility-helpers'

/**
 * Hook that tracks whether the current browser tab/page is visible
 * @returns {boolean} - True if the page is currently visible or false otherwise
 */
export function usePageVisibility() {
    const [visible, setVisible] = useState(isDocumentVisible)
    if (!isDocumentVisibilitySupported || !document.addEventListener)
        return true
    useEffect(() => addVisibilityChangeListener(() => setVisible(isDocumentVisible())))
    return visible
}