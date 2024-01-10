import React from 'react'
import {xdr, scValToBigInt} from '@stellar/stellar-base'
import {xdrParserUtils} from '@stellar-expert/tx-meta-effects-parser'
import {shortenString} from '@stellar-expert/formatter'
import {AccountAddress} from '../account/account-address'
import './sc-val.scss'

export const ScVal = React.memo(function ScVal({value, nested = false, indent = false}) {
    if (!nested)
        return <code className="sc-val"><ScVal value={value} indent={indent} nested/></code>
    if (!value)
        return 'void'
    if (typeof value === 'string') {
        value = xdr.ScVal.fromXDR(value, 'base64')
    }
    if (value instanceof Array)
        return <>[{value.map((v, i) => <ScValStruct key={i} indent={indent} separate={value.length - i}>
            <ScVal value={v} indent={indent} nested/>
        </ScValStruct>)}]</>
    const val = value._value
    switch (value._arm) {
        case 'vec':
            return <>[{val.map((v, i) => <ScValStruct key={i} indent={indent} separate={val.length - i}>
                <ScVal value={v} indent={indent} nested/>
            </ScValStruct>)}]</>
        case 'map':
            return <>&#123;{val.map((kv, i) =>
                <ScValStruct key={i} indent={indent} separate={val.length - i}>
                    <ScVal value={kv.key()} indent={indent} nested/>: <ScVal value={kv.val()} indent={indent} nested/>
                </ScValStruct>)}
                &#125;</>
        case 'b':
            return <>{val.toString()}<ScValType type="bool"/></>
        case 'i32':
        case 'u32':
            return <>{val}<ScValType type={value._arm}/></>
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
            switch (val._arm) {
                case 'accountId':
                    return <AccountAddress account={xdrParserUtils.xdrParseAccountAddress(val.value())}/>
                case 'contractId':
                    return <AccountAddress account={xdrParserUtils.xdrParseContractAddress(val.value())}/>
            }
            return <span className="dimmed">(unsupported address)</span>
        case 'bytes':
            const asBytes = val.toString('base64')
            return <><span className="condensed">{shortenString(asBytes, 86)}</span><ScValType type="bytes"/></>
        case 'str':
        case 'sym':
            return <>"{val.toString()}"<ScValType type={value._arm}/></>
        case 'nonceKey':
            return <>{val.nonce()._value.toString()}<ScValType type="nonce"/></>
        case 'instance':
            return <>{val.executable.wasmHash().toString('hex')}<ScValType type="wasm"/></>
        case 'error':
            const errMessage = value.toXDR('base64')
            return <><span className="condensed" title={errMessage}>{shortenString(errMessage, 50)}</span><ScValType type="error"/></>
        case 'contractId':
            return <AccountAddress account={xdrParserUtils.xdrParseContractAddress(value._value)}/>
        default:
            if (value.switch().name === 'scvVoid')
                return '()'
            return <span className="dimmed">(unknown)</span>
    }
})

const ScValType = React.memo(function ScValType({type}) {
    return <sub className="dimmed text-tiny" style={{padding: '0 0.2em'}}>{type}</sub>
})

const ScValStruct = React.memo(function ScValStruct({indent, children, separate}) {
    const separator = separate > 1 ? <>, </> : null
    if (!indent)
        return <>{children}{separator}</>
    return <div className="block-indent">
        {children}{separator}
    </div>
})