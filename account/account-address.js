import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {StrKey} from 'stellar-sdk'
import {AccountIdenticon} from './identicon'
import {InfoTooltip} from '../controls/info-tooltip'
import {useDirectory} from '../directory/directory-hooks'
import {formatLongHex} from '../numeric/formatting-utils'
import {parseMuxedAccount} from './muxed-account-parser'
import './account-address.scss'
import {formatExplorerLink} from '../ledger/ledger-entry-href-formatter'

export function AccountAddress({account, chars = 8, name, link, style, className, icon, prefix, suffix}) {
    const muxedInfo = StrKey.isValidMed25519PublicKey(account) && parseMuxedAccount(account)
    if (!StrKey.isValidEd25519PublicKey(account) && !muxedInfo) return null

    let innerStyle = !style ? undefined : style,
        displayAddress = account

    if (chars && chars !== 'all') {
        displayAddress = formatLongHex(account, chars)
    }
    let displayName, warning
    if (name !== false) {
        displayName = name
        if (!displayName) {
            const directoryInfo = useDirectory(muxedInfo?.address || account)
            if (directoryInfo) {
                displayName = directoryInfo.name
                if (directoryInfo.tags.includes('malicious')) {
                    warning = <i className="icon icon-warning color-warning"
                                 title="This account was reported for illicit or fraudulent activity. Do not send funds to this address and do not trust any person affiliated with it."/>
                }
            }
        }
    }

    const children = <>
        {prefix}
        {icon !== false && <AccountIdenticon key="identicon" address={muxedInfo?.address || account}/>}
        {displayName && <>[{displayName}] </>}
        {warning}
        <span className="account-pubkey" key="pubkey">{displayAddress}</span>
        {!!muxedInfo && <InfoTooltip icon="icon-plus">
            Subaccount of a custodial account<br/>
            <AccountAddress account={muxedInfo.address} name={false} chars={12}/>
            <div className="dimmed text-tiny micro-space">Multiplexed id: {muxedInfo.muxedId.toString()}</div>
        </InfoTooltip>}
        {suffix}
    </>

    const containerProps = {
        title: account,
        'aria-label': account,
        className: cn('account-address', className),
        style: innerStyle
    }
    let renderAs = 'span'

    if (link !== false) {
        renderAs = 'a'
        if (typeof link === 'string') {
            containerProps.href = link
        } else {
            containerProps.href = formatExplorerLink('account', account)
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
    chars: PropTypes.oneOfType([PropTypes.number, 'all']),
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
