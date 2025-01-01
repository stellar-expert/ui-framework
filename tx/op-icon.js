import React from 'react'
import cn from 'classnames'

const opIconMapping = {
    feeCharge: 'send-circle',
    createAccount: 'hexagon-add',
    payment: 'send-circle',
    paymentReceive: 'receive-circle',
    pathPaymentStrictReceive: 'swap',
    manageSellOffer: 'dex-offer',
    createPassiveSellOffer: 'dex-offer',
    setOptions: 'hexagon-set-options',
    changeTrust: 'trustlines',
    changeTrustAdd: 'create-trustline',
    changeTrustRemove: 'remove-trustline',
    changeTrustUpdate: 'trustline-flags',
    allowTrust: 'trustline-flags',
    accountMerge: 'hexagon-remove',
    accountMergeReceive: 'receive-circle',
    inflation: 'hexagon-inflation',
    manageData: 'grid',
    manageDataAdd: 'grid-add',
    manageDataRemove: 'grid-remove',
    bumpSequence: 'upload',
    manageBuyOffer: 'dex-offer',
    pathPaymentStrictSend: 'swap',
    createClaimableBalance: 'shutdown-circle',
    claimClaimableBalance: 'icon-ok',
    claimClaimableBalanceReceive: 'receive-circle',
    beginSponsoringFutureReserves: 'sponsor',
    endSponsoringFutureReserves: 'sponsor',
    revoke: 'revoke',
    revokeAccountSponsorship: 'revoke',
    revokeTrustlineSponsorship: 'revoke',
    revokeOfferSponsorship: 'revoke',
    revokeDataSponsorship: 'revoke',
    revokeClaimableBalanceSponsorship: 'revoke',
    revokeLiquidityPoolSponsorship: 'revoke',
    revokeSignerSponsorship: 'revoke',
    clawback: 'clawback',
    clawbackReceive: 'send-circle',
    clawbackClaimableBalance: 'icon-ok',
    setTrustLineFlags: 'trustline-flags',
    liquidityPoolDeposit: 'droplet',
    liquidityPoolWithdraw: 'droplet-half',
    invokeHostFunction: 'flash',
    extendFootprintTtl: 'upload',
    restoreFootprint: 'upload'
}

/**
 * Transaction operation icon
 * @param {OperationDescriptor|'feeCharge'} op - Operation descriptor
 * @param {Boolean} failed - Whether the transaction failed during execution
 * @constructor
 */
export const OpIcon = React.memo(function OpIcon({op, failed = false}) {
    let type
    let title
    if (op === 'feeCharge') {
        type = 'feeCharge'
        title = 'Transaction fees charge'
    } else {
        const {operation} = op
        title = type = operation.type
        title = title[0].toUpperCase() + title.substring(1) + ' operation'
        switch (type) {
            case 'payment':
            case 'accountMerge':
            case 'claimClaimableBalance':
            case 'clawback':
                if (!op.context?.account?.includes(operation.source)) {
                    type += 'Receive'
                }
                break
            case 'manageData':
                if (operation.effects.some(e => e.type === 'dataEntryCreated')) {
                    type += 'Add'
                } else if (operation.effects.some(e => e.type === 'dataEntryRemoved')) {
                    type += 'Remove'
                }
                break
            case 'changeTrust':
                if (operation.limit > 0) {
                    type += 'Add'
                } else {
                    type += 'Remove'
                }
                break
        }
    }
    if (failed) {
        title += ' - Transaction failed'
    }
    const icon = opIconMapping[type]
    return <div className={cn('op-icon', {failed})} title={title}>
        <i className={`icon-${icon}`}/>
    </div>
})