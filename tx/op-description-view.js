import React from 'react'
import {Networks, AuthRequiredFlag, AuthRevocableFlag, AuthClawbackEnabledFlag, AuthImmutableFlag} from '@stellar/stellar-base'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {formatPrice, formatWithAutoPrecision, fromStroops, toStroops, shortenString} from '@stellar-expert/formatter'
import {xdrParserUtils, contractPreimageEncoder} from '@stellar-expert/tx-meta-effects-parser'
import {AccountAddress} from '../account/account-address'
import {AccountIdenticon} from '../account/identicon'
import {SignerKey} from '../account/signer-key'
import {Amount} from '../asset/amount'
import {AssetLink} from '../asset/asset-link'
import {useAssetMeta} from '../asset/asset-meta-hooks'
import {OfferLink} from '../ledger/ledger-entry-link'
import {formatExplorerLink} from '../ledger/ledger-entry-href-formatter'
import {ClaimableBalanceClaimants} from '../claimable-balance/claimable-balance-claimants'
import {CopyToClipboard} from '../interaction/copy-to-clipboard'
import {useStellarNetwork} from '../state/stellar-network-hooks'
import InvocationInfoView from '../contract/invocation-info-view'
import {ClaimableBalanceId} from '../claimable-balance/claimable-balance-id'

function getAccountPredefinedDisplayName(address) {
    if (!window.predefinedAccountDisplayNames)
        return undefined
    return window.predefinedAccountDisplayNames[address]
}

