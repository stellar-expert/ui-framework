import React from 'react'
import {scValToBigInt} from 'stellar-base'
import {xdrParserUtils} from '@stellar-expert/tx-meta-effects-parser'
import {shortenString} from '@stellar-expert/formatter'
import {AccountAddress} from '../account/account-address'

export function ScVal({value, nested = false}) {
    if (!nested)
        return <code className="sc-val"><ScVal value={value} nested/></code>
    if (!value)
        return 'void'
    if (value instanceof Array)
        return <>[{value.map((v, i) => <>{i > 0 && ', '}<ScVal value={v} nested/></>)}]</>
    switch (value._arm) {
        case 'vec':
            return <>[{value._value.map((v, i) => <>{i > 0 && ', '}<ScVal value={v} nested/></>)}]</>
        case 'map':
            return <>&#123;
                {value._value.map((kv, i) => <>{i > 0 && ', '}<ScVal value={kv.key()} nested/>: <ScVal value={kv.val()} nested/></>)}
                &#125;</>
        case 'b':
            return <>value._value<ScValType type="bool"/></>
        case 'i32':
        case 'u32':
            return <>{value._value}<ScValType type={value._arm}/></>
        case 'i256':
        case 'u256':
        case 'i128':
        case 'u128':
        case 'i64':
        case 'u64':
        case 'timepoint':
        case 'duration':
            return <>{scValToBigInt(value).toString()}<ScValType type={value._arm}/></>
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
            return <><span className="condensed">{shortenString(asBytes, 86)}</span><ScValType type="bytes"/></>
        case 'str':
        case 'sym':
            return <>"{value._value.toString()}"<ScValType type={value._arm}/></>
        case 'nonceKey':
            return <>{value._value.nonce()._value.toString()}<ScValType type="nonce"/></>
        case 'instance':
            return <>{value._value.executable.wasmHash().toString('hex')}<ScValType type="wasm"/></>
        case 'error':
            const asError = value.toXDR('base64')
            return <><span className="condensed">{shortenString(asError, 50)}</span><ScValType type="error"/></>
        case 'contractId':
            return <AccountAddress account={xdrParserUtils.xdrParseContractAddress(value._value)}/>
        default:
            if (value.switch().name === 'scvVoid')
                return 'void'
            return <span className="dimmed">(unknown)</span>
    }
}

const ScValType = React.memo(function ({type}) {
    return <sub className="dimmed text-tiny" style={{padding: '0 0.2em'}}>{type}</sub>
})