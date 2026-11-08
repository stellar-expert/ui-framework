import {LiquidityPoolAsset, StrKey, xdr} from '@stellar/stellar-sdk'
import {AssetDescriptor} from '../../asset-descriptor/index.js'
import {TypeFilterMatcher} from './type-filter-matcher'
import {retrieveClaimAtoms, retrieveInflationPayouts} from './tx-result-utils'

export default class TxMatcher {
    constructor(filters, skipUnrelated = false) {
        const matcherFilters = {}
        if (filters) {
            for (const key of ['account', 'source', 'destination', 'asset', 'src_asset', 'dest_asset', 'offer', 'pool']) {
                const values = filters[key]
                if (!values?.length)
                    continue
                matcherFilters[key] = values
                this.noFilters = false
            }
            this.typeMatcher = new TypeFilterMatcher(filters.type)
        }
        this.filters = matcherFilters
        this.skipUnrelated = skipUnrelated
    }

    /**
     * @type {{[type], [account], [source], [destination], [asset], [src_asset], [dest_asset], [offer], [pool]}}
     * @private
     */
    filters
    /**
     * @type {boolean}
     * @private
     */
    noFilters = true
    /**
     * @type {boolean}
     * @private
     */
    skipUnrelated
    /**
     * @type {TypeFilterMatcher}
     * @private
     */
    typeMatcher

    /**
     * @param {OperationDescriptor} od
     * @return {boolean}
     */
    matchOperation(od) {
        if (this.noFilters)
            return true
        if (!this.typeMatcher?.match(od.operation.type))
            return false
        if (!this.matchOperationProps(od))
            return false
        return true
    }

    /**
     * @param {TransactionBase} tx
     * @return {boolean}
     */
    matchTxFee(tx) {
        if (!this.filter.asset?.includes('XLM'))
            return false
        const feeSource = tx.feeSource ? tx.feeSource : tx.source
        if (this.filter.account?.includes(feeSource))
            return true
        return !this.skipUnrelated
    }

    /**
     * @param {OperationDescriptor} od
     * @return {boolean}
     * @private
     */
    matchOperationProps(od) {
        const matchingProps = this.prepareOperationMatchingProps(od)
        for (const [key, values] of Object.entries(this.filters)) {
            const options = matchingProps[key]
            if (!options)
                continue
            for (const value of values)
                if (options.has(value))
                    return true
        }
        return false
    }

