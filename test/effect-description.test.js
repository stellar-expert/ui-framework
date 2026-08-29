import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {xdr} from '@stellar/stellar-sdk'
import effectTypes from '@stellar-expert/tx-meta-effects-parser/src/effect-types.js'
import {EffectDescription} from '../effect/effect-description'

const account = 'GBLWPGXVH47YGMODIUHZJ7FETRISFU3TB7JGADTRIMU36OLWJ7PYEZ6M'
const contract = 'CBZKN44ROE3F2P6XDIUQ675I2MTMVIQPMFKM75AZNS3MJ6VFMYVBESXW'
const owner = 'CATF2IK7TVCUHK4KMGNKBN2OBBAT5NA3JAPXY2DHS2U5QMFPDUWL5DTJ'
const pool = 'LB7X6737P57X6737P57X6737P57X6737P57X6737P57X6737P57X7OG2'
const wasmHash = 'ab'.repeat(32)
const prevWasmHash = 'cd'.repeat(32)

const operation = {operation: {sacMap: {}}}
const scValXdr = xdr.ScVal.scvSymbol('v').toXdr('base64')

const commonFields = {
    source: account,
    account,
    contract,
    owner,
    sponsor: account,
    prevSponsor: account,
    signer: account,
    inflationDestination: account,
    trustor: account,
    seller: account,
    asset: 'XLM',
    amount: '1',
    limit: '1',
    assets: [{asset: 'XLM', amount: '1'}, {asset: 'XLM', amount: '1'}],
    reserves: [{asset: 'XLM', amount: '1'}, {asset: 'XLM', amount: '1'}],
    shares: '1',
    accounts: 1,
    price: '1',
    pool,
    offer: '1',
    balance: '00000000178826fbfe339e1f5c53417c6fedfe2c05e8bec99b5abec810238d24acd6d0f0',
    flags: 1,
    thresholds: [1, 1, 1],
    home_domain: 'example.com',
    sequence: '1',
    name: 'k',
    value: 'v',
    weight: 1,
    wasmHash,
    tag: 'pocket',
    durability: 'persistent',
    key: xdr.ScVal.scvSymbol('k').toXdr('base64'),
    ttl: 1,
    keyHash: wasmHash,
    kind: 'contractData',
    function: 'transfer',
    rawArgs: [],
    rawTopics: [],
    rawData: xdr.ScVal.scvVoid().toXdr('base64'),
    charged: '1',
    bid: '1',
    depth: 0
}

//fields whose shape or meaning differs per effect type - `kind` is an executable kind for contract
//lifecycle effects but a ledger entry kind for setTtl, and offer/trade effects carry asset pairs
const typeOverrides = {
    trade: {asset: ['XLM', 'XLM'], amount: ['1', '1']},
    offerCreated: {asset: ['XLM', 'XLM']},
    offerUpdated: {asset: ['XLM', 'XLM']},
    contractCreated: {kind: 'wasm'},
    contractUpdated: {kind: 'wasm'},
    contractRestored: {kind: 'wasm'},
    contractDataCreated: {value: scValXdr},
    contractDataUpdated: {value: scValXdr},
    contractDataRestored: {value: scValXdr}
}

const describeEffect = effect => renderToStaticMarkup(React.createElement(EffectDescription, {effect, operation}))

describe('EffectDescription', () => {
    test('every effect type emitted by the parser has a renderer', () => {
        //contractMetrics is consumed by SorobanTxMetricsView before it reaches EffectDescription
        const types = Object.values(effectTypes).filter(t => t !== effectTypes.contractMetrics)
        expect(types.length).toBeGreaterThan(70)
        const unsupported = types.filter(type => describeEffect({...commonFields, ...typeOverrides[type], type})
            .includes('not supported'))
        expect(unsupported).toEqual([])
    })

    test('CAP-85 executable reference creation names the owner, tag and wasm', () => {
        const rendered = describeEffect({
            type: effectTypes.contractExecutableRefCreated,
            source: account,
            owner,
            tag: 'pocket',
            wasmHash,
            keyHash: wasmHash
        })
        expect(rendered).toContain('created')
        expect(rendered).toContain('pocket')
        expect(rendered).toContain(owner)
        expect(rendered).not.toContain('prevWasmHash')
    })

    test('CAP-85 executable reference update shows the previous wasm hash', () => {
        const rendered = describeEffect({
            type: effectTypes.contractExecutableRefUpdated,
            source: account,
            owner,
            tag: 'pocket',
            wasmHash,
            prevWasmHash,
            keyHash: wasmHash
        })
        expect(rendered).toContain('updated')
        expect(rendered).toContain('was')
        expect(rendered).toContain(prevWasmHash.substring(0, 8))
    })

    test('contract with an external executable renders the owner/tag pair', () => {
        const rendered = describeEffect({
            type: effectTypes.contractCreated,
            source: account,
            contract,
            kind: 'external',
            executableOwner: owner,
            executableTag: 'pocket',
            keyHash: wasmHash
        })
        expect(rendered).toContain('external reference')
        expect(rendered).toContain(owner)
        expect(rendered).toContain('pocket')
        expect(rendered).not.toContain('not supported')
    })

    test('contract kind that is not recognized falls back to a dimmed hint', () => {
        const rendered = describeEffect({type: effectTypes.contractCreated, source: account, contract, kind: 'nope'})
        expect(rendered).toContain('contract type not supported')
        expect(rendered).toContain('dimmed')
    })

    test('liquidity pool sponsorship effects are described', () => {
        expect(describeEffect({type: effectTypes.liquidityPoolSponsorshipCreated, source: account, sponsor: account, pool}))
            .toContain('sponsored liquidity')
        expect(describeEffect({type: effectTypes.liquidityPoolSponsorshipRemoved, source: account, prevSponsor: account, pool}))
            .toContain('revoked liquidity')
    })

    test('contract code removal is described', () => {
        expect(describeEffect({type: effectTypes.contractCodeRemoved, source: account, wasmHash, keyHash: wasmHash}))
            .toContain('removed')
    })

    test('unknown effect types still report as unsupported', () => {
        expect(describeEffect({type: 'somethingBrandNew', source: account})).toContain('not supported')
    })
})
