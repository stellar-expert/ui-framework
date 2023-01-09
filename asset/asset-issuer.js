import React from 'react'
import PropTypes from 'prop-types'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {AccountAddress} from '../account/account-address'
import {useAssetMeta} from './asset-meta-hooks'

export function AssetIssuer({asset}) {
    let meta = useAssetMeta(asset)
    asset = AssetDescriptor.parse(asset)
    if (asset.isNative) {
        meta = {domain: 'stellar.org'}
    }
    return <span className="asset-issuer condensed">
        {meta?.domain ?
            <>{meta.domain}</> :
            <><AccountAddress account={asset.issuer} link={false} chars={8} icon={false}/></>}
    </span>
}

AssetIssuer.propTypes = {
    asset: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(AssetDescriptor)]).isRequired
}