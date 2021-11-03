import Bignumber from 'bignumber.js'

export function stripTrailingZeros(value) {
    if (typeof value !== 'string') return value
    let [int, reminder] = value.split('.')
    if (!reminder) return int
    reminder = reminder.replace(/0+$/, '')
    if (!reminder.length) return int
    return int + '.' + reminder
}

function addDecimalsSeparators(value, separator = ',', trimTrailingZeros = true) {
    //TODO: use Bignumber.toFormat() method instead
    //split numeric to parts
    let [int, reminder] = value.split('.'),
        res = ''
    //split digit groups
    while (int.length > 3) {
        res = separator + int.substr(-3) + res
        int = int.substr(0, int.length - 3)
    }
    //strip negative sign
    if (int === '-') {
        res = res.substr(1)
    }
    res = int + res
    if (reminder) {
        res += '.' + reminder
    }
    if (trimTrailingZeros) {
        res = stripTrailingZeros(res)
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
    if (typeof value === 'number') {
        value = value.toFixed(14)
    }
    if (typeof value === 'string') {
        value = new Bignumber(value)
        if (value.isNaN()) return '0'
    }
    //use 7 decimals if not specified
    if (!(precision >= 0)) {
        precision = 7
    }
    return addDecimalsSeparators(value.toFixed(precision), separator)
}

export function formatWithAutoPrecision(value, separator = ',') {
    if (!value) return '0'
    if (typeof value === 'number') {
        value = value.toFixed(14)
    }
    if (typeof value === 'string') {
        value = new Bignumber(value)
    }
    let p = Math.ceil(Math.log10(value.toNumber())),
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

/**
 * Convert rational price representation to Number
 * @param {{n: Number, d: Number}} price
 * @return {Number}
 */
export function approximatePrice(price) {
    return price.n / price.d
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
export function adjustAmount(amount = '0') {
    if (typeof amount === 'number') {
        amount = amount.toFixed(7)
    } else {
        amount = new Bignumber(amount.toString()).toFixed(7)
    }
    return stripTrailingZeros(amount)
}