import React from 'react'
import {AssetLink} from '../../asset/asset-link'
import {AssetSelector} from '../../asset/asset-selector'

export function AssetEditor({value, setValue}) {
    if (!setValue)
        return <AssetLink asset={value} link={false}/>
    return <AssetSelector value={value} onChange={setValue} title={value ? undefined : 'Choose asset'} expanded/>
}