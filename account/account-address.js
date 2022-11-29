import React from 'react'
import PropTypes from 'prop-types'
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
 *
 * @param {String} key
 * @return {{address: String, type: ('muxed'|'ed5519'|'hash'|'tx'), [muxedId]: BigInt}|{error: Error}}
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
                    type: 'ed5519',
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
        }
    } catch (e) {
        console.error(e)
        return {
            error: e
        }
    }
}

function isPublicKey(type) {
    return type === 'muxed' || type === 'ed5519'
}

function getAccountPredefinedDisplayName(address) {
    if (!window.predefinedAccountDisplayNames) return undefined
    return window.predefinedAccountDisplayNames[address]
}

function AccountDisplayName({type, address, name}) {
    const predefined = getAccountPredefinedDisplayName()
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

export function AccountAddress({account, chars = 8, name, link, style, className, icon, prefix, suffix, network, ...otherProps}) {
    useStellarNetwork()
    let {type, address, muxedId} = decodeKeyType(account)
    if (!type) return null //failed to decode address type

    let innerStyle = !style ? undefined : style

    let ed5519Address = address
    if (chars && chars !== 'all') {
        address = shortenString(account, chars)
    }

    const children = <>
        {prefix}
        {icon !== false && ['ed5519', 'muxed'].includes(type) && <AccountIdenticon key="identicon" address={ed5519Address}/>}
        <AccountDisplayName type={type} address={ed5519Address} name={name}/>
        <span className="account-pubkey" key="pubkey">{address}</span>
        {muxedId !== undefined && <InfoTooltip icon="icon-plus">
            Subaccount of a custodial account<br/>
            <AccountAddress account={ed5519Address} name={false} chars={12}/>
            <div className="dimmed text-tiny micro-space">Multiplexed id: {muxedId.toString()}</div>
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
}

AccountAddress.propTypes = {
    /**
     * Account address
     */
    account: PropTypes.string.isRequired,
    /**
     * Explicit account name that overrides the name from Directory; if false, friendly name is ignored
     */
    name: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    /**
     * Explicit link; if false, the component is rendered without a link
     */
    link: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    /**
     * Visible address characters count
     */
    chars: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['all'])]),
    /**
     * Whether to show/hide account identicon
     */
    icon: PropTypes.bool,
    /**
     * Custom class attribute
     */
    className: PropTypes.string,
    /**
     * Additional inline styles
     */
    style: PropTypes.object,
    /**
     * Address link prefix
     */
    prefix: PropTypes.any,
    /**
     * Address link suffix
     */
    suffix: PropTypes.any
}
