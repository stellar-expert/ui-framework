import {xdr} from '@stellar/stellar-base'

export function retrieveLedgerInfo(data) {
    const parsed = xdr.LedgerHeader.fromXDR(data.xdr, 'base64')
    return {
        sequence: data.sequence,
        ts: data.ts,
        protocol: data.protocol,
        operations: data.operations || 0,
        txSuccess: data.txSuccess,
        txFailed: data.txFailed,
        xlm: parsed.totalCoins().toBigInt(),
        feePool: parsed.feePool().toBigInt(),
        baseFee: parsed.baseFee(),
        baseReserve: parsed.baseReserve()
    }
}
