import React from 'react'
import PropTypes from 'prop-types'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {useAssetMeta} from './asset-meta-hooks'

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

AssetIcon.propTypes = {
    asset: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(AssetDescriptor)]).isRequired,
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.any
}
