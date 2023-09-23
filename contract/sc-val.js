import React from 'react'
import {scValToBigInt} from 'stellar-sdk'
import {xdrParserUtils} from '@stellar-expert/tx-meta-effects-parser'
import {AccountAddress} from '../account/account-address'

export function ScVal({value, nested = false}) {
    if (!nested)
        return <code className="sc-val"><ScVal value={value} nested/></code>
    if (!value)
        return 'void'
    if (value instanceof Array)
        return <>[{value.map(v => <><ScVal value={v} nested/>, </>)}]</>
    switch (value._arm) {
        case 'vec':
            return <>[{value.map(v => <><ScVal value={v} nested/>, </>)}]</>
        case 'map':
            return <>&#123;
                {value._value.map(entry => <><ScVal value={entry.key()} nested/>: <ScVal value={entry.value()} nested/>, </>)}
                &#125;</>
        case 'b':
            return value._value
        case 'i32':
        case 'u32':
            return <>{value._value}<span className="dimmed text-tiny">{value._arm}</span></>
        case 'i256':
        case 'u256':
        case 'i128':
        case 'u128':
        case 'i64':
        case 'u64':
        case 'timepoint':
        case 'duration':
            return <>{scValToBigInt(value).toString()}<span className="dimmed text-tiny">{value._arm}</span></>
        case 'address':
            switch (value._value._arm) {
                case 'accountId':
                    return <AccountAddress account={xdrParserUtils.xdrParseAccountAddress(value._value.value())}/>
                case 'contractId':
                    return <AccountAddress account={xdrParserUtils.xdrParseContractAddress(value._value.value())}/>
            }
            return <span className="dimmed">(unsupported address)</span>
        case 'bytes':
            const asBytes = value._value.toString('base64')
            return <>
                <span className="condensed">{asBytes.length > 86 ? asBytes.slice(0, 80) + '…' : asBytes}</span>
                <span className="dimmed text-tiny">bytes</span>
            </>
        case 'str':
        case 'sym':
            return `"${value._value.toString()}"`
        case 'nonceKey':
            return <>{value._value.nonce()._value.toString()}<span className="dimmed text-tiny">nonce</span></>
        case 'instance':
            return <>{value._value.executable.wasmHash().toString('hex')}<span className="dimmed text-tiny">wasm</span></>
        case 'error':
            const asError = value.toXDR('base64')
            return  <>
                <span className="condensed">{asError.length > 60? asError.slice(0, 50) + '…' : asError}</span>
                <span className="dimmed text-tiny">error</span>
            </>
        case 'contractId':
            return <AccountAddress account={xdrParserUtils.xdrParseContractAddress(value._value)}/>
        default:
            if (value.switch().name === 'scvVoid')
                return 'void'
            return <span className="dimmed">(unknown)</span>
    }
}