    /**
     * @param {OperationDescriptor} od
     * @returns {{[account], [source], [destination], [asset], [src_asset], [dest_asset], [offer], [pool]}}
     * @private
     */
    prepareOperationMatchingProps(od) {
        const {filters, skipUnrelated} = this
        const {operation: op} = od
        const matchingProps = {}
        //process accounts
        if (filters.account || filters.destination) {
            switch (op.type) {
                case 'createAccount':
                case 'accountMerge':
                case 'payment':
                case 'pathPaymentStrictSend':
                case 'pathPaymentStrictReceive':
                    matchingProps.account = new Set([op.destination])
                    matchingProps.destination = new Set([op.destination])
                    break
                case 'inflation':
                    if (od.successful) {
                        const payouts = retrieveInflationPayouts(op.result)
                        if (payouts.length) {
                            matchingProps.account = new Set(payouts)
                            matchingProps.destination = new Set(payouts)
                        }
                    }
                    break
                case 'setOptions':
                    matchingProps.account = new Set()
                    if (!skipUnrelated) {
                        const optionsRelated = [op.inflationDest, op.signer?.key].filter(acc => !!acc)
                        if (optionsRelated.length) {
                            matchingProps.account.add(optionsRelated)
                        }
                    }
                    break
                case 'allowTrust':
                case 'setTrustLineFlags':
                    matchingProps.account = new Set([op.trustor])
                    matchingProps.destination = new Set([op.trustor])
                    break
                case 'createClaimableBalance':
                    if (!skipUnrelated) {
                        const indirect = op.claimants.map(c => c.destination)
                        if (indirect.length) {
                            matchingProps.account = new Set(...indirect)
                            matchingProps.destination = new Set(...indirect)
                        }
                    }
                    break
                case 'beginSponsoringFutureReserves':
                    matchingProps.account = new Set([op.sponsoredId])
                    matchingProps.destination = new Set([op.sponsoredId])
                    break
                case 'revokeAccountSponsorship':
                case 'revokeTrustlineSponsorship':
                case 'revokeOfferSponsorship':
                case 'revokeDataSponsorship':
                case 'revokeClaimableBalanceSponsorship':
                case 'revokeLiquidityPoolSponsorship':
                case 'revokeSignerSponsorship':
                case 'revokeSponsorship':
                    const revokedAccounts = [op.account, op.signer?.key, op.seller].filter(a => !!a)
                    if (revokedAccounts.length) {
                        matchingProps.account = new Set(revokedAccounts)
                        matchingProps.destination = new Set(revokedAccounts)
                    }
                    break
                case 'clawback':
                    matchingProps.account = new Set([op.from])
                    matchingProps.destination = new Set([op.from])
                    break
                case 'liquidityPoolDeposit':
                case 'liquidityPoolWithdraw':
                case 'claimClaimableBalance':
                case 'changeTrust':
                case 'manageBuyOffer':
                case 'manageSellOffer':
                case 'createPassiveSellOffer':
                case 'manageData':
                case 'bumpSequence':
                case 'endSponsoringFutureReserves':
                case 'clawbackClaimableBalance':
                case 'extendFootprintTtl':
                case 'restoreFootprint':
                case 'invokeHostFunction': //Soroban txs contain a single op, it's shown regardless of the match
                    matchingProps.account = new Set()
                    break
                default:
                    throw new Error('Unsupported op type: ' + op.type)
            }
            if (!matchingProps.account) {
                matchingProps.account = new Set()
            }
            if (!matchingProps.account.has(op.source)) {
                matchingProps.account.add(op.source)
            }
        }
        //add op source account
        matchingProps.source = new Set([op.source])
        //process assets
        if (filters.asset || filters.src_asset || filters.dest_asset)
            switch (op.type) {
                case 'createAccount':
                case 'accountMerge':
                case 'inflation':
                    matchingProps.asset = new Set(['XLM'])
                    matchingProps.src_asset = new Set(['XLM'])
                    matchingProps.dest_asset = new Set(['XLM'])
                    break
                case 'payment':
                case 'clawback':
                case 'setTrustLineFlags':
                case 'createClaimableBalance':
                case 'revokeAccountSponsorship':
                case 'revokeTrustlineSponsorship':
                case 'revokeOfferSponsorship':
                case 'revokeDataSponsorship':
                case 'revokeClaimableBalanceSponsorship':
                case 'revokeLiquidityPoolSponsorship':
                case 'revokeSignerSponsorship':
                case 'revokeSponsorship':
                    if (op.asset) {
                        const a = [AssetDescriptor.parse(op.asset).toFQAN()]
                        matchingProps.asset = new Set(a)
                        matchingProps.src_asset = new Set(a)
                        matchingProps.dest_asset = new Set(a)
                    }
                    break
                case 'changeTrust': {
                    const a = [AssetDescriptor.parse(op.line).toFQAN()]
                    matchingProps.dest_asset = new Set(a)
                    if (op.line instanceof LiquidityPoolAsset) {
                        a.push(AssetDescriptor.parse(op.line.assetA).toFQAN())
                        a.push(AssetDescriptor.parse(op.line.assetB).toFQAN())
                    }
                    matchingProps.asset = new Set(a)
                    matchingProps.src_asset = new Set(a)
                }
                    break
                case 'pathPaymentStrictSend':
                case 'pathPaymentStrictReceive': {
                    const src = AssetDescriptor.parse(op.sendAsset).toFQAN()
                    const dest = AssetDescriptor.parse(op.destAsset).toFQAN()
                    matchingProps.asset = new Set([src, dest, ...op.path.map(a => AssetDescriptor.parse(a).toFQAN())])
                    matchingProps.src_asset = new Set([src])
                    matchingProps.dest_asset = new Set([dest])
                }
                    break
                case 'manageBuyOffer':
                case 'manageSellOffer':
                case 'createPassiveSellOffer': {
                    const selling = AssetDescriptor.parse(op.selling).toFQAN()
                    const buying = AssetDescriptor.parse(op.buying).toFQAN()
                    matchingProps.asset = new Set([selling, buying])
                    matchingProps.src_asset = new Set([selling])
                    matchingProps.dest_asset = new Set([buying])
                }
                    break
                case 'allowTrust': {
                    const asset = AssetDescriptor.parse({code: op.assetCode, issuer: op.source}).toFQAN()
                    matchingProps.asset = new Set([asset])
                    matchingProps.src_asset = new Set([asset])
                    matchingProps.dest_asset = new Set([asset])
                }
                    break
                //liquidityPoolDeposit/liquidityPoolWithdraw reference only the pool id, so reserve assets are unknown
            }

        //process liquidity pools and offers
        if (filters.pool || filters.offer) {
            switch (op.type) {
                case 'liquidityPoolDeposit':
                case 'liquidityPoolWithdraw':
                case 'revokeLiquidityPoolSponsorship':
                    matchingProps.pool = new Set(poolIdForms(op.liquidityPoolId))
                    break
                case 'changeTrust':
                case 'revokeTrustlineSponsorship':
                    const asset = AssetDescriptor.parse(op.line || op.asset).toFQAN()
                    if (asset.length === 64 && !asset.includes('-')) {
                        matchingProps.pool = new Set(poolIdForms(asset))
                    }
                    break
                case 'manageBuyOffer':
                case 'manageSellOffer':
                case 'createPassiveSellOffer':
                case 'pathPaymentStrictSend':
                case 'pathPaymentStrictReceive':
                    if (od.successful) {
                        const offers = []
                        const pools = []
                        for (const atom of retrieveClaimAtoms(op.result)) {
                            if (atom.pool) {
                                pools.push(...poolIdForms(atom.pool))
                            }
                            if (atom.offer) {
                                offers.push(atom.offer)
                                if (!skipUnrelated) {
                                    if (!matchingProps.account) {
                                        matchingProps.account = new Set()
                                    }
                                    matchingProps.account.add(atom.seller)
                                }
                            }
                        }
                        if (offers.length) {
                            matchingProps.offer = new Set(offers)
                        }
                        if (pools.length) {
                            matchingProps.pool = new Set(pools)
                        }
                    }
                    if (op.offerId) {
                        if (!matchingProps.offer) {
                            matchingProps.offer = new Set()
                        }
                        if (!matchingProps.offer.has(op.offerId)) {
                            matchingProps.offer.add(op.offerId)
                        }
                    }
                    break
                case 'revokeOfferSponsorship':
                    matchingProps.offer = new Set([op.offerId])
                    break
                case 'clawback':
                    matchingProps.account = new Set([op.from])
                    matchingProps.destination = new Set([op.from])
                    break
            }
        }
        //TODO: handle trustline authorization effects (deauthorization may cancel offers and withdraw liquidity pool stakes)
        return matchingProps
    }
}

/**
 * Both representations of the liquidity pool id (filters may contain either of them)
 * @param {string} poolId - Pool id as hex hash or L-strkey
 * @return {string[]}
 */
function poolIdForms(poolId) {
    try {
        return poolId.startsWith('L') ?
            [poolId, xdr.encodeBytes(StrKey.decodeLiquidityPool(poolId), 'hex')] :
            [poolId, StrKey.encodeLiquidityPool(xdr.decodeBytes(poolId, 'hex'))]
    } catch (e) {
        console.warn('Invalid liquidity pool id: ' + poolId)
        return [poolId]
    }
}

/**
 * Callback for matching operation by type
 * @callback TypeMatcherCallback
 * @param {OperationDescriptor} op - Operation descriptor to match
 * @return {boolean}
 * @internal
 */