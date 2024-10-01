import React from 'react'
import PropTypes from 'prop-types'
import {AuthRequiredFlag, AuthRevocableFlag, AuthImmutableFlag, AuthClawbackEnabledFlag} from '@stellar/stellar-base'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {shortenString, formatWithAutoPrecision} from '@stellar-expert/formatter'
import {AccountAddress} from '../account/account-address'
import {SignerKey} from '../account/signer-key'
import {OfferLink, PoolLink} from '../ledger/ledger-entry-link'
import {AssetLink} from '../asset/asset-link'
import {Amount} from '../asset/amount'
import {CopyToClipboard} from '../interaction/copy-to-clipboard'
import {ScVal} from '../contract/sc-val'
import InvocationInfoView from '../contract/invocation-info-view'

/**
 * @param {{}} effect
 * @param {{}} operation
 * @return {JSX.Element}
 * @constructor
 */
export function EffectDescription({effect, operation}) {
    switch (effect.type) {
        case 'accountCreated':
            return <>Account <AccountAddress account={effect.account}/> created</>
        case 'accountRemoved':
            return <>Account <AccountAddress account={effect.source}/> removed</>
        case 'accountCredited':
            return <><Amount asset={effect.asset} amount={effect.amount} adjust/> credited to&nbsp;
                {effect.source.startsWith('C') ? 'contract' : 'account'} <AccountAddress account={effect.source}/></>
        case 'accountDebited':
            return <><Amount asset={effect.asset} amount={effect.amount} adjust/> debited from&nbsp;
                {effect.source.startsWith('C') ? 'contract' : 'account'} <AccountAddress account={effect.source}/></>
        case 'accountThresholdsUpdated':
            return <>Account <AccountAddress account={effect.source}/> set thresholds to {effect.thresholds.join('/')}</>
        case 'accountHomeDomainUpdated':
            return <>
                Account <AccountAddress account={effect.source}/> set home domain to{' '}
                <a href={'https://' + effect.home_domain} target="_blank" rel="noreferrer noopener">{effect.home_domain}</a>
            </>
        case 'accountFlagsUpdated':
            return <>Account <AccountAddress account={effect.source}/> updated authorization
                flags: {decodeAccountAuthFlags(effect.flags).join(', ')}</>
        case 'accountInflationDestinationUpdated':
            return <>Account <AccountAddress account={effect.source}/> set inflation destination
                to <AccountAddress account={effect.inflationDestination}/></>
        case 'accountSignerCreated':
            return <>Account <AccountAddress account={effect.source}/> added
                signer <AccountAddress account={effect.signer}/>(w:{effect.weight})</>
        case 'accountSignerUpdated':
            return <>Account <AccountAddress account={effect.source}/> updated
                signer <AccountAddress account={effect.signer}/>(w:{effect.weight})</>
        case 'accountSignerRemoved':
            return <>Account <AccountAddress account={effect.source}/> removed
                signer <AccountAddress account={effect.signer}/></>
        case 'trustlineCreated':
            return <>
                Account <AccountAddress account={effect.source}/> established trustline to <AssetLink asset={effect.asset}/> with
                limit <Amount asset={effect.asset} amount={effect.limit} issuer={false} icon={false} adjust/>
            </>
        case 'trustlineUpdated':
            return <>
                Account <AccountAddress account={effect.source}/> updated trustline to <AssetLink asset={effect.asset}/> with
                limit <Amount asset={effect.asset} amount={effect.limit} issuer={false} icon={false} adjust/>
            </>
        case 'trustlineRemoved':
            return <>Account <AccountAddress account={effect.source}/> removed trustline to <AssetLink asset={effect.asset}/></>
        case 'trustlineAuthorizationUpdated':
            return <>
                Account <AccountAddress account={effect.source}/> updated <AssetLink asset={effect.asset}/> trustline authorization
                flags ({decodeTrustlineFlags(effect.flags)}) for <AccountAddress account={effect.trustor}/>
            </>
        case 'assetMinted':
            return <><Amount asset={effect.asset} amount={effect.amount} adjust/> minted</>
        case 'assetBurned':
            return <>Account <AccountAddress account={effect.source}/> burned <Amount asset={effect.asset} amount={effect.amount} adjust/></>
        case 'offerCreated':
            return <OfferChange effect={effect} action="created"/>
        case 'offerUpdated':
            return <OfferChange effect={effect} action="updated"/>
        case 'offerRemoved':
            return <>DEX offer <OfferLink offer={effect.offer}/> removed</>
        case 'trade':
            return <span>
                Account <AccountAddress account={effect.source}/> exchanged{' '}
                <span className="nowrap">
                    <Amount asset={effect.asset[0]} amount={effect.amount[0]} adjust/>{' '}
                    <span className="icon icon-shuffle color-primary"/>{' '}
                    <Amount asset={effect.asset[1]} amount={effect.amount[1]} adjust/>
                </span>{' '}
                {effect.pool ?
                    <>(pool <PoolLink pool={effect.pool}/>)</> :
                    <>(DEX offer <OfferLink offer={effect.offer}/> by <AccountAddress account={effect.seller}/>)</>}
            </span>
        case 'sequenceBumped':
            return <>Account <AccountAddress account={effect.source}/> bumped sequence to {effect.sequence}</>
        case 'dataEntryCreated':
        case 'dataEntryUpdated':
            return <>
                Account <AccountAddress account={effect.source}/> {effect.type === 'dataEntryCreated' ? 'created' : 'updated'} data entry
                <span className="word-break condensed text-small"><code>"{effect.name}"</code> = <code>"{effect.value}"</code></span>
            </>
        case 'dataEntryRemoved':
            return <>
                Account <AccountAddress account={effect.source}/> removed data entry
                <span className="word-break condensed text-small"><code>"{effect.name}"</code></span>
            </>
        case 'claimableBalanceCreated':
            return <>
                Account <AccountAddress account={effect.source}/> created claimable
                balance {shortenString(effect.balance)} <Amount asset={effect.asset} amount={effect.amount} adjust/>
            </>
        case 'claimableBalanceRemoved':
            return <>
                Account <AccountAddress account={effect.source}/> claimed claimable
                balance {shortenString(effect.balance)} <Amount asset={effect.asset} amount={effect.amount} adjust/>
            </>
        case 'accountSponsorshipCreated':
        case 'accountSponsorshipUpdated':
            return <>
                Account <AccountAddress account={effect.sponsor}/> sponsored account base reserve
                for <AccountAddress account={effect.account}/>
            </>
        case 'accountSponsorshipRemoved':
            return <>
                Account <AccountAddress account={effect.prevSponsor}/> revoked account sponsorship
                for <AccountAddress account={effect.account}/>
            </>
        case 'trustlineSponsorshipCreated':
        case 'trustlineSponsorshipUpdated':
            return <>
                Account <AccountAddress account={effect.sponsor}/> sponsored <AssetLink asset={effect.asset}/> trustline reserve
                for <AccountAddress account={effect.account}/>
            </>
        case 'trustlineSponsorshipRemoved':
            return <>
                Account <AccountAddress account={effect.prevSponsor}/> revoked <AssetLink asset={effect.asset}/> trustline sponsorship
                for <AccountAddress account={effect.account}/>
            </>
        case 'offerSponsorshipCreated':
        case 'offerSponsorshipUpdated':
            return <>
                Account <AccountAddress account={effect.sponsor}/> sponsored offer <OfferLink offer={effect.offer}/> reserve
                for <AccountAddress account={effect.account}/>
            </>
        case 'offerSponsorshipRemoved':
            return <>
                Account <AccountAddress account={effect.prevSponsor}/> revoked offer <OfferLink offer={effect.offer}/> sponsorship
                for <AccountAddress account={effect.account}/>
            </>
        case 'dataSponsorshipCreated':
        case 'dataSponsorshipUpdated':
            return <>
                Account <AccountAddress account={effect.sponsor}/> sponsored "{shortenString(effect.name)}" data reserve
                for <AccountAddress account={effect.account}/>
            </>
        case 'dataSponsorshipRemoved':
            return <>
                Account <AccountAddress account={effect.prevSponsor}/> revoked "{shortenString(effect.name)}" data sponsorship
                for <AccountAddress account={effect.account}/>
            </>
        case 'claimableBalanceSponsorshipCreated':
        case 'claimableBalanceSponsorshipUpdated':
            return <>
                Account <AccountAddress account={effect.sponsor}/> sponsored claimable balance {shortenString(effect.balance)}
                {effect.source !== effect.sponsor && <> for account <AccountAddress account={effect.source}/></>}
            </>
        case 'claimableBalanceSponsorshipRemoved':
            return <>
                Account <AccountAddress account={effect.prevSponsor}/> revoked claimable balance {shortenString(effect.balance)} sponsorship
                {effect.source !== effect.prevSponsor && <> for account <AccountAddress account={effect.source}/></>}
            </>
        case 'signerSponsorshipCreated':
        case 'signerSponsorshipUpdated':
            return <>
                Account <AccountAddress account={effect.sponsor}/> sponsored signer <SignerKey account={effect.signer}/>{' '}
                for account <AccountAddress account={effect.account}/>
            </>
        case 'signerSponsorshipRemoved':
            return <>
                Account <AccountAddress account={effect.prevSponsor}/> revoked signer <SignerKey account={effect.signer}/> sponsorship{' '}
                for account <AccountAddress account={effect.account}/>
            </>
        case 'liquidityPoolDeposited':
            return <>
                <span className="nowrap">
                    <Amount asset={effect.assets[0].asset} amount={effect.assets[0].amount} adjust/>{' '}
                    and <Amount asset={effect.assets[1].asset} amount={effect.assets[1].amount} adjust/>
                </span>{' '}
                deposited to liquidity <span className="nowrap">pool <AssetLink asset={effect.pool}/></span>{' '}
                <i className="icon icon-shuffle"/> <span className="nowrap">{formatWithAutoPrecision(effect.shares)} pool shares</span>
            </>
        case 'liquidityPoolWithdrew':
            return <>
                {formatWithAutoPrecision(effect.shares)} pool shares <i className="icon icon-shuffle"/>{' '}
                <span className="nowrap">
                    <Amount asset={effect.assets[0].asset} amount={effect.assets[0].amount} adjust/>{' '}
                    and <Amount asset={effect.assets[1].asset} amount={effect.assets[1].amount} adjust/>
                </span>{' '}
                withdrawn from <span className="nowrap"><AssetLink asset={effect.pool}/> pool</span>
            </>
        case 'liquidityPoolCreated':
            return <>Liquidity pool <AssetLink asset={effect.pool}/> created</>
        case 'liquidityPoolUpdated':
            return <>Liquidity pool <AssetLink asset={effect.pool}/> updated / {' '}
                <span className="nowrap">
                <Amount asset={effect.reserves[0].asset} amount={effect.reserves[0].amount} adjust/> <i className="icon-plus"/>{' '}
                    <Amount asset={effect.reserves[1].asset} amount={effect.reserves[1].amount} adjust/></span> /{' '}
                <span className="nowrap">{formatWithAutoPrecision(effect.shares)} pool shares</span>,{' '}
                <span className="nowrap">{effect.accounts} accounts</span></>
        case 'liquidityPoolRemoved':
            return <>Liquidity pool <AssetLink asset={effect.pool}/> removed</>
        case 'inflation':
            return <>Inflation distribution initialized</>
        case 'contractCodeUploaded':
            return <>Contract code <LedgerKeyHint effect={effect}><ContractCodeWasm wasm={effect.wasm}/></LedgerKeyHint> uploaded</>
        case 'contractCreated':
            return <>Contract <AccountAddress account={effect.contract}/> created <ContractDetails effect={effect}/></>
        case 'contractUpdated':
            return <>Contract <AccountAddress account={effect.contract}/> updated <ContractDetails effect={effect}/></>
        case 'contractInvoked':
            return <>{effect.depth > 0 &&
                <i className="icon-level-down text-tiny color-primary" style={{paddingLeft: (effect.depth - 1) + 'em'}}/>}
                Contract <AccountAddress account={effect.contract}/> invoked{' '}
                <InvocationInfoView func={effect.function} args={effect.rawArgs} contract={effect.contract} result={effect.result} sac={operation.operation.sacMap?.[effect.contract]}/>
            </>
        case 'contractEvent':
            return <>Contract <AccountAddress account={effect.contract}/> raised event <ScVal value={effect.rawTopics}/>{' '}
                with data <ScVal value={effect.rawData}/></>
        case 'contractDataCreated':
        case 'contractDataUpdated':
            return <>Contract <AccountAddress account={effect.owner}/>
                {effect.type === 'contractDataCreated' ? ' created ' : ' updated '} {effect.durability} data{' '}
                <LedgerKeyHint effect={effect}><ScVal value={effect.key}/></LedgerKeyHint> with value <ScVal value={effect.value}/>
            </>
        case 'contractDataRemoved':
            return <>Contract <AccountAddress account={effect.owner}/> removed {effect.durability}{' '}
                data <LedgerKeyHint effect={effect}><ScVal value={effect.key}/></LedgerKeyHint></>
        case 'contractError':
            let errCode = effect.code
            if (errCode?.name) {
                errCode = errCode.name
            }
            return <>Execution error {errCode ? <><code>{errCode}</code> </> : null}in <AccountAddress account={effect.contract}/>{': '}
                <code>{JSON.stringify(effect.details)}</code> </>
        case 'setTtl':
            return <>Time-to-live extended to ledger {effect.ttl} for {!!effect.owner && <AccountAddress account={effect.owner}/>}{' '}
                {ledgerEntryKind[effect.kind]}{' '}
                <CopyToClipboard text={effect.keyHash}>
                    <code title={effect.keyHash + ' - click to copy'}>{shortenString(effect.keyHash, 12)}</code>
                </CopyToClipboard></>
        case 'feeCharged':
            return <><Amount asset="XLM" amount={effect.charged} adjust/> fee charged from <AccountAddress account={effect.source}/> (
                bid <Amount asset="XLM" amount={effect.bid} adjust/>)</>
    }
    return <><i className="icon-warning color-warning"/> Effect {effect.type} not supported</>
}

