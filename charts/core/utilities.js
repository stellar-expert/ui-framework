//Small shared helpers. Zero-dependency.

export function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function isNumber(value) {
    return typeof value === 'number' && !isNaN(value)
}

export function defined(value) {
    return value !== undefined && value !== null
}

export function pick(...args) {
    for (const arg of args)
        if (defined(arg))
            return arg
    return undefined
}

/**
 * Deep merge: plain objects are merged recursively,
 * everything else (arrays, class instances, primitives) is copied by assignment (replaced).
 * Pass `true` as the first argument to merge into a fresh object (deep clone of sources).
 * @param {...*} sources
 * @return {{}}
 */
export function merge(...sources) {
    let i = 0
    if (sources[0] === true) {
        i = 1
    }
    const result = {}
    function doMerge(target, source) {
        if (!isObject(source))
            return target
        for (const key of Object.keys(source)) {
            const val = source[key]
            if (isObject(val)) {
                target[key] = doMerge(isObject(target[key]) ? target[key] : {}, val)
            } else {
                target[key] = Array.isArray(val) ? val.slice() : val
            }
        }
        return target
    }
    for (; i < sources.length; i++) {
        doMerge(result, sources[i])
    }
    return result
}

/**
 * Clamp a number into the [min, max] range.
 */
export function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value)
}

/**
 * Resolve a percentage/absolute value against a total ('80%' -> 0.8*total, 40 -> 40).
 */
export function relativeLength(value, total, offset = 0) {
    if (typeof value === 'string' && value.endsWith('%'))
        return parseFloat(value) / 100 * total + offset
    return (parseFloat(value) || 0) + offset
}

/**
 * Insert thousands separators into the integer part of a number/string ('1234.5' -> '1,234.5').
 */
export function addThousandsSep(value) {
    const parts = String(value).split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
}

let idCounter = 0

export function uniqueId(prefix = 'svg') {
    return prefix + (++idCounter)
}

/**
 * Resolve a DOM element from an id string or an element reference.
 */
export function resolveContainer(renderTo) {
    if (typeof renderTo === 'string')
        return document.getElementById(renderTo)
    return renderTo
}
