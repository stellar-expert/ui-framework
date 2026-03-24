/**
 * Whether the Page Visibility API is supported by the browser
 * @type {boolean}
 */
export const isDocumentVisibilitySupported = 'hidden' in document

/**
 * Check whether the document is currently visible (tab is active)
 * @return {boolean}
 */
export function isDocumentVisible() {
    if (!isDocumentVisibilitySupported) return true
    return !document.hidden
}

/**
 * Register a listener for document visibility changes
 * @param {function(boolean): void} listener - Callback invoked with `true` when visible, `false` when hidden
 * @return {function(): void} Unsubscribe function
 */
export function addVisibilityChangeListener(listener) {
    function wrappedListener() {
        listener(isDocumentVisible())
    }

    document.addEventListener('visibilitychange', wrappedListener)
    return function () {
        document.removeEventListener('visibilitychange', wrappedListener)
    }
}