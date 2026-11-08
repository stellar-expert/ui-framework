import {StrKey, xdr} from '@stellar/stellar-sdk'

/**
 * @typedef {Object} ParsedTxResult
 * @property {boolean} successful - Whether the transaction (inner transaction for fee bumps) has been executed successfully
 * @property {string} feeCharged - Fee charged, in stroops
 * @property {xdr.OperationResult[]} opResults - Raw operation results (empty for txs rejected before execution)
 */

/**
 * @typedef {Object} ClaimAtomInfo - Offer or liquidity pool crossed during a DEX trade
 * @property {string} [offer] - Matched offer id
 * @property {string} [seller] - Matched offer owner
 * @property {string} [pool] - Matched liquidity pool id (L-strkey)
 */

/**
 * Parse transaction result XDR
 * @param {string|xdr.TransactionResult} result - Base64-encoded TransactionResult or TransactionResultPair XDR
 * @return {ParsedTxResult}
 */
export function parseTxResult(result) {
    const txResult = decodeTxResult(result)
    let inner = txResult.result
    const successful = xdr.TransactionResultCode[inner.type].value >= 0
    if (inner.type === 'txFeeBumpInnerSuccess' || inner.type === 'txFeeBumpInnerFailed') {
        inner = inner.innerResultPair.result.result
    }
    return {
        successful,
        feeCharged: txResult.feeCharged.toString(),
        opResults: inner.results || []
    }
}

/**
 * Build tx-level fee charge effect from the transaction and its result
 * @param {Transaction|FeeBumpTransaction} tx - Parsed transaction
 * @param {string} feeCharged - Charged fee from the transaction result
 * @return {{type: 'feeCharged', source: string, asset: 'XLM', bid: string, charged: string, bump?: boolean}}
 */
export function buildFeeChargedEffect(tx, feeCharged) {
    const isFeeBump = !!tx.innerTransaction
    const effect = {
        type: 'feeCharged',
        source: isFeeBump ? tx.feeSource : tx.source,
        asset: 'XLM',
        bid: tx.fee,
        charged: feeCharged
    }
    if (isFeeBump) {
        effect.bump = true
    }
    return effect
}

/**
 * Retrieve offers and liquidity pools crossed by a DEX operation
 * @param {xdr.OperationResult} [opResult]
 * @return {ClaimAtomInfo[]}
 */
export function retrieveClaimAtoms(opResult) {
    const res = unwrapOpResult(opResult)
    switch (res?.type) {
        case 'manageSellOfferSuccess':
        case 'manageBuyOfferSuccess':
            return res.value.offersClaimed.map(parseClaimAtom)
        case 'pathPaymentStrictReceiveSuccess':
        case 'pathPaymentStrictSendSuccess':
            return res.value.offers.map(parseClaimAtom)
        default:
            return []
    }
}

/**
 * Retrieve actual amounts sent and received by a successful path payment
 * @param {xdr.OperationResult} [opResult]
 * @return {{sent: string, received: string}|null} - Amounts in stroops
 */
export function retrievePathPaymentAmounts(opResult) {
    const res = unwrapOpResult(opResult)
    if (res?.type !== 'pathPaymentStrictReceiveSuccess' && res?.type !== 'pathPaymentStrictSendSuccess')
        return null
    const {offers, last} = res.value
    const received = last.amount.toString()
    if (!offers.length) //direct payment without conversion
        return {sent: received, received}
    //the first hop of the path consists of the leading claim atoms that bought the sent asset
    const sentAsset = offers[0].value.assetBought.toXdr('base64')
    let sent = 0n
    for (const atom of offers) {
        if (atom.value.assetBought.toXdr('base64') !== sentAsset)
            break
        sent += BigInt(atom.value.amountBought)
    }
    return {sent: sent.toString(), received}
}

/**
 * Retrieve id of the claimable balance created by the operation
 * @param {xdr.OperationResult} [opResult]
 * @return {string|undefined} - Claimable balance id in StrKey format
 */
export function retrieveClaimableBalanceId(opResult) {
    const res = unwrapOpResult(opResult)
    if (res?.type !== 'createClaimableBalanceSuccess')
        return undefined
    //StrKey payload: claimable balance id type byte (0 for v0) followed by the balance hash
    const raw = new Uint8Array(33)
    raw.set(toBytes(res.value.value), 1)
    return StrKey.encodeClaimableBalance(raw)
}

/**
 * Retrieve accounts that received inflation payouts
 * @param {xdr.OperationResult} [opResult]
 * @return {string[]}
 */
export function retrieveInflationPayouts(opResult) {
    const res = unwrapOpResult(opResult)
    if (res?.type !== 'inflationSuccess')
        return []
    return res.value.map(payout => encodeAccountId(payout.destination))
}

/**
 * Decode TransactionResult or TransactionResultPair XDR
 * @param {string|xdr.TransactionResult} result
 * @return {xdr.TransactionResult}
 * @private
 */
function decodeTxResult(result) {
    if (typeof result !== 'string')
        return result
    try {
        return xdr.TransactionResult.fromXdr(result, 'base64')
    } catch (e) {
        return xdr.TransactionResultPair.fromXdr(result, 'base64').result
    }
}

/**
 * Retrieve operation-specific result union from a raw operation result
 * @param {xdr.OperationResult} [opResult]
 * @return {*}
 * @private
 */
function unwrapOpResult(opResult) {
    if (opResult?.type !== 'opInner')
        return undefined
    return opResult.tr.value
}

/**
 * @param {xdr.ClaimAtom} atom
 * @return {ClaimAtomInfo}
 * @private
 */
function parseClaimAtom(atom) {
    const {value} = atom
    switch (atom.type) {
        case 'claimAtomTypeV0':
            return {offer: value.offerId.toString(), seller: StrKey.encodeEd25519PublicKey(toBytes(value.sellerEd25519))}
        case 'claimAtomTypeOrderBook':
            return {offer: value.offerId.toString(), seller: encodeAccountId(value.sellerId)}
        case 'claimAtomTypeLiquidityPool':
            return {pool: StrKey.encodeLiquidityPool(toBytes(value.liquidityPoolId))}
        default:
            throw new Error('Unsupported claim atom type: ' + atom.type)
    }
}

/**
 * @param {xdr.AccountId} accountId
 * @return {string}
 * @private
 */
function encodeAccountId(accountId) {
    return StrKey.encodeEd25519PublicKey(toBytes(accountId.ed25519))
}

/**
 * Unwrap raw bytes from XDR opaque wrappers (Hash, PoolId, Uint256Bytes)
 * @param {Uint8Array|{value: Uint8Array}} value
 * @return {Uint8Array}
 * @private
 */
function toBytes(value) {
    return value instanceof Uint8Array ? value : value.value
}
