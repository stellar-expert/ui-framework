import {parseTxOperationsMeta} from '@stellar-expert/tx-meta-effects-parser'
import OperationDescriptor from './op-descriptor'
import TxMatcher from './tx-matcher'

/**
 * @typedef {Object} ParsedTxDetails - Parsed transaction
 * @property {OperationDescriptor[]} operations - Parsed operation descriptors
 * @property {Transaction|FeeBumpTransaction} tx - Parsed transaction
 * @property {String} txHash - Transaction hash
 * @property {String} context - Account address, asset name, offer id
 * @property {String} contextType - Resolved context type
 * @property {Boolean} isEphemeral - True if transaction has not been submitted or rejected
 * @property {Boolean} unmatched - Whether transaction matches context and filter
 * @property {Boolean} [successful] - Whether the transaction has been executed successfully or failed during execution
 * @property {{}[]} [txEffects] - Transaction-level effects (fee charges)
 * @property {String} [createdAt] - Ledger application timestamp
 */

/**
 * @typedef {Object} TxFiltersContext
 * @property {String[]} [type]
 * @property {String[]} [account]
 * @property {String[]} [source]
 * @property {String[]} [destination]
 * @property {String[]} [asset]
 * @property {String[]} [src_asset]
 * @property {String[]} [dest_asset]
 * @property {String[]} [offer]
 * @property {String[]} [pool]
 */

/**
 * Parse tx details from raw envelope, result, and meta
 * @param {String} network - Network passphrase or identifier
 * @param {String} tx - Base64-encoded tx envelope xdr
 * @param {String} [result] - Base64-encoded tx envelope result
 * @param {String} [meta] - Base64-encoded tx envelope meta
 * @param {TxFiltersContext} [context] - Filters applied to transactions search
 * @param {String} [createdAt] - Ledger execution timestamp
 * @param {Boolean} [skipUnrelated] - Ledger execution timestamp
 * @return {ParsedTxDetails}
 */
export function parseTxDetails({network, txEnvelope, result, meta, context, createdAt, skipUnrelated}) {
    const {tx, fee, operations, isEphemeral, failed} = parseTxOperationsMeta({network, tx: txEnvelope, meta, result})
    //const txEffects = effects.filter(e => contextType === 'none' || contextType === 'asset' && context === 'XLM' || contextType === 'account' && context === e.source)
    const txHash = tx.hash().toString('hex')
    const txMatcher = new TxMatcher(context, skipUnrelated)
    const parsedOps = OperationDescriptor.parseOperations(operations, txHash, isEphemeral, !isEphemeral && !failed)
        .filter(od => txMatcher.matchOperation(od))

    const res = {
        operations: parsedOps,
        tx,
        txHash,
        context,
        isEphemeral,
        unmatched: !parsedOps.length// && !txEffects.length,
    }
    if (createdAt) {
        res.createdAt = createdAt
    }
    if (!isEphemeral) {
        res.successful = !failed
    }
    for (let op of parsedOps) {
        op.tx = res
    }
    return res
}
