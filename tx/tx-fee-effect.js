import React from 'react'
import {Amount} from '../asset/amount'

export default function TxFeeEffect({feeEffect, compact}) {
    const {charged, bid, bump} = feeEffect
    if (charged)
        return <div>
            <Amount amount={charged} asset="XLM" issuer={!compact}/> transaction {!!bump && 'bump'} fee charged
        </div>
    return <div>
        Charge transaction {!!bump && 'bump'} fee <Amount amount={bid} asset="XLM" issuer={!compact}/>
    </div>
}