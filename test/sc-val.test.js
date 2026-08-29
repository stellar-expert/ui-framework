import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {Keypair, ScInt, StrKey, xdr} from '@stellar/stellar-sdk'
import {ScVal, parseScValValue, primitiveTypes} from '../contract/sc-val'
import {sacInterface} from '../contract/sac-interface'

const render = value => renderToStaticMarkup(React.createElement(ScVal, {value}))
//strip markup and decode entities so assertions read against the visible text
const text = value => render(value)
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/&amp;/g, '&')

describe('ScVal rendering', () => {
    test('scalars render with their type label', () => {
        expect(text(xdr.ScVal.scvU32(42))).toBe('42u32')
        expect(text(xdr.ScVal.scvI32(-7))).toBe('-7i32')
        expect(text(xdr.ScVal.scvBool(true))).toBe('truebool')
        expect(text(xdr.ScVal.scvVoid())).toBe('()')
    })

    test('64/128/256-bit integers render their full value', () => {
        expect(text(xdr.ScVal.scvI64(-9007199254740993n))).toBe('-9007199254740993i64')
        expect(text(xdr.ScVal.scvU64(18446744073709551615n))).toBe('18446744073709551615u64')
        expect(text(xdr.ScVal.scvTimepoint(1893456000n))).toBe('1893456000timepoint')
        expect(text(xdr.ScVal.scvDuration(3600n))).toBe('3600duration')
    })

    test('128/256-bit integers render their full value', () => {
        const big = 170141183460469231731687303715884105727n
        expect(text(new ScInt(big, {type: 'i128'}).toScVal())).toBe(`${big}i128`)
        expect(text(new ScInt(big, {type: 'u128'}).toScVal())).toBe(`${big}u128`)
        expect(text(new ScInt(big, {type: 'u256'}).toScVal())).toBe(`${big}u256`)
        expect(text(new ScInt(-1n, {type: 'i256'}).toScVal())).toBe('-1i256')
    })

    test('strings and symbols are quoted', () => {
        expect(text(xdr.ScVal.scvString('hello'))).toBe('"hello"str')
        expect(text(xdr.ScVal.scvSymbol('transfer'))).toBe('"transfer"sym')
    })

    test('bytes render as base64, not hex', () => {
        //BytesValue.toString('base64') silently ignores its argument and returns hex
        expect(text(xdr.ScVal.scvBytes(new Uint8Array([0xde, 0xad, 0xbe, 0xef])))).toBe('3q2+7w==bytes')
        expect(text(xdr.ScVal.scvBytes(new Uint8Array([0xde, 0xad, 0xbe, 0xef])))).not.toContain('deadbeef')
    })

    test('vectors render their elements', () => {
        expect(text(xdr.ScVal.scvVec([xdr.ScVal.scvU32(1), xdr.ScVal.scvU32(2)]))).toBe('[1u32, 2u32]')
    })

    test('empty vector', () => {
        expect(text(xdr.ScVal.scvVec([]))).toBe('[]')
    })

    test('maps render key: value pairs', () => {
        const map = xdr.ScVal.scvMap([
            new xdr.ScMapEntry({key: xdr.ScVal.scvSymbol('amount'), val: xdr.ScVal.scvU32(5)})
        ])
        expect(text(map)).toBe('{"amount"sym: 5u32}')
    })

    test('nested structures recurse', () => {
        expect(text(xdr.ScVal.scvVec([xdr.ScVal.scvVec([xdr.ScVal.scvU32(1)])]))).toBe('[[1u32]]')
    })

    test('a plain array of ScVals renders as a list', () => {
        expect(text([xdr.ScVal.scvU32(1), xdr.ScVal.scvSymbol('x')])).toBe('[1u32, "x"sym]')
    })

    test('account addresses decode to a G-strkey', () => {
        const kp = Keypair.random()
        const scv = xdr.ScVal.scvAddress(
            xdr.ScAddress.scAddressTypeAccount(xdr.PublicKey.publicKeyTypeEd25519(kp.rawPublicKey())))
        expect(render(scv)).toContain(kp.publicKey())
    })

    test('contract addresses decode to a C-strkey', () => {
        const raw = new Uint8Array(32).fill(3)
        const scv = xdr.ScVal.scvAddress(xdr.ScAddress.scAddressTypeContract(raw))
        expect(render(scv)).toContain(StrKey.encodeContract(raw))
    })

    test('contract instance renders the wasm hash as hex', () => {
        const scv = xdr.ScVal.scvContractInstance(new xdr.ScContractInstance({
            executable: xdr.ContractExecutable.contractExecutableWasm(new Uint8Array(32).fill(0xab)),
            storage: null
        }))
        const out = text(scv)
        expect(out).toContain('ab'.repeat(32))
        expect(out).toContain('wasm')
        expect(out).not.toContain(',')
    })

    test('stellar asset contract instance is labelled', () => {
        const scv = xdr.ScVal.scvContractInstance(new xdr.ScContractInstance({
            executable: xdr.ContractExecutable.contractExecutableStellarAsset(),
            storage: null
        }))
        expect(text(scv)).toBe('StellarAssetinstance')
    })

    test('CAP-85 external ref instance renders the owner contract and tag', () => {
        const owner = new Uint8Array(32).fill(0xcd)
        const scv = xdr.ScVal.scvContractInstance(new xdr.ScContractInstance({
            executable: xdr.ContractExecutable.contractExecutableExternalRef(new xdr.ContractExecutableExternalRef({
                executableOwner: xdr.ScAddress.scAddressTypeContract(owner),
                tag: 'pocket'
            })),
            storage: null
        }))
        expect(render(scv)).toContain(StrKey.encodeContract(owner))
        expect(text(scv)).toContain('/pocket')
        expect(text(scv)).not.toContain('(unknown executable)')
    })

    test('CAP-85 executable tag renders as a quoted tag name', () => {
        expect(text(xdr.ScVal.scvExecutableTag('pocket'))).toBe('"pocket"tag')
    })

    test('ledger key nonce renders the nonce value', () => {
        expect(text(xdr.ScVal.scvLedgerKeyNonce(new xdr.ScNonceKey({nonce: 987654321n})))).toBe('987654321nonce')
    })

    test('ledger key contract instance', () => {
        expect(text(xdr.ScVal.scvLedgerKeyContractInstance())).toBe('<LedgerKeyContractInstance>')
    })

    test('accepts a base64 XDR string', () => {
        expect(text(xdr.ScVal.scvU32(42).toXdr('base64'))).toBe('42u32')
    })

    test('renders void for an empty value', () => {
        expect(renderToStaticMarkup(React.createElement(ScVal, {value: null, nested: true}))).toBe('void')
    })

    test('every ScVal arm renders without throwing', () => {
        const samples = [
            xdr.ScVal.scvBool(false), xdr.ScVal.scvVoid(), xdr.ScVal.scvU32(1), xdr.ScVal.scvI32(1),
            xdr.ScVal.scvU64(1n), xdr.ScVal.scvI64(1n), xdr.ScVal.scvTimepoint(1n), xdr.ScVal.scvDuration(1n),
            new ScInt(1n, {type: 'u128'}).toScVal(), new ScInt(1n, {type: 'i128'}).toScVal(),
            new ScInt(1n, {type: 'u256'}).toScVal(), new ScInt(1n, {type: 'i256'}).toScVal(),
            xdr.ScVal.scvBytes(new Uint8Array([1])), xdr.ScVal.scvString('s'), xdr.ScVal.scvSymbol('s'),
            xdr.ScVal.scvVec([]), xdr.ScVal.scvMap([]), xdr.ScVal.scvLedgerKeyContractInstance(),
            xdr.ScVal.scvExecutableTag('tag')
        ]
        for (const sample of samples) {
            expect(() => render(sample)).not.toThrow()
            expect(text(sample)).not.toContain('(unknown)')
        }
    })
})