/**
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function OpSourceAccount({op, compact}) {
    const network = useStellarNetwork()
    const {source} = op.operation
    const txSource = op.tx.tx.source
    if (op.isEphemeral && (!source || source === txSource))
        return null
    const predefined = getAccountPredefinedDisplayName(source)
    const accountItem = predefined ?
        <a href={formatExplorerLink('account', source, network)} target="_blank" rel="nofollow noreferrer">
            <AccountIdenticon address={source}/> {predefined}
        </a> :
        <AccountAddress account={source}/>

    if (!op.isEphemeral)
        return accountItem
    return <> for account {accountItem}</>
}


/**
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function CreateAccountDescriptionView({op, compact}) {
    const {destination, startingBalance} = op.operation
    return op.isEphemeral ? <>
        <b>Create account</b> <AccountAddress account={destination}/>{' '}
        with starting balance <Amount amount={startingBalance} asset="XLM" issuer={!compact}/>
        <OpSourceAccount op={op}/>
    </> : <>
        <OpSourceAccount op={op}/> created account <AccountAddress account={destination}/>{' '}
        with starting balance <Amount amount={startingBalance} asset="XLM" issuer={!compact}/>
    </>
}

/**
 * Type: 1
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function PaymentDescriptionView({op, compact}) {
    const {destination, asset, amount} = op.operation
    return op.isEphemeral ? <>
        <b>Send</b> <Amount amount={amount} asset={asset}/> to <AccountAddress account={destination}/>
        <OpSourceAccount op={op}/>
    </> : <>
        <OpSourceAccount op={op}/> sent{' '}
        <Amount amount={amount} asset={AssetDescriptor.parse(asset)} issuer={!compact}/> to{' '}
        <AccountAddress account={destination}/>
    </>
}

/**
 * Type: 2, 13
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function PathPaymentDescriptionView({op, compact}) {
    let {source, destination, sendAsset, sendMax, sendAmount, destAsset, destAmount, destMin, path, effects} = op.operation
    const isSwap = source === destination
    let src = sendAmount || sendMax
    let dst = destAmount || destMin
    sendAsset = AssetDescriptor.parse(sendAsset)
    destAsset = AssetDescriptor.parse(destAsset)
    const sendAssetId = sendAsset.toFQAN()
    const destAssetId = destAsset.toFQAN()
    const pathData = <>
        <i className="icon icon-shuffle color-primary"/>{' '}
        {!compact && path.map((asset, i) => <span key={i + '-' + asset.toString()}>
            <AssetLink asset={asset}/> <i className="icon icon-shuffle color-primary"/>{' '}
        </span>)}
    </>
    if (op.isEphemeral)
        return <>
            <b>{isSwap ? 'Swap' : 'Send'}</b> <Amount amount={src} asset={sendAsset} issuer={!compact}/>{' '}
            {pathData}
            <Amount amount={dst} asset={destAsset} issuer={!compact}/>
            {!isSwap && <> to <AccountAddress account={destination}/></>}
            <OpSourceAccount op={op}/>
        </>
    if (sendMax !== undefined) {
        if (isSwap && sendAssetId === destAssetId && effects.length) { //circular trades yield accountCredited/Debited effect
            const changeEffect = effects.find(e => e.source === source && e.asset === sendAssetId && (e.type === 'accountCredited' || e.type === 'accountDebited'))
            if (changeEffect) { //arbitrage successful, otherwise src = dst and no account changes happened
                const change = BigInt(changeEffect.amount)
                src = fromStroops(toStroops(destAmount) + (changeEffect.type === 'accountCredited' ? -change : change))
            }
        } else {
            const debitedEffect = effects.find(e => e.source === source && e.type === 'accountDebited' && e.asset === sendAssetId)
            if (debitedEffect) {
                src = fromStroops(debitedEffect.amount)
            }
        }
    }
    if (destMin !== undefined) {
        if (isSwap && sendAssetId === destAssetId && effects.length) { //circular trades yield accountCredited/Debited effect
            const changeEffect = effects.find(e => e.source === source && e.asset === destAssetId && (e.type === 'accountCredited' || e.type === 'accountDebited'))
            if (changeEffect) { //arbitrage successful, otherwise src = dst and no account changes happened
                const change = BigInt(changeEffect.amount)
                dst = fromStroops(toStroops(sendAmount) + (changeEffect.type === 'accountCredited' ? change : -change))
            }
        } else {
            const creditedEffect = effects.find(e => e.source === destination && e.type === 'accountCredited' && e.asset === destAssetId)
            if (creditedEffect) {
                dst = fromStroops(creditedEffect.amount)
            }
        }
    }
    return <>
        <OpSourceAccount op={op}/> {isSwap ? 'swapped ' : 'sent '}
        <Amount amount={src} asset={sendAsset} issuer={!compact}/>{' '}
        {!compact && sendMax > 0 && op.successful && <><span className="dimmed nowrap">
            (max <Amount amount={sendMax} asset={AssetDescriptor.parse(sendAsset)}/>)
        </span> </>}
        {pathData}
        <Amount amount={dst} asset={destAsset} issuer={!compact}/>{' '}
        {!compact && destMin > 0 && op.successful && <><span className="dimmed nowrap">
            (min <Amount amount={destMin} asset={destAsset}/>)
        </span> </>}
        {!isSwap && <>to <AccountAddress account={destination}/></>}
    </>
}

/**
 * Type: 3, 4, 12
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function ManageOfferDescriptionView({op, compact}) {
    let {offerId, amount, buyAmount, selling, buying, price, type} = op.operation
    const passive = type === 'createPassiveSellOffer'
    const isCancelled = !passive && offerId > 0 && parseFloat(amount || buyAmount) === 0

    const direction = type === 'manageBuyOffer' ? ' buy' : ' sell'
    let description = ''
    if (offerId > 0) { //manage existing offer
        description = 'Update'
    } else {
        description = 'Create'
    }
    if (!op.isEphemeral) {
        description += 'd'
    }
    if (passive) {
        description += ' passive'
    }
    description += direction + ' offer'
    const amountInfo = <>
        {amount !== undefined ?
            <Amount amount={amount} asset={selling} issuer={!compact}/> :
            <AssetLink asset={selling} issuer={!compact}/>}{' '}
        <i className="icon icon-shuffle color-primary"/>{' '}
        {buyAmount !== undefined ?
            <Amount amount={buyAmount} asset={buying} issuer={!compact}/> :
            <AssetLink asset={buying} issuer={!compact}/>}{' '}
        at <span className="nowrap">
            {formatWithAutoPrecision(parseFloat(price))} {AssetDescriptor.parse(buying).toCurrency()}/{AssetDescriptor.parse(selling).toCurrency()}
        </span>
    </>
    if (op.isEphemeral) {
        if (isCancelled)
            return <>
                <b>Cancel DEX offer</b> #<OfferLink offer={offerId}/><OpSourceAccount op={op}/>
            </>
        return <>
            <b>{description}</b> {offerId > 0 && <>#<OfferLink offer={offerId}/></>} {amountInfo}<OpSourceAccount op={op}/>
        </>
    }

    if (isCancelled)
        return <>
            <OpSourceAccount op={op}/> cancelled DEX offer <OfferLink offer={offerId}/>
        </>
    return <>
        <OpSourceAccount op={op}/> {description.toLowerCase()} {offerId > 0 && <OfferLink offer={offerId}/>} {amountInfo}
    </>
}

function AccountFlags({flags}) {
    if (!flags)
        return null
    const res = []
    if (flags & AuthRequiredFlag) {
        res.push('auth_required')
    }
    if (flags & AuthRevocableFlag) {
        res.push('auth_revocable')
    }
    if (flags & AuthImmutableFlag) {
        res.push('auth_immutable')
    }
    if (flags & AuthClawbackEnabledFlag) {
        res.push('auth_clawback_enabled')
    }
    return <>
        {res.map((f, i) => <span key={f}>{i > 0 && <>, </>}<code>{f}</code></span>)} flag{res.length > 1 && <>s</>}
    </>
}

/**
 * Type: 5
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function SetOptionsDescriptionView({op, compact}) {
    const {
        setFlags,
        clearFlags,
        homeDomain,
        inflationDest,
        lowThreshold,
        medThreshold,
        highThreshold,
        signer,
        masterWeight,
        order,
        txHash
    } = op.operation

    const settings = []
    if (!!setFlags) {
        settings.push(<>Set <AccountFlags flags={setFlags}/></>)
    }
    if (!!clearFlags) {
        settings.push(<>Unset <AccountFlags flags={clearFlags}/></>)
    }
    if (homeDomain !== undefined) {
        settings.push(homeDomain ? <>Set home domain <code className="nowrap">{homeDomain}</code></> : <>Reset home domain</>)
    }
    if (inflationDest !== undefined) {
        settings.push(<>Set inflation destination to <AccountAddress account={inflationDest}/></>)
    }
    if (lowThreshold !== undefined || medThreshold !== undefined || highThreshold !== undefined) {
        const thresholds = []
        if (lowThreshold !== undefined) {
            thresholds.push('low=' + lowThreshold)
        }
        if (medThreshold !== undefined) {
            thresholds.push('medium=' + medThreshold)
        }
        if (highThreshold !== undefined) {
            thresholds.push('high=' + highThreshold)
        }
        settings.push(<>Set thresholds {thresholds.map((t, i) => <span key={i + t}>{i > 0 && <>, </>}<code>{t}</code></span>)}</>)
    }
    if (masterWeight !== undefined) {
        settings.push(<>Set master key weight to <code>{masterWeight}</code></>)
    }
    if (signer !== undefined) {
        if (signer.weight > 0) {
            settings.push(<>Add account signer <SignerKey signer={signer}/></>)
        } else {
            settings.push(<>Remove account signer <SignerKey signer={signer} showWeight={false}/></>)
        }
    }
    const details = <div className="block-indent text-small">
        {settings.map((s, i) => <div key={txHash + order + i}>{s}</div>)}
    </div>
    if (op.isEphemeral)
        return <>
            <b>Set account options</b><OpSourceAccount op={op}/>
            {details}
        </>
    return <>
        <OpSourceAccount op={op}/> updated account options.
        <div className="block-indent">
            {details}
        </div>
    </>
}

/**
 * Type: 6
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function ChangeTrustDescriptionView({op, compact}) {
    const {line, limit, effects} = op.operation
    const trustAsset = AssetDescriptor.parse(line)
    const established = limit > 0
    if (op.isEphemeral) {
        if (established)
            return <>
                <b>Establish trustline</b> to <AssetLink asset={trustAsset} issuer={!compact}/>
                {limit !== '922337203685.4775807' && <> with limit <Amount amount={limit} asset={trustAsset} issuer={!compact}/></>}
                <OpSourceAccount op={op}/>
            </>
        return <>
            <b>Remove trustline</b> to <AssetLink asset={trustAsset} issuer={!compact}/><OpSourceAccount op={op}/>
        </>
    }
    if (established) {
        const description = effects.some(e => e.type === 'trustlineCreated') ? 'established' : 'updated'
        return <>
            <OpSourceAccount op={op}/> {description} trustline to <AssetLink asset={line} issuer={!compact}/>
            {limit !== '922337203685.4775807' && <> with limit <Amount amount={limit} asset={line} issuer={!compact}/></>}
        </>
    }
    return <>
        <OpSourceAccount op={op}/> removed trustline to <AssetLink asset={line} issuer={!compact}/>
    </>
}

/**
 * Type: 7
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function AllowTrustDescriptionView({op, compact}) {
    const {source, assetCode, trustor, authorize} = op.operation
    const asset = AssetDescriptor.parse({code: assetCode, issuer: source})

    let description = authorize ? 'Authorize' : 'Deauthorize'
    if (op.isEphemeral)
        return <>
            <b>{description} trustline</b> <AssetLink asset={asset} issuer={!compact}/> for account <AccountAddress account={trustor}/>
            <OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> {description.toLowerCase() + 'd'} trustline{' '}
        <AssetLink asset={asset} issuer={!compact}/> for account <AccountAddress account={trustor}/>
    </>
}

/**
 * Type: 8
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function MergeAccountDescriptionView({op, compact}) {
    const {destination} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Merge account</b> <OpSourceAccount op={op}/> into account <AccountAddress account={destination}/>
            <OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> merged into account <AccountAddress account={destination}/>
    </>
}

/**
 * Type: 9
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function InflationDescriptionView({op, compact}) {
    if (op.isEphemeral)
        return <>
            <b>Initiate inflation</b><OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> initiated inflation
    </>
}

/**
 * Type: 10
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function ManageDataDescriptionView({op, compact}) {
    const {name, value, effects} = op.operation
    const dataEntryDesc = <span className="word-break condensed text-small">
        <code>"{name}"</code>
        {!!value && <> = <code>"{value.toString()}"</code></>}
    </span>

    if (op.isEphemeral) {
        const descr = !value ? 'Delete' : 'Set'
        return <>
            <b>{descr} data entry</b> {dataEntryDesc}<OpSourceAccount op={op}/>
        </>
    }
    let descr = !value ? 'deleted' : 'set'
    if (effects.some(e => e.type === 'dataEntryUpdated')) {
        descr = 'updated'
    }
    return <>
        <OpSourceAccount op={op}/> {descr} data entry {dataEntryDesc}
    </>
}

/**
 * Type: 11
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function BumpSequenceDescriptionView({op, compact}) {
    const {bumpTo} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Bump account sequence</b> to {bumpTo}<OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> bumped account sequence to {bumpTo}
    </>
}

/**
 * Type: 14
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function CreateClaimableBalanceDescriptionView({op, compact}) {
    const {asset, amount, claimants, effects} = op.operation
    const balanceId = effects.find(e => e.type === 'claimableBalanceCreated')?.balance
    if (op.isEphemeral)
        return <>
            <b>Create claimable balance</b> <Amount amount={amount} asset={AssetDescriptor.parse(asset)} issuer={!compact}/>
            <ClaimableBalanceId balance={balanceId}/>
            <OpSourceAccount op={op}/>{' '}
            claimable by <ClaimableBalanceClaimants claimants={claimants}/>

        </>
    return <>
        <OpSourceAccount op={op}/> created claimable balance
        <ClaimableBalanceId balance={balanceId}/>{' '}
        <Amount amount={amount} asset={AssetDescriptor.parse(asset)} issuer={!compact}/>{' '}
        claimable by <ClaimableBalanceClaimants claimants={claimants}/>
    </>
}

/**
 * Type: 15
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function ClaimClaimableBalanceDescriptionView({op, compact}) {
    const {balanceId} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Claim balance</b> <ClaimableBalanceId balance={balanceId}/>
            <OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> claimed balance <ClaimableBalanceId balance={balanceId}/>
    </>
}

/**
 * Type: 16
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function BeginSponsoringFutureReservesDescriptionView({op, compact}) {
    const {sponsoredId} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Sponsor reserves</b> for <AccountAddress account={sponsoredId}/><OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> sponsored reserves for <AccountAddress account={sponsoredId}/>
    </>
}

/**
 * Type: 17
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function EndSponsoringFutureReservesDescriptionView({op, compact}) {
    if (op.isEphemeral)
        return <>
            <b>Finish sponsoring reserves</b><OpSourceAccount op={op}/>
        </>
    return <>
        Finished sponsoring reserves for <OpSourceAccount op={op}/>
    </>
}

/**
 * Type: 18
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function RevokeAccountSponsorshipDescriptionView({op, compact}) {
    const {account} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Revoke sponsorship</b> for account <AccountAddress account={account}/><OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> revoked sponsorship for account <AccountAddress account={account}/>
    </>
}

/**
 * Type: 18
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function RevokeSignerSponsorshipDescriptionView({op, compact}) {
    const {account, signer} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Revoke sponsorship</b> on signer <SignerKey signer={signer} showWeight={false}/>{' '}
            for account <AccountAddress account={account}/>
            <OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> revoked sponsorship on signer <SignerKey signer={signer} showWeight={false}/>
        {' '}for account <AccountAddress account={account}/>
    </>
}

/**
 * Type: 18
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function RevokeTrustlineSponsorshipDescriptionView({op, compact}) {
    const {account, asset} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Revoke sponsorship</b> on <AssetLink asset={asset} issuer={!compact}/> trustline for account{' '}
            <AccountAddress account={account}/><OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> revoked sponsorship on <AssetLink asset={asset} issuer={!compact}/> trustline for account{' '}
        <AccountAddress account={account}/>
    </>
}

/**
 * Type: 18
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function RevokeOfferSponsorshipDescriptionView({op, compact}) {
    const {seller, offerId} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Revoke sponsorship</b> on offer <OfferLink offer={offerId}/> for account <AccountAddress account={seller}/>
            <OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> revoked sponsorship on offer <OfferLink offer={offerId}/>{' '}
        for account <AccountAddress account={seller}/>
    </>
}

/**
 * Type: 18
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function RevokeDataSponsorshipDescriptionView({op, compact}) {
    const {account, name} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Revoke sponsorship</b> on data entry <code>{name}</code> for account <AccountAddress account={account}/>
            <OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> revoked sponsorship on data entry <code>{name}</code> for account{' '}
        <AccountAddress account={account}/>
    </>
}

/**
 * Type: 18
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function RevokeClaimableBalanceSponsorshipDescriptionView({op, compact}) {
    const {balanceId} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Revoke sponsorship</b> on claimable balance <ClaimableBalanceId balance={balanceId}/>
            <OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> revoked sponsorship on claimable balance <ClaimableBalanceId balance={balanceId}/>
    </>
}

/**
 * Type: 18
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function RevokeLiquidityPoolSponsorshipDescriptionView({op, compact}) {
    const {liquidityPoolId} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Revoke sponsorship</b> on liquidity pool <AssetLink asset={liquidityPoolId} issuer={!compact}/>
            <OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> revoked sponsorship on liquidity pool <AssetLink asset={liquidityPoolId} issuer={!compact}/>
    </>
}

/**
 * Type: 19
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function ClawbackDescriptionView({op, compact}) {
    const {from, amount, asset} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Clawback</b> <Amount amount={amount} asset={asset} issuer={!compact}/> from <AccountAddress account={from}/>
            <OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> clawedback <Amount asset={asset} amount={amount} issuer={!compact}/> from <AccountAddress
        account={from}/>
    </>
}

/**
 * Type: 20
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function ClawbackClaimableBalanceDescriptionView({op, compact}) {
    const {balanceId} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Clawback claimable balance</b> <ClaimableBalanceId balance={balanceId}/><OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> clawedback claimable balance <ClaimableBalanceId balance={balanceId}/>
    </>
}

/**
 * Type: 21
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function SetTrustLineFlagsDescriptionView({op, compact}) {
    const {trustor, asset, flags} = op.operation
    const flagsMapping = {
        authorized: 'authorized',
        authorizedToMaintainLiabilities: 'authorized to maintain liabilities',
        clawbackEnabled: 'clawback enabled'
    }
    const setFlags = []
    const clearFlags = []
    for (let flag of Object.keys(flagsMapping)) {
        const container = flags[flag] ? setFlags : clearFlags
        container.push(flagsMapping[flag])
    }
    const flagsInfo = <>
        <code>[{setFlags.join(', ')}]</code>
        {clearFlags.length > 0 && <span>, clear{!op.isEphemeral && 'ed'} flags <code>[{clearFlags.join(', ')}]</code></span>}{' '}
        on asset <AssetLink asset={asset} issuer={!compact}/> for account <AccountAddress account={trustor}/>
    </>
    if (op.isEphemeral)
        return <>
            <b>Set trustline flags</b> {flagsInfo}<OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> set trustline flags {flagsInfo}
    </>
}

/**
 * Type: 22
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function DepositLiquidityDescriptionView({op, compact}) {
    const {liquidityPoolId, maxAmountA, maxAmountB, minPrice, maxPrice} = op.operation
    const meta = useAssetMeta(liquidityPoolId)
    const [assetA, assetB] = meta?.assets.map(a => a.asset) || ['tokens A', 'tokens B']
    const depositInfo = <>
        <Amount asset={assetA} amount={maxAmountA} issuer={!compact}/> and {' '}
        <Amount asset={assetB} amount={maxAmountB} issuer={!compact}/> to the pool{' '}
        <AssetLink asset={liquidityPoolId} issuer={!compact}/>{' '}
        {!compact && <span className="dimmed">(price range {formatPrice(minPrice)} - {formatPrice(maxPrice)})</span>}
    </>
    if (op.isEphemeral)
        return <>
            <b>Deposit liquidity</b> {depositInfo}<OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> deposited liquidity {depositInfo}
    </>
}

/**
 * Type: 23
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function WithdrawLiquidityDescriptionView({op, compact}) {
    const {liquidityPoolId, amount, minAmountA, minAmountB} = op.operation
    const meta = useAssetMeta(liquidityPoolId)
    const [assetA, assetB] = meta?.assets.map(a => a.asset) || ['tokens A', 'tokens B']
    const withdrawInfo = <>
        {formatWithAutoPrecision(amount)} shares from the pool <AssetLink asset={liquidityPoolId} issuer={!compact}/>{' '}
        {!compact && <span className="dimmed">
            (minimum <Amount asset={assetA} amount={minAmountA}/> + <Amount asset={assetB} amount={minAmountB}/>)
        </span>}
    </>
    if (op.isEphemeral)
        return <>
            <b>Withdraw liquidity</b> {withdrawInfo}<OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> withdrew {withdrawInfo}
    </>
}

/**
 * Type: 24
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function InvokeHostFunctionView({op, compact}) {
    const network = useStellarNetwork()
    const {func} = op.operation
    const value = func.value()
    switch (func.arm()) {
        case 'invokeContract':
            const contractAddress = xdrParserUtils.xdrParseScVal(value._attributes.contractAddress)
            const sac = op.operation.sacMap?.[contractAddress]
            const invocationArgs = {
                contract: contractAddress,
                func: value.functionName().toString(),
                args: value.args(),
                sac
            }
            if (op.isEphemeral)
                return <>
                    <b>Invoke contract</b> <AccountAddress account={contractAddress}/>{' '}
                    <InvocationInfoView {...invocationArgs}/>
                    <OpSourceAccount op={op}/>
                </>
            const invocationEffect = op.operation.effects.find(e => e.type === 'contractInvoked' && e.contract === contractAddress)
            return <>
                <OpSourceAccount op={op}/> invoked contract <AccountAddress account={contractAddress}/>{' '}
                <InvocationInfoView {...invocationArgs} result={invocationEffect?.result}/>
            </>
        case 'wasm':
            const wasmCode = value.toString('base64')
            const codeReference = <>
                <code title={wasmCode}>{shortenString(value.toString('base64'), 16)}</code>
                <CopyToClipboard text={wasmCode}/>
            </>
            if (op.isEphemeral)
                return <>
                    <b>Upload contract code</b> {codeReference}<OpSourceAccount op={op}/>
                </>
            return <>
                <OpSourceAccount op={op}/> uploaded contract code {codeReference}
            </>
        case 'createContract':
        case 'createContractV2':
            const preimage = value.contractIdPreimage()
            const executable = value.executable()
            const executableType = executable.switch().name
            const contract = contractPreimageEncoder.contractIdFromPreimage(preimage, Networks[network.toUpperCase()])
            let contractProps
            switch (executableType) {
                case 'contractExecutableWasm':
                    const wasmHash = executable.wasmHash().toString('hex')
                    contractProps = <>
                        WASM code <code title={wasmHash}>{shortenString(wasmHash, 16)}</code>
                        <CopyToClipboard text={wasmHash}/>
                    </>
                    break
                case 'contractExecutableStellarAsset':
                    const preimageParams = preimage.value()
                    switch (preimage.switch().name) {
                        case 'contractIdPreimageFromAddress':
                            const issuerAddress = xdrParserUtils.xdrParseAccountAddress(preimageParams.address().value())
                            const salt = preimageParams.salt().toString('base64')
                            contractProps = <>address <AccountAddress account={issuerAddress}/> with salt {salt}</>
                            break
                        case 'contractIdPreimageFromAsset':
                            contractProps = <>asset <AssetLink asset={xdrParserUtils.xdrParseAsset(preimageParams)}/></>
                            break
                    }
                    break
            }
            if (func.arm() === 'createContractV2') {
                const args = value.constructorArgs() //array
                if (args.length > 0) {
                    contractProps = <>{contractProps} with <InvocationInfoView func="__constructor" args={args}/></>
                }
            }
            if (op.isEphemeral)
                return <>
                    <b>Create contract</b> <AccountAddress account={contract}/> from {contractProps}<OpSourceAccount op={op}/>
                </>
            return <>
                <OpSourceAccount op={op}/> created contract <AccountAddress account={contract}/> from {contractProps}
            </>
            break
        default:
            return <>Unknown invocation type</>
    }
}

/**
 * Type: 25
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function ExtendFootprintTTLView({op}) {
    const {extendTo} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Extend ledger state expiration</b> to sequence {extendTo}
            <OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> extended ledger state expiration to sequence {extendTo}
    </>
}

/**
 * Type: 26
 * @param {OperationDescriptor} op
 * @param {Boolean} compact
 * @constructor
 */
