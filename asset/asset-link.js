import React from 'react'
import cn from 'classnames'
import {shortenString} from '@stellar-expert/formatter'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {useDirectory} from '../directory/directory-hooks'
import {formatExplorerLink} from '../ledger/ledger-entry-href-formatter'
import {useStellarNetwork} from '../state/stellar-network-hooks'
import {useAssetMeta} from './asset-meta-hooks'
import {AssetIcon} from './asset-icon'
import {AssetIssuer} from './asset-issuer'
import './asset-link.scss'
import {AccountAddress} from '../account/account-address'

/**
 * Explorer asset link
 * @param {String|AssetDescriptor|Asset} asset - Asset name/descriptor
 * @param {Boolean|String} [link] - Reference link
 * @param {Boolean} [issuer] - Whether to show asset issuer
 * @param {Boolean} [icon] - Wheter to show asset icon
 * @param {String} [className] - Optional CSS class name
 * @param {{}} [style] - Optional CSS style
 * @param {*} [children] - Optional inner link text
 * @constructor
 */
export const AssetLink = React.memo(function AssetLink({asset, link, issuer, icon, className, style, children: innerText}) {
    if (!(asset instanceof AssetDescriptor)) {
        asset = AssetDescriptor.parse(asset)
    }
    useStellarNetwork()
    const directoryInfo = useDirectory(asset?.issuer)
    const meta = useAssetMeta(asset)

    if (!asset)
        return null

    let children = innerText
    if (!innerText) {
        if (asset.poolId) {
            if (meta) {
                const [assetA, assetB] = meta.assets.map(a => AssetDescriptor.parse(a.asset))
                children = <span title={'Liquidity pool ' + asset.poolId} className="nowrap">
                    <span>
                        {icon !== false && <AssetIcon asset={assetA}/>}
                        {assetA.toCurrency()}
                        {issuer === true && <AssetIssuer asset={assetA}/>}
                    </span>
                    <span style={{fontSize: '0.7em'}}>&nbsp;<i className="icon icon-plus dimmed"/>&nbsp;</span>
                    <span>
                        {icon !== false && <AssetIcon asset={assetB}/>}
                        {AssetDescriptor.parse(assetB).toCurrency()}
                        {issuer === true && <AssetIssuer asset={assetB}/>}
                    </span>
                </span>
            } else {
                children = <>{shortenString(asset.poolId)}</>
            }
        } else {
            children = <>
                {directoryInfo && (directoryInfo.tags || []).includes('malicious') &&
                    <i className="icon icon-warning color-warning"
                       title="Warning: reported for illicit or fraudulent activity"/>}
                {icon !== false && <AssetIcon asset={asset}/>}
                {!!asset.code && asset.code}
                {!!asset.isContract && <AccountAddress account={asset.contract} chars={8} link={false} icon={false}/>}
                {issuer !== false && <AssetIssuer asset={asset}/>}
            </>
        }
    }

    const props = {
        'aria-label': asset.toString(),
        className: cn('asset-link', className),
        style,
        children
    }
    if (link === false)
        return <span {...props}/>
    if (typeof link === 'string') {
        props.href = link
    } else {
        props.href = asset.poolId ?
            formatExplorerLink('liquidity-pool', asset.poolId) :
            formatExplorerLink('asset', asset.toString())
        if (window.origin !== explorerFrontendOrigin) {
            props.target = '_blank'
        }
    }
    return <a {...props}/>
})