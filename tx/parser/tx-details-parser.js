import {TransactionBuilder, xdr} from '@stellar/stellar-sdk'
import OperationDescriptor from './op-descriptor'
import TxMatcher from './tx-matcher'
import {parseTxResult, buildFeeChargedEffect} from './tx-result-utils'

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
 * @property {{}[]} [effects] - Transaction-level effects (fee charge built from the result, replaced by server effects once loaded)
 * @property {boolean} [effectsLoaded] - Whether operation effects have been retrieved from the server
 * @property {boolean} [effectsUnavailable] - Whether the server failed to parse effects for this transaction
 * @property {string} [createdAt] - Ledger application timestamp
 */

/**
 * @typedef {Object} TxEffects - Effects returned by the `tx/:id?effects=true` API endpoint
 * @property {{}[]} tx - Transaction-level effects
 * @property {{}[][]} operations - Effects of each operation, index-aligned with transaction operations
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
 * Parse tx details from raw envelope and result (effects are attached separately)
 * @param {String} network - Network passphrase
 * @param {String} txEnvelope - Base64-encoded tx envelope xdr
 * @param {String} [result] - Base64-encoded tx result xdr
 * @param {String} [meta] - Base64-encoded tx meta xdr (only its presence is checked to distinguish executed transactions)
 * @param {TxEffects|null} [effects] - Effects retrieved from the server, if available
 * @param {String} [id] - Unique transaction id
 * @param {TxFiltersContext} [context] - Filters applied to transactions search
 * @param {String} [createdAt] - Ledger execution timestamp
 * @param {boolean} [skipUnrelated] - Whether to skip operations indirectly related to the context
 * @return {ParsedTxDetails}
 */
export function parseTxDetails({network, txEnvelope, result, meta, effects, id, context, createdAt, skipUnrelated}) {
    const tx = TransactionBuilder.fromXdr(txEnvelope, network)
    const innerTx = tx.innerTransaction || tx
    const isEphemeral = !meta
    const txHash = xdr.encodeBytes(tx.hash(), 'hex')
    let txResult
    if (!isEphemeral) {
        txResult = parseTxResult(result)
    }
    //operation objects are cached by the SDK, so tx.operations returns the same normalized instances
    const {operations} = innerTx
    for (let i = 0; i < operations.length; i++) {
        const op = operations[i]
        if (!op.source) {
            op.source = innerTx.source
        }
        op.effects = []
        op.result = txResult?.opResults[i]
    }
    const res = {
        tx,
        txHash,
        context,
        isEphemeral
    }
    if (!isEphemeral) {
        res.successful = txResult.successful
        res.effects = [buildFeeChargedEffect(tx, txResult.feeCharged)]
    }
    const txMatcher = new TxMatcher(context, skipUnrelated)
    let parsedOps = OperationDescriptor.parseOperations(operations, txHash, isEphemeral, !isEphemeral && res.successful)
    //filter out irrelevant operations
    const matchedOps = parsedOps.filter(od => txMatcher.matchOperation(od))
    //display only relevant operations or all of them if no relevant operations found
    if (matchedOps.length) {
        parsedOps = matchedOps
    }
    res.operations = parsedOps
    res.unmatched = !parsedOps.length
    if (createdAt) {
        res.createdAt = createdAt
    }
    if (id !== undefined) {
        res.id = id
    }
    for (const op of parsedOps) {
        op.tx = res
    }
    if (!isEphemeral && effects !== undefined) {
        applyTxEffects(res, effects)
    }
    return res
}

/**
 * Attach effects retrieved from the server to the parsed transaction
 * @param {ParsedTxDetails} parsedTx - Parsed transaction to update in place
 * @param {TxEffects|null} effects - Server effects; null if the server failed to parse them
 */
export function applyTxEffects(parsedTx, effects) {
    parsedTx.effectsLoaded = true
    if (!effects) {
        parsedTx.effectsUnavailable = true
        return
    }
    const {operations} = parsedTx.tx.innerTransaction || parsedTx.tx
    for (let i = 0; i < operations.length; i++) {
        operations[i].effects = effects.operations[i] || []
    }
    if (effects.tx?.length) {
        parsedTx.effects = effects.tx
    }
}
