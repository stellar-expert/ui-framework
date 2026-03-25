import {parseTxOperationsMeta} from '@stellar-expert/tx-meta-effects-parser'
import OperationDescriptor from './op-descriptor'
import TxMatcher from './tx-matcher'

/**
 * @typedef {Object} ParsedTxDetails - Parsed transaction
 * @property {OperationDescriptor[]} operations - Parsed operation descriptors
 * @property {Transaction|FeeBumpTransaction} tx - Parsed transaction
 * @property {string} txHash - Transaction hash
 * @property {string} context - Account address, asset name, offer id
 * @property {string} contextType - Resolved context type
 * @property {boolean} isEphemeral - True if transaction has not been submitted or rejected
 * @property {boolean} unmatched - Whether transaction matches context and filter
 * @property {boolean} [successful] - Whether the transaction has been executed successfully or failed during execution
 * @property {{}[]} [effects] - Transaction-level effects (including fee charges)
 * @property {string} [createdAt] - Ledger application timestamp
 */

/**
 * @typedef {Object} TxFiltersContext
 * @property {string[]} [type]
 * @property {string[]} [account]
 * @property {string[]} [source]
 * @property {string[]} [destination]
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
 * @param {String} [id] - Unique transaction id
 * @param {TxFiltersContext} [context] - Filters applied to transactions search
 * @param {String} [createdAt] - Ledger execution timestamp
 * @param {boolean} [skipUnrelated] - Ledger execution timestamp
 * @param {number} [protocol] – Specific Stellar protocol version for the executed transaction
 * @return {ParsedTxDetails}
 */
export function parseTxDetails({network, txEnvelope, result, meta, id, context, createdAt, skipUnrelated, protocol}) {
    const parsedTx = parseTxOperationsMeta({network, tx: txEnvelope, meta, result, protocol, processSystemEvents: true, processFailedOpEffects: true, mapSac: true})
    const {tx, effects, operations, isEphemeral, failed} = parsedTx
    const txHash = tx.hash().toString('hex')
    const txMatcher = new TxMatcher(context, skipUnrelated)
    let parsedOps = OperationDescriptor.parseOperations(operations, txHash, isEphemeral, !isEphemeral && !failed)
    //filter out irrelevant operations
    const matchedOps = parsedOps.filter(od => txMatcher.matchOperation(od))
    //display only relevant operations or all of them if no relevant operations found
    if (matchedOps.length) {
        parsedOps = matchedOps
    }
    const res = {
        operations: parsedOps,
        tx,
        txHash,
        context,
        isEphemeral,
        unmatched: !parsedOps.length
    }
    if (!isEphemeral) {
        res.effects = effects
    }
    if (createdAt) {
        res.createdAt = createdAt
    }
    if (!isEphemeral) {
        res.successful = !failed
    }
    if (id !== undefined) {
        res.id = id
    }
    for (let op of parsedOps) {
        op.tx = res
    }
    return res
}
