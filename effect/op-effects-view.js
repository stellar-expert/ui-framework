import React from 'react'
import {EffectDescription} from './effect-description'
import SorobanTxMetricsView from './soroban-tx-metrics-view'
import './op-effects.scss'

export function OpEffectsView({effects}) {
    if (!effects.length)
        return <div className="op-effects">
            <div className="dimmed">(no effects)</div>
        </div>
    return <div className="op-effects">
        {effects.map((e, i) => {
            if (e.type === 'contractMetrics')
                return null
            return <div key={i}>
                <i className={e.type === 'contractError' ? 'icon-warning' : 'icon-puzzle'}/> <EffectDescription effect={e}/>
            </div>
        })}
        <SorobanTxMetricsView metrics={effects.find(e => e.type === 'contractMetrics')}/>
    </div>
}