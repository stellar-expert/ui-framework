import React from 'react'
import cn from 'classnames'
import {EffectDescription} from './effect-description'
import SorobanTxMetricsView from './soroban-tx-metrics-view'
import './op-effects.scss'

export function OpEffectsView({operation}) {
    const effects = getEffects(operation)
    if (!effects.length)
        return <div className="op-effects">
            <div className="dimmed">(no effects)</div>
        </div>
    return <div className="op-effects">
        {effects.map((e, i) => {
            if (e.type === 'contractMetrics')
                return null
            return <div key={i}>
                <i className={cn('effect-icon', e.type === 'contractError' ? 'icon-warning' : 'icon-puzzle')}/>&thinsp;
                <EffectDescription effect={e} operation={operation}/>
            </div>
        })}
        <SorobanTxMetricsView metrics={effects.find(e => e.type === 'contractMetrics')}/>
    </div>
}

function getEffects(op) {
    let {effects} = op.operation
    if (op.operation.type === 'invokeHostFunction')
        return sortContractEffects([...effects])
    return effects
}

function sortContractEffects(effects) {
    effects.sort((a, b) => {
        const aInvocation = a.type === 'contractInvoked'
        const bInvocation = b.type === 'contractInvoked'
        if (aInvocation && bInvocation)
            return 0
        if (!aInvocation && !bInvocation) {
            const aData = a.type.startsWith('contractData')
            const bData = b.type.startsWith('contractData')
            if (aData === bData)
                return 0
            return aData ? 1 : -1
        }
        return aInvocation ? -1 : 1
    })
    return effects
}