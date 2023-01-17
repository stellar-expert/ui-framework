import React from 'react'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {AccountAddress} from '../account/account-address'
import {useAssetMeta} from './asset-meta-hooks'

/**
 * Inline asset issuer
 * @param {String|AssetDescriptor|Asset} asset - Asset name/descriptor
 * @constructor
 */
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