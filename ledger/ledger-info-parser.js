import {xdr} from '@stellar/stellar-base'

/**
 * @typedef {Object} LedgerInfo
 * @property {number} sequence - Ledger sequence number
 * @property {number} ts - Ledger close timestamp
 * @property {number} protocol - Protocol version
 * @property {number} operations - Number of successful operations
 * @property {number} failedOperations - Number of failed operations
 * @property {number} txSuccess - Number of successful transactions
 * @property {number} txFailed - Number of failed transactions
 * @property {BigInt} xlm - Total lumens in circulation
 * @property {BigInt} feePool - Fee pool amount
 * @property {number} baseFee - Base fee in stroops
 * @property {number} baseReserve - Base reserve in stroops
 */

/**
 * Parse raw ledger data including XDR header into structured ledger info
 * @param {Object} data - Raw ledger data from the API
 * @param {string} data.xdr - Base64-encoded XDR ledger header
 * @param {number} data.sequence - Ledger sequence number
 * @param {number} data.ts - Ledger close timestamp
 * @param {number} data.protocol - Protocol version
 * @param {number} [data.successful_operations] - Successful operation count
 * @param {number} [data.failed_operations] - Failed operation count
 * @param {number} [data.successful_transactions] - Successful transaction count
 * @param {number} [data.failed_transactions] - Failed transaction count
 * @return {LedgerInfo}
 */
export function retrieveLedgerInfo(data) {
    const parsed = xdr.LedgerHeader.fromXDR(data.xdr, 'base64')
    return {
        sequence: data.sequence,
        ts: data.ts,
        protocol: data.protocol,
        operations: data.successful_operations || 0,
        failedOperations: data.failed_operations || 0,
        txSuccess: data.successful_transactions,
        txFailed: data.failed_transactions,
        xlm: parsed.totalCoins().toBigInt(),
        feePool: parsed.feePool().toBigInt(),
        baseFee: parsed.baseFee(),
        baseReserve: parsed.baseReserve()
    }
}
