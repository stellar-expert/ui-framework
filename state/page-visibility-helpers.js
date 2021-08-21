export const isDocumentVisibilitySupported = 'hidden' in document

export function isDocumentVisible() {
    if (!isDocumentVisibilitySupported) return true
    return !document.hidden
}

export function addVisibilityChangeListener(listener) {
    function wrappedListener() {
        listener(isDocumentVisible())
    }

    document.addEventListener('visibilitychange', wrappedListener)
    return function () {
        document.removeEventListener('visibilitychange', wrappedListener)
    }
}