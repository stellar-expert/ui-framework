import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {AssetDescriptor} from './asset-descriptor'
import {AccountAddress} from '../account/account-address'
import {useAssetMeta} from './asset-meta-hooks'
import {useDirectory} from '../directory/directory-hooks'
import {formatExplorerLink} from '../ledger/ledger-entry-href-formatter'
import {formatLongHex} from '../numeric/formatting-utils'
import {useStellarNetwork} from '../state/stellar-network-hooks'
import './asset-link.scss'

function AssetIcon({asset, style}) {
    const meta = useAssetMeta(asset),
        icon = meta?.toml_info?.image || meta?.toml_info?.orgLogo
    if (asset.toString() === 'XLM') return <span className="asset-icon icon icon-stellar" style={style}/>
    if (icon) return <span style={{...style, backgroundImage: `url('${icon}')`}} className="asset-icon"/>
    return <span className="asset-icon icon icon-dot-circled" style={style}/>
}

function AssetIssuer({asset}) {
    const meta = useAssetMeta(asset)
    if (asset.isNative) return null
    return <span className="asset-issuer">
        <i className="icon icon-link"/>
        {meta?.domain ?
            <>{meta.domain}</> :
            <><AccountAddress account={asset.issuer} link={false} chars={8} icon={false}/></>}
    </span>
}

export function AssetLink({asset, link, issuer, icon, className, style, children: innerText}) {
    if (!(asset instanceof AssetDescriptor))
        asset = AssetDescriptor.parse(asset)
    const directoryInfo = useDirectory(asset?.issuer),
        meta = useAssetMeta(asset)
    useStellarNetwork()
    if (!asset) return null
    let children = innerText
    if (!innerText) {
        if (asset.poolId) {
            if (meta) {
                const [assetA, assetB] = meta.assets.map(a => AssetDescriptor.parse(a.asset))
                children = <>
                <span title={'Liquidity pool ' + asset.poolId}>
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
                </>
            } else {
                children = <>{formatLongHex(asset.poolId)}</>
            }
        } else {
            children = <>
                {directoryInfo && (directoryInfo.tags || []).includes('malicious') &&
                <i className="icon icon-warning color-warning"
                   title="Warning: reported for illicit or fraudulent activity"/>}
                {icon !== false && <AssetIcon asset={asset}/>}
                {asset.code}
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
    if (link === false) return <span {...props}/>
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
}

AssetLink.defaultProps = {
    link: true,
    icon: true
}

AssetLink.propTypes = {
    asset: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(AssetDescriptor)]).isRequired,
    link: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    issuer: PropTypes.bool,
    icon: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.any
}