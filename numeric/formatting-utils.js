function stripTrailingZeros(value) {
    if (typeof value !== 'string') return value
    return value.replace(/\.?0+$/, '')
}

function addDecimalsSeparators(str, separator = ',', trimTrailingZeros = true) {
    //split numeric to parts
    let [left, right = ''] = str.split('.'),
        res = ''
    //split digit groups
    while (left.length > 3) {
        res = separator + left.substr(-3) + res
        left = left.substr(0, left.length - 3)
    }
    //split negative sign
    if (left === '-') {
        res = res.substr(1)
    }
    res = left + res
    if (trimTrailingZeros) {
        //cleanup and add right part
        right = stripTrailingZeros(right)
    }
    if (right) {
        res += '.' + right
    }
    return res
}

//TODO: replace formatCurrency with formatWithPrecision everywhere
/**
 * Format numeric currency.
 * @deprecated Use formatWithPrecision() directly
 * @param {String|Number} value - Value to format.
 * @param {Number} decimals - Decimals count.
 * @param {String} separator - Digit groups separator.
 * @return {String}
 */
export function formatCurrency(value, decimals = 7, separator = ',') {
    return formatWithPrecision(value, decimals, separator)
}

export function formatWithPrecision(value, precision = 7, separator = ',') {
    if (!value) return '0'
    if (typeof value === 'string') {
        value = parseFloat(value)
        if (isNaN(value)) return '0'
    }
    //use 7 decimals if not specified
    if (!(precision >= 0)) {
        precision = 7
    }
    return addDecimalsSeparators(value.toFixed(precision), separator)
}

export function formatWithAutoPrecision(value, separator = ',') {
    if (!value) return 0
    if (typeof value === 'string') {
        value = parseFloat(value)
    }
    let p = Math.ceil(Math.log10(value)),
        reminderPrecision = p > 1 ? (3 - p) : (Math.abs(p) + 2)
    if (reminderPrecision < 0) {
        reminderPrecision = 0
    }
    return formatWithPrecision(value, reminderPrecision, separator)
}

export function formatWithAbbreviation(value, decimals = 2) {
    let abs = Math.abs(value),
        tier = Math.log10(abs) / 3 | 0,
        suffix = ['', 'K', 'M', 'G', 'T', 'P'][tier]
    if (tier > 0) {
        abs = stripTrailingZeros((abs / Math.pow(10, tier * 3)).toFixed(decimals))
    } else {
        abs = formatWithAutoPrecision(abs)
    }
    return `${value < 0 ? '-' : ''}${abs || '0'}${suffix}`
}

export function formatWithGrouping(value, group) {
    if (!value) return 0
    let precision = group >= 1 ? 0 : Math.abs(Math.log10(group))
    if (group >= 1) {
        value = Math.ceil(value / group) * group
    }
    return addDecimalsSeparators(value.toFixed(precision), ',', false)
}

/**
 *
 * @param {Number|String} value
 * @param {Number} [significantDigits]
 * @return {String}
 */
export function formatPrice(value, significantDigits = 4) {
    //TODO: deal with situations like 0.0000023
    value = parseFloat(value)
    let int = value | 0,
        res = int.toString()
    if (res.length < significantDigits) {
        const reminder = (value % 1).toPrecision(significantDigits - (int === 0 ? 0 : res.length))
        //skip reminder if we have more than 10^2 difference between the integral part and the reminder
        if (!(reminder.match(new RegExp('^' + '0'.repeat(significantDigits))) && res > 0)) {
            res = res + reminder.substr(1)
        }
    }
    return formatCurrency(res)
}

export function formatLongHex(src, symbols = 8) {
    if (src.length <= symbols) return src
    const affixLength = Math.max(2, Math.floor(symbols / 2))
    return src.substr(0, affixLength) + '…' + src.substr(-affixLength)
}

/**
 * Format amount according to Stellar assets precision.
 * @param {Number|String} amount - Value to format.
 * @return {String}
 */
export function adjustAmount(amount) {
    return stripTrailingZeros(parseFloat(amount).toFixed(7)) || '0'
}