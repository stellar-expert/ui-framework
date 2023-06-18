import React from 'react'
import {Amount} from '../asset/amount'
import {retrieveOpBalanceChanges} from './parser/op-balance-changes'

/**
 * Compact accounting effects (credited/debited amounts)
 * @param {OperationDescriptor} op
 * @constructor
 */
export function OpAccountingChanges({op}) {
    const changes = retrieveOpBalanceChanges(op)
    return <div className="accounting-effects condensed">
        {changes.map((ch, i) => <div key={op.txHash + op.order + i}
                                     className={ch.type === 'accountDebited' ? 'dimmed' : 'color-success'}>
            {ch.type === 'accountDebited' ? '-' : '+'}
            <Amount amount={ch.amount} asset={ch.asset} issuer={false} icon={false}/>
        </div>)}
    </div>
}

export function TxFeeAccountingChanges({amount}) {
    return <div className="accounting-effects condensed">
        <div className="dimmed">
            -<Amount amount={amount} asset="XLM" issuer={false} icon={false}/>
        </div>
    </div>
}