describe('parseScValValue', () => {
    test('round-trips a base64 XDR string', () => {
        const parsed = parseScValValue(xdr.ScVal.scvSymbol('hi').toXdr('base64'))
        expect(parsed.type).toBe('scvSymbol')
        expect(parsed.value).toBe('hi')
    })
})

describe('primitiveTypes', () => {
    test('holds contract spec type names, not ScVal arm names', () => {
        //the set is matched against parseContractMetadata output, which spells non-integer types in PascalCase
        for (const t of ['Address', 'String', 'Symbol', 'Bytes', 'bool', 'i128', 'u32', 'U256'])
            expect(primitiveTypes.has(t)).toBe(true)
        //old ScVal arm spellings must no longer be present
        for (const t of ['b', 'str', 'sym', 'address', 'bytes', 'nonceKey', 'instance', 'contractId'])
            expect(primitiveTypes.has(t)).toBe(false)
    })

    test('compound spec types are not primitive', () => {
        expect(primitiveTypes.has('Vec<u32>')).toBe(false)
        expect(primitiveTypes.has('Map<Symbol, i128>')).toBe(false)
    })
})

describe('sacInterface', () => {
    test('declares inputs as arrays of {name, type}', () => {
        for (const fd of Object.values(sacInterface.functions)) {
            expect(Array.isArray(fd.inputs)).toBe(true)
            for (const input of fd.inputs) {
                expect(typeof input.name).toBe('string')
                expect(typeof input.type).toBe('string')
            }
            expect(typeof fd.doc).toBe('string')
        }
    })

    test('input types line up with primitiveTypes', () => {
        //invocation-info-view calls fd.inputs.some(i => !primitiveTypes.has(i.type)) - every SAC arg is a scalar
        for (const fd of Object.values(sacInterface.functions))
            for (const input of fd.inputs)
                expect(primitiveTypes.has(input.type)).toBe(true)
    })

    test('transfer exposes the expected signature', () => {
        expect(sacInterface.functions.transfer.inputs.map(i => i.name)).toEqual(['from', 'to', 'amount'])
        expect(sacInterface.functions.decimals.inputs).toEqual([])
    })
})
