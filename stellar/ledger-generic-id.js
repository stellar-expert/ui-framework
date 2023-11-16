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
    const parsed = BigInt(id)
    const res = {
        id,
        type: 'unknown'
    }
    if (parsed < 4294967296n) {
        res.type = 'ledger'
        res.ledger = Number(parsed)
        return res
    }
    const ledger = parsed / 4294967296n
    const opOrder = parsed % 4096n
    res.ledger = Number(ledger)
    if (opOrder > 0n) {
        res.type = 'operation'
        res.tx = (parsed - opOrder).toString()
        res.operationOrder = Number(opOrder)
    } else {
        res.type = 'transaction'
        res.tx = parsed.toString()
    }

    return res
}