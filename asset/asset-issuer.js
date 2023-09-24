import React from 'react'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {AccountAddress} from '../account/account-address'
import {useAssetMeta} from './asset-meta-hooks'

/**
 * Inline asset issuer
 * @param {String|AssetDescriptor|Asset} asset - Asset name/descriptor
 * @constructor
 */
export const AssetIssuer = React.memo(function AssetIssuer({asset}) {
    let meta = useAssetMeta(asset)
    if (asset === 'XLM' || asset.isNative) {
        meta = {domain: 'stellar.org'}
    }
    asset = AssetDescriptor.parse(asset)
    return <span className="asset-issuer condensed">
        {meta?.domain ?
            <>{meta.domain}</> :
            <><AccountAddress account={asset.issuer} link={false} chars={8} icon={false}/></>}
    </span>
})