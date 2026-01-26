import {xdr} from '@stellar/stellar-base'

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
