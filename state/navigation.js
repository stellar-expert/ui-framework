import {createBrowserHistory} from 'history'

export const history = createBrowserHistory()

let queryString = {},
    observers = []

function notifyChanged(nav) {
    for (let handler of observers) {
        handler(nav)
    }
}

function setQueryParams(paramsToSet, replace = false) {
    const prevState = JSON.stringify(queryString),
        newQuery = Object.assign({}, replace ? null : queryString, paramsToSet)
    if (JSON.stringify(newQuery) !== prevState) {
        Object.freeze(newQuery)
        queryString = newQuery
        return true
    }
    return false
}

class NavigationWrapper {
    get history() {
        return history
    }

    get query() {
        return queryString
    }

    get path() {
        return history.location.pathname
    }

    get hash() {
        return history.location.hash
    }

    set hash(value) {
        if (value[0] !== '#') value = '#' + value
        window.location.hash = value
        history.location.hash = value
    }

    preventNavigationInsideIframe = false

    /**
     * Update query string.
     * @param {Object} paramsToSet - Object containing query params to set.
     * @param {Boolean} replace - Replace previous query state entirely.
     */
    updateQuery(paramsToSet, replace = false) {
        if (setQueryParams(paramsToSet)) {
            const newUrl = this.path + stringifyQuery(queryString)
            history.replace(newUrl)
            notifyChanged(this)
        }
    }

    navigate(url) {
        //if (history.location.pathname + history.location.search === url.replace(/#.*$/, '')) return
        setQueryParams(parseQuery(url.split('?')[1] || ''), true)
        history.push(url)
        notifyChanged(this)
    }

    replaceState(url) {
        //if (history.location.pathname + history.location.search === url.replace(/#.*$/, '')) return
        setQueryParams(parseQuery(url.split('?')[1] || ''), true)
        history.replace(url)
        notifyChanged(this)
    }

    /**
     * @param {LocationChangeListener} handler
     * @retur {*}
     */
    listen(handler) {
        observers.push(handler)
        return this.stopListening.bind(this, handler)
    }

    stopListening(handler) {
        observers.splice(observers.indexOf(handler))
    }
}

export const navigation = new NavigationWrapper()

export function bindClickNavHandler(container) {
    container.addEventListener('click', e => {
        if (e.ctrlKey) return
        let link = e.target
        while (link && !(link.tagName === 'A' && link.href)) {
            link = link.parentElement
        }
        if (link) {
            const href = link.getAttribute('href')
            if (link.target === '_blank' || !href) return
            if (href === '#') return e.preventDefault()
            if (window.parent !== window && navigation.preventNavigationInsideIframe) {
                window.top.location = /^(https?):\/\//.test(href) ? href : (window.origin + href)
                return e.preventDefault()
            }
            if (link.classList.contains('external-link')) return
            if (/^(mailto:|tel:|(https?):\/\/)/.test(href)) return

            const [pathAndQuery] = href.split('#')

            if (!pathAndQuery || (history.location.pathname + history.location.search) === pathAndQuery)
                return e.preventDefault()
            if (link.classList.contains('static-link'))
                return e.preventDefault()
            navigation.navigate(href)
            e.preventDefault()
            window.scrollTo(0, 0)
        }
    })
}

export function stringifyQuery(query) {
    if (!query) return ''
    const q = [],
        entries = Object.entries(query)
    entries.sort(function ([a], [b]) {
        if (a > b) return 1
        if (a < b) return -1
        return 0
    })
    for (let [key, value] of entries) {
        if (value !== undefined && value !== null && value !== '') {
            if (value instanceof Array) {
                for (let v of value) {
                    q.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`)
                }
            } else {
                q.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            }
        }
    }
    return q.length ? '?' + q.join('&') : ''
}

export function parseQuery(query = null, dest = null) {
    if (query === null) {
        query = history.location.search
    }
    if (query[0] === '?') query = query.substr(1)
    if (!dest) {
        dest = {}
    }
    for (let kv of query.split('&')) {
        let [key, value] = kv.split('=').map(v => decodeURIComponent(v))
        if (key) {
            if (/\[\]$/.test(key)) {
                key = key.substr(0, key.length - 2)
                const array = dest[key] || []
                array.push(value)
                value = array
            }
            dest[key] = value
        }
    }
    return dest
}

/**
 * @callback LocationChangeListener
 * @param {number}
 */