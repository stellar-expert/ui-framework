import Bignumber from 'bignumber.js'

/**
 * @typedef {Object} ParsedStellarId
 * @property {('unknown'|'ledger'|'transaction'|'operation')} type - Parsed id type
 * @property {String} [id] - Parsed id
 * @property {Number} [ledger] - Ledger sequence
 * @property {String} [tx] - Transaction id
 * @property {Number} [operationOrder] - Operation order within a transaction
 */

/**
 * Parse stellar generic id
 * @param {String} id
 * @returns {ParsedStellarId}
 */
export function parseStellarGenericId(id) {
    if (!/^\d{1,19}$/.test(id)) return {type: 'unknown'}
    let parsed = new Bignumber(id),
        ledger = parsed.idiv(4294967296),
        opOrder = parsed.mod(4096)

    const res = {
        id,
        type: 'unknown',
        ledger: ledger.toNumber()
    }

    if (opOrder > 0) {
        res.type = 'operation'
        res.tx = parsed.minus(opOrder).toString()
        res.operationOrder = opOrder.toNumber()
    } else if (ledger.eq(id)) {
        res.type = 'ledger'
    } else {
        res.type = 'transaction'
        res.tx = parsed.toString()
    }

    return res
}