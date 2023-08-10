import React from 'react'
import cn from 'classnames'
import {StrKey} from 'stellar-sdk'
import {shortenString} from '@stellar-expert/formatter'
import {AccountIdenticon} from './identicon'
import {InfoTooltip} from '../controls/info-tooltip'
import {useDirectory} from '../directory/directory-hooks'
import {parseMuxedAccount} from './muxed-account-parser'
import {formatExplorerLink} from '../ledger/ledger-entry-href-formatter'
import {useStellarNetwork} from '../state/stellar-network-hooks'
import './account-address.scss'

/**
 * @param {String} key
 * @return {{address: String, type: ('muxed'|'ed25519'|'hash'|'tx'), [muxedId]: BigInt}|{error: Error}}
 * @internal
 */
function decodeKeyType(key) {
    try {
        switch (key.substr(0, 1)) {
            case 'M':
                return {
                    type: 'muxed',
                    ...parseMuxedAccount(key)
                }
            case 'G':
                if (!StrKey.isValidEd25519PublicKey(key)) return {
                    error: new Error(`Invalid public key: ${key}`)
                }
                return {
                    type: 'ed25519',
                    address: key
                }
            case 'X':
                StrKey.decodeSha256Hash(key)
                return {
                    type: 'hash',
                    address: key
                }
            case 'T':
                StrKey.decodePreAuthTx(key)
                return {
                    type: 'tx',
                    address: key
                }
            case 'P':
                const spayload = StrKey.decodeSignedPayload(key)
                return {
                    type: 'signedPayload',
                    address: key,
                    publicKey: StrKey.encodeEd25519PublicKey(spayload.slice(0, 32)),
                    payload: spayload.slice(36, 36 + spayload.readUIntBE(32, 4)).toString('hex')
                }
        }
    } catch (e) {
        console.error(e)
        return {
            error: e
        }
    }
}

function isPublicKey(type) {
    return type === 'muxed' || type === 'ed25519'
}

function getAccountPredefinedDisplayName(address) {
    if (!window.predefinedAccountDisplayNames) return undefined
    return window.predefinedAccountDisplayNames[address]
}

function AccountDisplayName({type, address, name}) {
    const predefined = getAccountPredefinedDisplayName(address)
    let directoryInfo = useDirectory(!predefined && !name && isPublicKey(type) && address),
        warning
    if (name === false)
        return null
    if (predefined)
        return `[${predefined}] `
    if (directoryInfo) {
        name = directoryInfo.name
        if (directoryInfo.tags.includes('malicious')) {
            warning = <i className="icon icon-warning color-warning"
                         title="This account was reported for illicit or fraudulent activity. Do not send funds to this address and do not trust any person affiliated with it."/>
        }
    }
    if (!name && !warning) return null
    return <>
        {name ? `[${name}] ` : ''}
        {warning}
    </>

}

/**
 * Explorer link for Account/MuxedAccount/Sha256Hash/PreAuthTx/SignedPayload
 * @param {String} account - StrKey-encoded Account/MuxedAccount/Sha256Hash/PreAuthTx/SignedPayload
 * @param {Number|'all'} [chars] - Visible address characters count
 * @param {Bool|String} [name] - Explicit account name that overrides the name from Directory; if false, friendly name is ignored
 * @param {Bool|String} [link] - Explicit link; if false, the component is rendered without a link
 * @param {Boolean} [icon] - Whether to show/hide account identicon
 * @param {String} [network] - Stellar network identifier
 * @param {*} [prefix] - Link prefix
 * @param {*} [suffix] - Link suffix
 * @param {{}} [style] - Optional CSS inline style
 * @param {String} [className] - Optional CSS class attribute
 * @param {...*} [otherProps] - Optional container parameters
 * @constructor
 */
export const AccountAddress = React.memo(function AccountAddress({account, chars = 8, name, link, style, className, icon, prefix, suffix, network, ...otherProps}) {
    useStellarNetwork()
    let {type, address, muxedId, publicKey, payload} = decodeKeyType(account)
    if (!type)
        return null //failed to decode address type

    let innerStyle = !style ? undefined : style

    let ed25519Address = address
    if (chars && chars !== 'all') {
        address = shortenString(account, chars)
    }

    const children = <>
        {prefix}
        {icon !== false && isPublicKey(type) && <AccountIdenticon key="identicon" address={ed25519Address}/>}
        <AccountDisplayName type={type} address={ed25519Address} name={name}/>
        <span className="account-key">{address}</span>
        {muxedId !== undefined && <InfoTooltip icon="icon-plus">
            Subaccount of a custodial account<br/>
            <AccountAddress account={ed25519Address} name={false} chars={12}/>
            <div className="dimmed text-tiny micro-space">Multiplexed id: {muxedId.toString()}</div>
        </InfoTooltip>}
        {payload !== undefined && <InfoTooltip icon="icon-plus">
            ED25519 payload signer<br/>
            <AccountAddress account={publicKey} name={false} chars={12}/>
            <div className="dimmed text-tiny micro-space">Payload: {payload}</div>
        </InfoTooltip>}
        {suffix}
    </>

    const containerProps = {
        title: account,
        'aria-label': account,
        className: cn('account-address', className),
        style: innerStyle,
        ...otherProps
    }
    let renderAs = 'span'

    if (link !== false && isPublicKey(type)) {
        renderAs = 'a'
        if (typeof link === 'string') {
            containerProps.href = link
        } else {
            containerProps.href = formatExplorerLink('account', account, network)
            if (window.origin !== explorerFrontendOrigin) {
                containerProps.target = '_blank'
            }
        }
    }

    return React.createElement(renderAs, containerProps, children)
})
