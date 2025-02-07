import React from 'react'
import cn from 'classnames'
import {xdr, scValToBigInt} from '@stellar/stellar-base'
import {xdrParserUtils} from '@stellar-expert/tx-meta-effects-parser'
import {shortenString} from '@stellar-expert/formatter'
import {AccountAddress} from '../account/account-address'
import './sc-val.scss'

export const ScVal = React.memo(function ScVal({value, nested = false, indent = false, wrapObjects = true}) {
    if (!nested)
        return <code className={cn('sc-val', {block: indent})}><ScVal value={value} indent={indent} nested/></code>
    if (!value)
        return 'void'
    if (typeof value === 'string') {
        value = xdr.ScVal.fromXDR(value, 'base64')
    }
    if (value instanceof Array) {
        const values = value.map((v, i) => <ScValStruct key={i} indent={indent} separate={value.length - i}>
            <ScVal value={v} indent={indent} nested/>
        </ScValStruct>)
        return wrapObjects ? <>[{values}]</> : <>{values}</>
    }
    const val = value._value
    switch (value._arm) {
        case 'vec':
            return <>[{val.map((v, i) => <ScValStruct key={i} indent={indent} separate={val.length - i}>
                <ScVal value={v} indent={indent} nested/>
            </ScValStruct>)}]</>
        case 'map':
            const values = val.map((kv, i) =>
                <ScValStruct key={i} indent={indent} separate={val.length - i}>
                    <ScVal value={kv.key()} indent={indent} nested/>: <ScVal value={kv.val()} indent={indent} nested/>
                </ScValStruct>)
            return wrapObjects ? <>&#123;{values}&#125;</> : <>{values}</>
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
            return <span className="word-break">"{val.toString()}"<ScValType type={value._arm}/></span>
        case 'nonceKey':
            return <>{val.nonce()._value.toString()}<ScValType type="nonce"/></>
        case 'instance':
            if (val._attributes.executable._switch.name==="contractExecutableStellarAsset")
                return <span>StellarAsset<ScValType type="instance"/></span>
            return <span className="word-break">{val._attributes.executable.wasmHash().toString('hex')}<ScValType type="wasm"/></span>
        case 'error':
            const errMessage = value.toXDR('base64')
            return <><span className="condensed" title={errMessage}>{shortenString(errMessage, 50)}</span><ScValType type="error"/></>
        case 'contractId':
            return <AccountAddress account={xdrParserUtils.xdrParseContractAddress(value._value)}/>
        default:
            switch (value._switch.name) {
                case 'scvVoid':
                    return '()'
                case 'scvContractInstance':
                    return '<ContractInstance>'
                case 'scvLedgerKeyContractInstance':
                    return '<LedgerKeyContractInstance>'
                case 'scvLedgerKeyNonce':
                    return '<LedgerKeyNonce>'
            }
            return <span className="dimmed">(unknown)</span>
    }
})

export function parseScValValue(value) {
    return xdr.ScVal.fromXDR(value, 'base64')
}

const ScValType = React.memo(function ScValType({type}) {
    return <sub className="dimmed text-tiny" style={{padding: '0 0.2em'}}>{type}</sub>
})

export const ScValStruct = React.memo(function ScValStruct({indent, children, separate}) {
    const separator = separate > 1 ? <>, </> : null
    if (!indent)
        return <>{children}{separator}</>
    return <div className="block-indent">
        {children}{separator}
    </div>
})

export const primitiveTypes = new Set(['b', 'i32', 'u32', 'i256', 'u256', 'i128', 'u128', 'i64', 'u64', 'timepoint', 'duration', 'address', 'bytes', 'str', 'sym', 'nonceKey', 'contractId', 'instance'])