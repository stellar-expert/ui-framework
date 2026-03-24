/**
 * Auto-focuses the given DOM element after a short delay (ref callback)
 * @param {HTMLElement} inputRef - DOM element to focus
 */
export function useAutoFocusRef(inputRef) {
    if (!inputRef)
        return
    setTimeout(() => {
        if (document.body.contains(inputRef)) {
            inputRef.focus()
        }
    }, 200)
}
