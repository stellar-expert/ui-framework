import React from 'react'
import {EffectDescription} from './effect-description'
import './op-effects.scss'

export function OpEffectsView({effects}) {
    return <div className="op-effects">
        {!effects.length ?
            <div className="dimmed">(no effects)</div> :
            effects.map(e => <div><i className="icon-puzzle"/> <EffectDescription effect={e}/></div>)}
    </div>
}