import React from 'react'
import cn from 'classnames'
import {xdr, scValToBigInt} from '@stellar/stellar-sdk'
import {xdrParserUtils} from '@stellar-expert/tx-meta-effects-parser'
import {shortenString} from '@stellar-expert/formatter'
import {AccountAddress} from '../account/account-address'
import './sc-val.scss'

const scalarTypeLabels = {
    scvI32: 'i32',
    scvU32: 'u32',
    scvI64: 'i64',
    scvU64: 'u64',
    scvI128: 'i128',
    scvU128: 'u128',
    scvI256: 'i256',
    scvU256: 'u256',
    scvTimepoint: 'timepoint',
    scvDuration: 'duration'
}

/**
 * Renders a Stellar smart contract value (ScVal) in a human-readable format
 * @param {Object} props
 * @param {string|xdr.ScVal|Array} props.value - ScVal as base64 XDR string, parsed XDR object, or array
 * @param {boolean} [props.nested=false] - Whether this is a nested rendering (internal use)
 * @param {boolean} [props.indent=false] - Enable block-level indentation for nested structures
 * @param {boolean} [props.wrapObjects=true] - Wrap maps and arrays with brackets
 */
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
    switch (value.type) {
        case 'scvVec': {
            return <>[{value.vec.map((v, i) => <ScValStruct key={i} indent={indent} separate={value.vec.length - i}>
                <ScVal value={v} indent={indent} nested/>
            </ScValStruct>)}]</>
        }
        case 'scvMap': {
            const values = value.map.map((kv, i) =>
                <ScValStruct key={i} indent={indent} separate={value.map.length - i}>
                    <ScVal value={kv.key} indent={indent} nested/>: <ScVal value={kv.val} indent={indent} nested/>
                </ScValStruct>)
            return wrapObjects ? <>&#123;{values}&#125;</> : <>{values}</>
        }
        case 'scvBool':
            return <>{value.b.toString()}<ScValType type="bool"/></>
        case 'scvI32':
        case 'scvU32':
            return <>{value.value}<ScValType type={scalarTypeLabels[value.type]}/></>
        case 'scvI256':
        case 'scvU256':
        case 'scvI128':
        case 'scvU128':
        case 'scvI64':
        case 'scvU64':
        case 'scvTimepoint':
        case 'scvDuration':
            return <>{scValToBigInt(value).toString()}<ScValType type={scalarTypeLabels[value.type]}/></>
        case 'scvAddress':
            try {
                return <AccountAddress account={xdrParserUtils.xdrParseScAddress(value.address)}/>
            } catch (e) {
                return <span className="dimmed">(unsupported address)</span>
            }
        case 'scvBytes': {
            //BytesValue.toString() ignores its argument and always yields hex - encode explicitly for base64
            const asBytes = xdr.encodeBytes(value.bytes.toBytes(), 'base64')
            return <><span className="condensed">{shortenString(asBytes, 86)}</span><ScValType type="bytes"/></>
        }
        case 'scvString':
            return <span className="word-break">"{value.str.toString()}"<ScValType type="str"/></span>
        case 'scvSymbol':
            return <span className="word-break">"{value.sym.toString()}"<ScValType type="sym"/></span>
        case 'scvLedgerKeyNonce':
            return <>{value.nonceKey.nonce.toString()}<ScValType type="nonce"/></>
        case 'scvContractInstance': {
            const {executable} = value.instance
            switch (executable.type) {
                case 'contractExecutableStellarAsset':
                    return <span>StellarAsset<ScValType type="instance"/></span>
                case 'contractExecutableWasm':
                    //BytesValue.toString() renders hex
                    return <span className="word-break">{executable.wasmHash.toString()}<ScValType type="wasm"/></span>
                case 'contractExecutableExternalRef': {
                    //CAP-85 - the executable lives in another contract under a named tag instead of this instance entry
                    const {executableOwner, tag} = executable.externalRef
                    return <span className="word-break">
                        <AccountAddress account={xdrParserUtils.xdrParseScAddress(executableOwner)}/>/{tag.toString()}
                        <ScValType type="ref"/>
                    </span>
                }
                default:
                    return <span className="dimmed">(unknown executable)</span>
            }
        }
        case 'scvExecutableTag':
            return <span className="word-break">"{value.executableTag.toString()}"<ScValType type="tag"/></span>
        case 'scvError': {
            const errMessage = value.toXdr('base64')
            return <><span className="condensed" title={errMessage}>{shortenString(errMessage, 50)}</span><ScValType type="error"/></>
        }
        case 'scvVoid':
            return '()'
        case 'scvLedgerKeyContractInstance':
            return '<LedgerKeyContractInstance>'
        default:
            return <span className="dimmed">(unknown)</span>
    }
})

/**
 * Parse a base64-encoded XDR ScVal string into an xdr.ScVal object
 * @param {string} value - Base64-encoded XDR string
 * @return {xdr.ScVal}
 */
export function parseScValValue(value) {
    return xdr.ScVal.fromXDR(value, 'base64')
}

const ScValType = React.memo(function ScValType({type}) {
    return <sub className="dimmed text-tiny" style={{padding: '0 0.2em'}}>{type}</sub>
})

/**
 * Structural wrapper for ScVal elements, handling indentation and separators
 * @param {Object} props
 * @param {boolean} [props.indent] - Enable block-level indentation
 * @param {*} props.children - Nested content
 * @param {number} [props.separate] - Show comma separator when > 1
 */
export const ScValStruct = React.memo(function ScValStruct({indent, children, separate}) {
    const separator = separate > 1 ? <>, </> : null
    if (!indent)
        return <>{children}{separator}</>
    return <div className="block-indent">
        {children}{separator}
    </div>
})

/**
 * Contract interface spec types that render inline on a single line.
 * Values match the type names produced by `parseContractMetadata` (integers and booleans lowercased,
 * every other type name derived from its `scSpecType` prefix), not ScVal XDR arm names.
 * @type {Set<string>}
 */
export const primitiveTypes = new Set(['bool', 'i32', 'u32', 'i64', 'u64', 'i128', 'u128', 'I256', 'U256',
    'Address', 'MuxedAddress', 'Bytes', 'String', 'Symbol', 'Timepoint', 'Duration', 'Void', 'Error'])