function RestoreFootprintView({op}) {
    const {ledgersToExpire} = op.operation
    if (op.isEphemeral)
        return <>
            <b>Restore ledger state entry</b> <OpSourceAccount op={op}/>
        </>
    return <>
        <OpSourceAccount op={op}/> restored ledger state entry
    </>
}

const typeMapping = {
    createAccount: CreateAccountDescriptionView,
    payment: PaymentDescriptionView,
    pathPaymentStrictReceive: PathPaymentDescriptionView,
    manageSellOffer: ManageOfferDescriptionView,
    createPassiveSellOffer: ManageOfferDescriptionView,
    setOptions: SetOptionsDescriptionView,
    changeTrust: ChangeTrustDescriptionView,
    allowTrust: AllowTrustDescriptionView,
    accountMerge: MergeAccountDescriptionView,
    inflation: InflationDescriptionView,
    manageData: ManageDataDescriptionView,
    bumpSequence: BumpSequenceDescriptionView,
    manageBuyOffer: ManageOfferDescriptionView,
    pathPaymentStrictSend: PathPaymentDescriptionView,
    createClaimableBalance: CreateClaimableBalanceDescriptionView,
    claimClaimableBalance: ClaimClaimableBalanceDescriptionView,
    beginSponsoringFutureReserves: BeginSponsoringFutureReservesDescriptionView,
    endSponsoringFutureReserves: EndSponsoringFutureReservesDescriptionView,
    revokeAccountSponsorship: RevokeAccountSponsorshipDescriptionView,
    revokeTrustlineSponsorship: RevokeTrustlineSponsorshipDescriptionView,
    revokeOfferSponsorship: RevokeOfferSponsorshipDescriptionView,
    revokeDataSponsorship: RevokeDataSponsorshipDescriptionView,
    revokeClaimableBalanceSponsorship: RevokeClaimableBalanceSponsorshipDescriptionView,
    revokeLiquidityPoolSponsorship: RevokeLiquidityPoolSponsorshipDescriptionView,
    revokeSignerSponsorship: RevokeSignerSponsorshipDescriptionView,
    clawback: ClawbackDescriptionView,
    clawbackClaimableBalance: ClawbackClaimableBalanceDescriptionView,
    setTrustLineFlags: SetTrustLineFlagsDescriptionView,
    liquidityPoolDeposit: DepositLiquidityDescriptionView,
    liquidityPoolWithdraw: WithdrawLiquidityDescriptionView,
    invokeHostFunction: InvokeHostFunctionView,
    extendFootprintTtl: ExtendFootprintTTLView,
    restoreFootprint: RestoreFootprintView
}

/**
 * Text description of a tx operation
 * @param {OperationDescriptor} op
 * @param {Boolean} [compact]
 * @constructor
 */
export const OpDescriptionView = React.memo(function OpDescriptionView({op, compact = false}) {
    const render = typeMapping[op.operation.type]
    if (!render) {
        console.warn(`No operation text type mapping for operation ${op.operation.type}`)
        return null
    }
    return React.createElement(render, {op, compact})
})