EffectDescription.propTypes = {
    effect: PropTypes.object.isRequired
}

function decodeAccountAuthFlags(flags) {
    const res = []
    if ((flags & AuthRequiredFlag) === AuthRequiredFlag) {
        res.push('REQUIRED')
    }
    if ((flags & AuthRevocableFlag) === AuthRevocableFlag) {
        res.push('REVOCABLE')
    }
    if ((flags & AuthImmutableFlag) === AuthImmutableFlag) {
        res.push('IMMUTABLE')
    }
    if ((flags & AuthClawbackEnabledFlag) === AuthClawbackEnabledFlag) {
        res.push('CLAWBACK_ENABLED')
    }
    return res
}

function decodeTrustlineFlags(flags) {
    if ((flags & 2) === 2)
        return 'FROZEN'
    if ((flags & 1) === 1)
        return 'AUTHORIZED'
    return 'UNAUTHORIZED'
}

function OfferChange({effect, action}) {
    return <>DEX offer <OfferLink offer={effect.offer}/> {action} /{' '}
        <span className="nowrap">
            <Amount asset={effect.asset[0]} amount={effect.amount} adjust/> <i className="icon icon-shuffle color-primary"/>{' '}
            <AssetLink asset={effect.asset[1]}/>
        </span> at <span className="nowrap">
            {formatWithAutoPrecision(parseFloat(effect.price))}{' '}
            {AssetDescriptor.parse(effect.asset[1]).toCurrency()}/{AssetDescriptor.parse(effect.asset[0]).toCurrency()}
        </span>
    </>
}

function ContractDetails({effect}) {
    switch (effect.kind) {
        case 'wasm':
            return <>from WASM <ContractCodeWasm wasm={effect.wasmHash}/></>
        case 'fromAddress':
            return <>from issuer <AccountAddress account={effect.issuer}/> with salt <ContractCodeWasm wasm={effect.salt}/></>
        case 'fromAsset':
            return <>from asset <AssetLink asset={effect.asset}/></>
        default:
            return <span className="dimme">(contract type not supported)</span>
    }
}

function ContractCodeWasm({wasm}) {
    return <>
        <code title={wasm}>{shortenString(wasm, 16)}</code>
        <CopyToClipboard text={wasm}/>
    </>
}

function LedgerKeyHint({effect, children}) {
    if (!effect.keyHash)
        return children
    return <span title={'Ledger key ' + effect.keyHash}>{children}</span>
}

const ledgerEntryKind = {
    contractData: 'contract state entry',
    contractCode: 'contract code WASM'
}