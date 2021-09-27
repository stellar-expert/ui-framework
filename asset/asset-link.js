import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {AssetDescriptor} from './asset-descriptor'
import {AccountAddress} from '../account/account-address'
import {useAssetMeta} from './asset-meta-hooks'
import {formatExplorerLink} from '../ledger/ledger-entry-href-formatter'
import './asset-link.scss'

function getIcon(meta) {
    return meta?.toml_info?.image || meta?.toml_info?.orgLogo
}

export function AssetLink({asset, link, issuer, icon, className, style, children: innerText}) {
    if (!(asset instanceof AssetDescriptor)) asset = new AssetDescriptor(asset)
    const meta = useAssetMeta(asset)
    const children = innerText ? innerText : <>
        {icon !== false && <>
            {getIcon(meta) ?
                <span style={{backgroundImage: `url('${getIcon(meta)}')`}} className="asset-icon"/> :
                <span className="asset-icon icon icon-cubes"/>}
        </>}
        {asset.code}
        {!!issuer && !asset.isNative && <span className="asset-issuer">
            <i className="icon icon-link"/>
            {meta?.domain ? <>{meta.domain}</> :
                <><AccountAddress account={asset.issuer} link={false} chars={8} icon={false}/></>
            }
        </span>}
    </>
    const props = {
        'aria-label': asset.toString(),
        className: cn('asset-link', className),
        style,
        children
    }
    if (link === false) return <span {...props}/>
    if (!link) {
        props.link = formatExplorerLink('asset', asset.toString())
        if (window.origin !== explorerFrontendOrigin) {
            props.target = '_blank'
        }
    }
    return <a {...props}/>
}

AssetLink.defaultProps = {
    link: true,
    issuer: true,
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