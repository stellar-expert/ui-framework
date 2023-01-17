import React from 'react'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {useAssetMeta} from './asset-meta-hooks'

/**
 * Inline asset icon
 * @param {String|AssetDescriptor|Asset} asset - Asset name/descriptor
 * @param {String} className? - Optional CSS class name
 * @param {{}} style? - Optional CSS inline style
 * @param {*} children? - Optional inner text
 * @constructor
 */
export function AssetIcon({asset, className, style, children}) {
    const meta = useAssetMeta(asset)
    const icon = meta?.toml_info?.image || meta?.toml_info?.orgLogo
    const classes = ['asset-icon']
    if (!style) {
        style = {}
    }

    if (className) {
        classes.push(className)
    }

    if (asset.toString() === 'XLM') { // native asset
        classes.push('icon icon-stellar')
    } else if (icon) { // asset with an icon
        style.backgroundImage = `url('${icon}')`
    } else { // asset without metadata
        classes.push('icon icon-empty-circle')
    }

    return <span className={classes.join(' ')} style={style}>{children}</span>
}
